"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type BillingState = { error?: string; ok?: string };

const declarationSchema = z.object({
  plan_id: z.coerce.number().int().positive(),
  reference: z
    .string()
    .trim()
    .min(4, "Give us the transaction reference from your bank.")
    .max(80),
  note: z.string().trim().max(500).optional(),
  proof_path: z.string().trim().max(300).optional(),
});

/**
 * A member declaring they have paid by bank transfer.
 *
 * Nothing happens on the strength of this alone: no subscription, no
 * commission, no leaderboard points. An admin confirms it against the bank
 * statement and only then does confirm_declaration fire the chain. Trusting a
 * self declaration would let anyone mint a subscription and pay their own
 * upline 40% of nothing.
 */
export async function declarePayment(
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };

  const parsed = declarationSchema.safeParse({
    plan_id: formData.get("plan_id"),
    reference: formData.get("reference"),
    note: formData.get("note") || undefined,
    proof_path: formData.get("proof_path") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  // The amount comes from the plan, never from the form. A member choosing
  // their own price is not a thing.
  const { data: plan } = await supabase
    .from("plans")
    .select("id, price_minor, is_active")
    .eq("id", parsed.data.plan_id)
    .maybeSingle();

  if (!plan || !plan.is_active) return { error: "That plan is not available." };

  const { data: existing } = await supabase
    .from("payment_declarations")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .maybeSingle();

  if (existing) {
    return {
      error:
        "You already have a declaration waiting. We will confirm it within one working day.",
    };
  }

  const { error } = await supabase.from("payment_declarations").insert({
    user_id: user.id,
    plan_id: plan.id,
    amount_minor: plan.price_minor,
    method: "bank_transfer",
    reference: parsed.data.reference,
    note: parsed.data.note ?? null,
    proof_path: parsed.data.proof_path ?? null,
    status: "submitted",
  });

  if (error) return { error: "Could not record that. Try again." };

  revalidatePath("/dashboard/billing");
  return {
    ok: "Recorded. We check declarations against the bank every working day and will email you when your plan switches on.",
  };
}

export async function cancelDeclaration(
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in." };

  const id = String(formData.get("declaration_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_declarations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "submitted");

  if (error) return { error: "Could not cancel it." };

  revalidatePath("/dashboard/billing");
  return { ok: "Cancelled." };
}
