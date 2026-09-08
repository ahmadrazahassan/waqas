"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { REFERRAL_COOKIE, normaliseCode } from "@/lib/referral/code";
import { route } from "@/lib/routes";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

/* -------------------------------------------------------------------------- */
/* Schemas. The same shapes the client validates against, enforced again here  */
/* because a client side check is a convenience, never a control.              */
/* -------------------------------------------------------------------------- */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("That does not look like an email address.");

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Tell us what to call you.").max(80),
  email,
  password: z.string().min(10, "Use at least 10 characters. Length beats symbols."),
  country_code: z.string().length(2).default("PK"),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Supabase Auth returns developer strings. Members get something actionable. */
function humanAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There is already an account with that email. Try logging in instead.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That email address was rejected. Check the spelling, and note that made up domains are not accepted.";
  }
  if (m.includes("weak") || m.includes("pwned")) {
    return "That password has appeared in a known breach. Pick a different one.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Too many attempts in a short window. Wait a minute and try again.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "New accounts are paused at the moment. Get in touch and we will tell you when they reopen.";
  }

  return "We could not create the account just now. Try again in a moment, and tell us if it keeps happening.";
}

/* -------------------------------------------------------------------------- */

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    country_code: formData.get("country_code") || "PK",
  });

  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  let userId: string | null = null;

  /**
   * Signing up sends no email and involves no waiting.
   *
   * Supabase's own mailer allows only a couple of messages an hour, so any
   * flow that emails on signup queues members behind a ceiling they cannot
   * see and cannot do anything about. Creating the account already confirmed
   * skips the email entirely, so there is nothing to rate limit.
   *
   * The security this gives up is small here, because an unverified account
   * cannot earn anyone anything: commission only fires on a payment a human
   * has matched against the bank. Email gets verified later, at payout time,
   * alongside the identity check that already gates withdrawals.
   */
  if (hasServiceRole()) {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        country_code: parsed.data.country_code,
      },
    });

    if (error) return { error: humanAuthError(error.message) };
    userId = data.user?.id ?? null;
  } else {
    // No service role key yet, so fall back to the ordinary flow. That one
    // may send a confirmation email and is therefore subject to the limit.
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.full_name,
          country_code: parsed.data.country_code,
        },
      },
    });

    if (error) return { error: humanAuthError(error.message) };
    userId = data.user?.id ?? null;
  }

  if (!userId) return { error: "Could not create the account. Try again." };

  // Attach the sponsor. First touch wins: the httpOnly cookie set by /r/[code]
  // is the source of truth, never anything in the form.
  //
  // This needs the service role because a new member cannot write referred_by
  // on their own row. The column locks the moment it is set, and letting
  // members set it themselves would make commission reassignable.
  const jar = await cookies();
  const rawCode = jar.get(REFERRAL_COOKIE)?.value;

  if (rawCode && hasServiceRole()) {
    const code = normaliseCode(rawCode);
    const admin = createAdminClient();

    const { data: sponsor } = await admin
      .from("profiles")
      .select("id, status")
      .eq("referral_code", code)
      .maybeSingle();

    if (sponsor && sponsor.status === "active" && sponsor.id !== userId) {
      await admin
        .from("profiles")
        .update({ referred_by: sponsor.id })
        .eq("id", userId)
        .is("referred_by", null);

      await admin
        .from("referral_attributions")
        .update({
          converted_user_id: userId,
          converted_at: new Date().toISOString(),
        })
        .eq("first_code", code)
        .is("converted_user_id", null);
    }
  }

  // Sign them in so they land in the dashboard rather than on a login screen.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    // The account exists, so send them to log in rather than losing the work.
    redirect("/login?created=1");
  }

  redirect("/dashboard?welcome=1");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Deliberately vague: saying which half was wrong tells an attacker
    // whether an address is registered here.
    return { error: "That email and password combination did not work." };
  }

  const next = String(formData.get("next") || "/dashboard");
  redirect(route(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
