"use server";

import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { memberHasAccess } from "@/lib/payment-access";
import { redirect } from "next/navigation";
import { parseTaskBrief, validateTaskWork } from "@/lib/task-brief";
import { normalisePhone } from "@/lib/phone";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export type ActionState = { error?: string; ok?: string };

/* ------------------------------------------------------------- claim task -- */

export async function claimTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!taskId) return { error: "Missing task." };

  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };
  if (!(await memberHasAccess(user))) return { error: "Your payment must be verified before you can claim tasks. Visit Plans & payments to check activation." };

  const supabase = await createClient();

  // Read the task through RLS. If the rank gate or the access window excludes
  // this member, the row simply is not there and there is nothing to claim.
  const { data: task } = await supabase
    .from("tasks")
    .select("id, due_hours, status, max_claims, claims_used, min_rank_id, currency")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return { error: "That task is not available to you." };
  }
  if (task.status !== "open") {
    return { error: "That task is no longer open." };
  }
  if (task.currency !== "PKR") return { error: "This task’s PKR payout must be confirmed before claims open." };
  if (task.min_rank_id > user.profile.rank_id || task.claims_used >= task.max_claims) return { error: "This task is not available at your rank or has no spaces left." };
  const { data: existing } = await supabase.from("task_claims").select("id").eq("task_id",task.id).eq("user_id",user.id).maybeSingle();
  if (existing) redirect(`/dashboard/tasks/${task.id}`);

  // Monthly quota. The plan sets it; null means unlimited.
  const { data: membership } = await supabase
    .from("memberships")
    .select("plans(monthly_claims)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  const quota = (membership as { plans?: { monthly_claims: number | null } } | null)
    ?.plans?.monthly_claims;

  if (quota === undefined) {
    return { error: "You need an active plan to claim tasks." };
  }

  if (quota !== null) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("claimed_at", monthStart.toISOString());

    if ((count ?? 0) >= quota) {
      return {
        error: `You have used all ${quota} claims this month. They reset on the 1st.`,
      };
    }
  }

  const dueAt = new Date(Date.now() + task.due_hours * 3_600_000).toISOString();

  const { error } = await supabase
    .from("task_claims")
    .insert({ task_id: taskId, user_id: user.id, due_at: dueAt });

  if (error) {
    // The old catch-all said "it may have just filled up" for every failure,
    // including permission errors. That sent people to re-read a task that was
    // never the problem, and it hid the real cause from us as well.
    console.error("[claimTask] insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      taskId,
      userId: user.id,
    });

    switch (error.code) {
      case "23505":
        return { error: "You have already claimed this one." };
      case "23503":
        return { error: "That task no longer exists. Refresh the list." };
      case "42501":
        // RLS refused the insert. Almost always a membership that is active in
        // the UI but not verified by the database gate.
        return {
          error:
            "Your account is not cleared to claim tasks yet. If your payment shows as verified, contact support and quote this task, because the two records disagree.",
        };
      case "P0001":
        // A trigger raised. Its message is written for a member, so show it.
        return { error: error.message };
      default:
        return {
          error: `Could not claim it (${error.code ?? "unknown"}). Nothing has been charged or reserved. Try again, and tell support if it keeps happening.`,
        };
    }
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect(`/dashboard/tasks/${task.id}`);
}

/* --------------------------------------------------------------- submit ---- */

