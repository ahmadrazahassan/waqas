"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { incomingPayment, paymentQr, proofMime, paymentsPaused, paymentUnavailableMessage } from "@/lib/billing";

export type BillingState = { error?: string; ok?: string };

function refreshBilling() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/pricing");
  revalidatePath("/admin/payments");
  revalidatePath("/admin", "layout");
}

export async function declarePayment(_prev: BillingState, formData: FormData): Promise<BillingState> {
  if (paymentsPaused) return { error: paymentUnavailableMessage };
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again before submitting your payment." };
  if (!["pending", "active"].includes(user.profile.status)) return { error: "Please contact support about your account before paying." };
  if (!hasServiceRole()) return { error: "Payment submissions are temporarily unavailable. Please do not pay until support confirms they are open." };

  const parsed = z.object({
    plan_id: z.coerce.number().int().positive(),
    reference: z.string().trim().min(4, "Enter your Easypaisa Bank transaction ID.").max(80).regex(/^[a-zA-Z0-9-]+$/, "Use the transaction ID shown on your receipt, without spaces.").transform(v => v.toUpperCase()),
    note: z.string().trim().max(500),
    acknowledged: z.literal("on", { error: "Confirm that the receipt is for this payment." }),
  }).safeParse({
    plan_id: formData.get("plan_id"), reference: formData.get("reference"),
    note: formData.get("note") || "", acknowledged: formData.get("acknowledged"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const proof = formData.get("proof");
  if (!(proof instanceof File) || proof.size === 0) return { error: "Attach your payment screenshot." };
  if (proof.size > incomingPayment.maxProofBytes) return { error: "Your screenshot must be 5 MB or smaller." };
  const bytes = new Uint8Array(await proof.arrayBuffer());
  const mime = proofMime(bytes);
  if (!mime || proof.type !== mime) return { error: "Use a PNG, JPG or WebP screenshot. PDFs and other file types are not accepted." };

  const admin = createAdminClient();
  const [{ data: bucket, error: bucketError }, { data: plan, error: planError }, { data: existing, error: waitingError }, { data: membership, error: memberError }] = await Promise.all([
    admin.storage.getBucket(incomingPayment.proofBucket),
    admin.from("plans").select("id, price_minor, currency, is_active").eq("id", parsed.data.plan_id).maybeSingle(),
    admin.from("payment_declarations").select("id").eq("user_id", user.id).eq("status", "submitted").limit(1).maybeSingle(),
    admin.from("memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
  ]);
  if (bucketError || !bucket || bucket.public) return { error: "Secure payment review is not ready yet. Please contact support before paying." };
  if (planError || waitingError || memberError) return { error: "We could not check your account. Please try again." };
  if (!plan?.is_active || !paymentQr(plan.price_minor, plan.currency)) return { error: "That plan is not available." };
  if (existing) return { error: "Your payment is already awaiting review. Please do not submit or pay again." };
  // Upgrades need a separate, server-calculated quote. Never charge full price twice.
  if (membership) return { error: "Your account already has an active plan. Contact support if you want to upgrade." };

  const extension = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from(incomingPayment.proofBucket)
    .upload(path, bytes, { contentType: mime, upsert: false, cacheControl: "0" });
  if (uploadError) return { error: "Your screenshot could not be saved. Please try again. No payment request was created." };

  // No client-supplied user, amount, timestamp, method or storage path is trusted.
  const { error } = await admin.from("payment_declarations").insert({
    user_id: user.id, plan_id: plan.id, amount_minor: plan.price_minor,
    currency: "PKR", method: incomingPayment.id, reference: parsed.data.reference,
    note: parsed.data.note || null, proof_path: path, status: "submitted",
  });
  if (error) {
    // Only this action's unreferenced upload is removed, never a submitted receipt.
    await admin.storage.from(incomingPayment.proofBucket).remove([path]);
    return { error: error.code === "23505" ? "This payment reference or account already has a request. Check your payment history before trying again." : "We could not submit your receipt. Please try again or contact support." };
  }
  refreshBilling();
  return { ok: "Screenshot submitted. Your six hour review window has started. You do not need to pay again." };
}

export async function cancelDeclaration(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const user = await getCurrentUser();
  if (!user || !hasServiceRole()) return { error: "Please sign in or contact support." };
  const id = z.string().uuid().safeParse(formData.get("declaration_id"));
  if (!id.success) return { error: "Invalid payment request." };
  const { data, error } = await createAdminClient().from("payment_declarations")
    .update({ status: "cancelled", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id.data).eq("user_id", user.id)
    .eq("status", "submitted").select("id").maybeSingle();
  if (error || !data) return { error: "The request could not be cancelled. It may have already been reviewed." };
  refreshBilling();
  return { ok: "Request cancelled. This does not refund a payment you have already sent. Contact support to trace it." };
}