const submissionSchema = z.object({
  claim_id: z.string().uuid(),
  body: z.string().trim().min(50, "Write at least a couple of sentences.").max(40000),
  notes: z.string().trim().max(2000).optional(),
  file_paths: z.array(z.string()).max(10).default([]),
  sources: z.array(z.url().refine(v => /^https?:\/\//i.test(v), "Use an http or https source URL.")).max(5),
  ai_use: z.string().trim().min(2, "Describe any AI help, or write None.").max(500),
  confirmed: z.literal("on", { error: "Confirm your work meets the submission requirements." }),
});

export async function submitWork(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = submissionSchema.safeParse({
    claim_id: formData.get("claim_id"),
    body: formData.get("body"),
    notes: formData.get("notes") || undefined,
    sources: String(formData.get("sources") ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean),
    ai_use: formData.get("ai_use"),
    confirmed: formData.get("confirmed"),
    // Every path must sit inside the caller's own storage folder. The bucket
    // policy enforces this too, but rejecting it here gives a real message
    // instead of a silent 403 later.
    file_paths: formData
      .getAll("file_paths")
      .map(String)
      .filter(Boolean),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };

  const supabase = await createClient();

  const { data: claim } = await supabase
    .from("task_claims")
    .select("id, task_id, status, due_at, tasks(brief)")
    .eq("id", parsed.data.claim_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!claim) return { error: "That claim is not yours." };
  const workError = validateTaskWork(parseTaskBrief(claim.tasks?.brief ?? ""), parsed.data.body, parsed.data.file_paths.length, parsed.data.sources);
  if (workError) return { error: workError };
  if (!["active", "revision"].includes(claim.status)) {
    return { error: "This task is not open for submission." };
  }
  if (new Date(claim.due_at) < new Date()) {
    return { error: "The deadline has passed." };
  }

  const { count } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("claim_id", claim.id);

  const foreign = parsed.data.file_paths.filter(
    (path) => !path.startsWith(`${user.id}/`) || path.includes("..") || path.split("/").length !== 2,
  );
  if (foreign.length > 0) {
    return { error: "One of those files is not yours." };
  }
  const proofs = await Promise.all(parsed.data.file_paths.map(path => supabase.storage.from("submissions").info(path)));
  if (proofs.some(p => p.error || !p.data)) return { error: "An attachment is missing or could not be verified. Upload it again before submitting." };

  const { error } = await supabase.from("submissions").insert({
    claim_id: claim.id,
    task_id: claim.task_id,
    user_id: user.id,
    version: (count ?? 0) + 1,
    body: parsed.data.body,
    notes: [parsed.data.notes, `AI assistance: ${parsed.data.ai_use}`, parsed.data.sources.length ? `Sources:\n${parsed.data.sources.join("\n")}` : "Sources: supplied task material only"].filter(Boolean).join("\n\n"),
    file_paths: parsed.data.file_paths,
  });

  if (error) return { error: "Could not save the submission." };

  // New installations queue this in the insertion transaction. Keep a checked
  // fallback while the incremental migration is waiting to be applied.
  const { data: savedClaim } = await supabase.from("task_claims").select("status").eq("id",claim.id).maybeSingle();
  const { error: statusError } = savedClaim?.status === "submitted" ? { error: null } : await supabase
    .from("task_claims")
    .update({ status: "submitted" })
    .eq("id", claim.id);
  if (statusError) return { error: "Your work was saved, but its review status could not be updated. Contact support before submitting again." };

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${claim.task_id}`);
  revalidatePath("/admin/reviews");
  return { ok: "Submitted. A reviewer will score it against the rubric." };
}

/* --------------------------------------------------------- request payout -- */

export async function requestPayout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };

  const amount = Number(formData.get("amount_minor"));
  const method = String(formData.get("method") ?? "bank_pkr");
  const label = String(formData.get("destination_label") ?? "").trim();

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter an amount." };
  }
  if (label.length < 4) {
    return { error: "Tell us where to send it." };
  }

  const supabase = await createClient();

  const [{ data: walletRow }, { data: membership }] = await Promise.all([
    supabase
      .from("wallet_entries")
      .select("balance_after_minor")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("plans(payout_threshold_minor)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle(),
  ]);

  const balance = walletRow?.balance_after_minor ?? 0;
  const threshold =
    (membership as { plans?: { payout_threshold_minor: number } } | null)?.plans
      ?.payout_threshold_minor ?? 300_000;

  if (amount > balance) return { error: "That is more than your balance." };
  if (amount < threshold) {
    return {
      error: `Your plan's payout threshold is ${(threshold / 100).toLocaleString("en-PK")} PKR.`,
    };
  }

  // The RLS policy re-checks the balance server side, so a tampered form
  // cannot get past this even if the checks above were skipped.
  const { error } = await supabase.from("payout_requests").insert({
    user_id: user.id,
    amount_minor: amount,
    method,
    destination_label: label,
    status: "requested",
  });

  if (error) return { error: "Could not raise the request." };

  revalidatePath("/dashboard/earnings");
  return { ok: "Requested. Finance reviews payouts every working day." };
}

/* ------------------------------------------------------------- settings ---- */

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  display_name: z.string().trim().max(40).optional(),
  headline: z.string().trim().max(120).optional(),
  leaderboard_optin: z.boolean(),
  phone: z.string().trim().min(1, "Enter your mobile number.").max(30),
});

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    display_name: formData.get("display_name") || undefined,
    headline: formData.get("headline") || undefined,
    leaderboard_optin: formData.get("leaderboard_optin") === "on",
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };

  const phone = normalisePhone(parsed.data.phone, user.profile.country_code);
  if (!phone.ok) return { error: phone.error };

  if (phone.e164 !== user.profile.phone_e164) {
    if (!hasServiceRole()) return { error: "Phone changes are unavailable right now. Contact support." };
    const admin = createAdminClient();
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("phone_e164", phone.e164)
      .neq("id", user.id)
      .limit(1)
      .maybeSingle();
    if (taken) return { error: "That number is already registered to another account." };

    // Written with the service role, scoped to the signed-in member's own id,
    // so it does not depend on which profile columns RLS lets members edit.
    const { error: phoneError } = await admin
      .from("profiles")
      .update({ phone_e164: phone.e164, phone_verified_at: null })
      .eq("id", user.id);
    if (phoneError) {
      return {
        error: phoneError.code === "23505"
          ? "That number is already registered to another account."
          : "Could not save your mobile number.",
      };
    }
    await admin.from("audit_log").insert({
      actor_id: user.id,
      action: "member.phone_changed",
      subject_table: "profiles",
      subject_id: user.id,
      before: { phone_e164: user.profile.phone_e164 },
      after: { phone_e164: phone.e164 },
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      display_name: parsed.data.display_name ?? null,
      headline: parsed.data.headline ?? null,
      leaderboard_optin: parsed.data.leaderboard_optin,
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile." };

  updateTag(`profile:${user.id}`);
  revalidatePath("/dashboard", "layout");
  return { ok: "Saved." };
}

/* -------------------------------------------------------- notifications ---- */

export async function markAllRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}
