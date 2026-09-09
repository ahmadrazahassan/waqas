"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { jazzCash, ownsPaymentProof } from "@/lib/billing";

export type AdminState = { error?: string; ok?: string };

/** Every admin action re-checks the role. proxy.ts is UX, this is the gate. */
async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!user.roles.some((r) => roles.includes(r))) {
    throw new Error("You do not have that permission");
  }
  return user;
}

/* ---------------------------------------------------------- review work ---- */

const reviewSchema = z.object({
  submission_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  decision: z.enum(["approve", "revise", "reject"]),
  score: z.coerce.number().min(0).max(5),
  feedback: z.string().trim().min(10, "Write feedback the member can act on."),
});

export async function reviewSubmission(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  let user;
  try {
    user = await requireRole(["reviewer", "admin", "owner"]);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = reviewSchema.safeParse({
    submission_id: formData.get("submission_id"),
    claim_id: formData.get("claim_id"),
    decision: formData.get("decision"),
    score: formData.get("score"),
    feedback: formData.get("feedback"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();

  const { data: reviewTarget } = await supabase.from("task_claims")
    .select("id, status, tasks(currency)").eq("id", parsed.data.claim_id).maybeSingle();
  if (!reviewTarget || !["submitted", "in_review"].includes(reviewTarget.status)) return { error: "This claim is not awaiting review." };
  if (parsed.data.decision === "approve" && reviewTarget.tasks?.currency !== "PKR") return { error: "This task is not denominated in PKR. Set an approved PKR payout before any paid work is claimed; USD cents cannot be credited to a PKR wallet." };
  const { data: targetSubmission } = await supabase.from("submissions").select("id").eq("id",parsed.data.submission_id).eq("claim_id",reviewTarget.id).maybeSingle();
  if (!targetSubmission) return { error: "The submission does not belong to this claim." };

  const { error: reviewError } = await supabase.from("submission_reviews").insert({
    submission_id: parsed.data.submission_id,
    reviewer_id: user.id,
    decision: parsed.data.decision,
    score: parsed.data.score,
    feedback: parsed.data.feedback,
  });

  if (reviewError) return { error: "Could not save the review." };

  const nextStatus =
    parsed.data.decision === "approve"
      ? "approved"
      : parsed.data.decision === "revise"
        ? "revision"
        : "rejected";

  await supabase
    .from("task_claims")
    .update({
      status: nextStatus,
      closed_at: parsed.data.decision === "revise" ? null : new Date().toISOString(),
    })
    .eq("id", parsed.data.claim_id);

  // Approval pays the member. That crosses into money, so it goes through the
  // service role and the same post_wallet_entry door everything else uses.
  if (parsed.data.decision === "approve") {
    if (!hasServiceRole()) {
      return {
        error:
          "Review saved, but the payment could not be made: SUPABASE_SERVICE_ROLE_KEY is not set.",
      };
    }

    const admin = createAdminClient();

    const { data: claim } = await admin
      .from("task_claims")
      .select("user_id, task_id, tasks(payout_minor, title)")
      .eq("id", parsed.data.claim_id)
      .single();

    if (claim) {
      const task = claim.tasks as unknown as { payout_minor: number; title: string };

      await admin.rpc("post_wallet_entry", {
        p_user: claim.user_id,
        p_type: "task_payment",
        p_amount: task.payout_minor,
        p_ref_table: "task_claims",
        p_ref_id: parsed.data.claim_id,
        p_memo: `Task approved: ${task.title}`,
        p_created_by: user.id,
      });

      await admin
        .from("profiles")
        .update({ last_task_approved_at: new Date().toISOString() })
        .eq("id", claim.user_id);

      // Approval can change eligibility and rank at the same time.
      await admin.rpc("recompute_rank", { p_user: claim.user_id });
      await admin.rpc("recompute_commission_eligibility");

      await admin.from("notifications").insert({
        user_id: claim.user_id,
        kind: "task_approved",
        title: "Your work was approved",
        body: `${task.title} has been paid into your wallet.`,
        href: "/dashboard/earnings",
      });
    }
  }

  revalidatePath("/admin/reviews");
  return { ok: `Recorded as ${nextStatus}.` };
}

/* -------------------------------------------------------------- payouts ---- */

export async function decidePayout(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  let user;
  try {
    user = await requireRole(["finance", "admin", "owner"]);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = String(formData.get("payout_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!id || !["approved", "paid", "failed", "cancelled"].includes(decision)) {
    return { error: "Unknown decision." };
  }

  if (!hasServiceRole()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not set, so payouts cannot move." };
  }

  const admin = createAdminClient();

  const { data: payout } = await admin
    .from("payout_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!payout) return { error: "That request does not exist." };
  if (payout.status === "paid") return { error: "Already paid." };

  // Marking paid takes the money out of the wallet. Doing it in this order
  // means a failure at the ledger leaves the request unpaid rather than
  // leaving a member paid twice.
  if (decision === "paid") {
    const { error } = await admin.rpc("post_wallet_entry", {
      p_user: payout.user_id,
      p_type: "payout",
      p_amount: -payout.amount_minor,
      p_ref_table: "payout_requests",
      p_ref_id: payout.id,
      p_memo: "Payout sent",
      p_created_by: user.id,
    });

    if (error) {
      return { error: `Ledger refused the entry: ${error.message}` };
    }
  }

  await admin
    .from("payout_requests")
    .update({
      status: decision as "approved" | "paid" | "failed" | "cancelled",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      processed_at: decision === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: `payout.${decision}`,
    subject_table: "payout_requests",
    subject_id: id,
    after: { status: decision, amount_minor: payout.amount_minor },
  });

  await admin.from("notifications").insert({
    user_id: payout.user_id,
    kind: "payout",
    title:
      decision === "paid"
        ? "Your payout was sent"
        : `Your payout was marked ${decision}`,
    href: "/dashboard/earnings",
  });

  revalidatePath("/admin/payouts");
  return { ok: `Marked ${decision}.` };
}

/* ------------------------------------------------------- member controls --- */

export async function setMemberStatus(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireRole(["admin", "owner"]);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = String(formData.get("member_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["active", "restricted", "suspended", "closed"].includes(status)) {
    return { error: "Unknown status." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ status: status as "active" })
    .eq("id", id);

  if (error) return { error: "Could not change the status." };

  await supabase.rpc("write_audit", {
    p_action: "member.status_changed",
    p_table: "profiles",
    p_id: id,
    p_before: before,
    p_after: { status },
  });

  revalidatePath("/admin/members");
  return { ok: `Member set to ${status}.` };
}

/* --------------------------------------------------------------- tasks ----- */

const taskSchema = z.object({
  title: z.string().trim().min(8).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  category_id: z.coerce.number().int().positive(),
  summary: z.string().trim().min(20).max(400),
  brief: z.string().trim().min(50),
  payout_minor: z.coerce.number().int().positive(),
  min_rank_id: z.coerce.number().int().min(1).max(8),
  due_hours: z.coerce.number().int().positive(),
  max_claims: z.coerce.number().int().positive(),
  compliance_flag: z.enum(["standard", "tutoring", "restricted"]),
  publish: z.boolean(),
});

export async function createTask(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  let user;
  try {
    user = await requireRole(["admin", "owner"]);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    category_id: formData.get("category_id"),
    summary: formData.get("summary"),
    brief: formData.get("brief"),
    payout_minor: Number(formData.get("payout_rupees")) * 100,
    min_rank_id: formData.get("min_rank_id"),
    due_hours: formData.get("due_hours"),
    max_claims: formData.get("max_claims"),
    compliance_flag: formData.get("compliance_flag"),
    publish: formData.get("publish") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  // The database also refuses this, with a check constraint that cannot be
  // bypassed by any role. This message just explains it before they hit it.
  if (parsed.data.compliance_flag === "restricted" && parsed.data.publish) {
    return {
      error:
        "A task flagged restricted cannot be published. That is enforced in the database, not just here.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    status: parsed.data.publish ? "open" : "draft",
    created_by: user.id,
    publish: undefined,
  } as never);

  if (error) {
    return error.code === "23505"
      ? { error: "That slug is already used." }
      : { error: `Could not create the task: ${error.message}` };
  }

  revalidatePath("/admin/tasks");
  return { ok: parsed.data.publish ? "Published." : "Saved as a draft." };
}

/* ------------------------------------------------ verify a JazzCash payment */

export async function decideDeclaration(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  let user;
  try {
    user = await requireRole(["finance", "admin", "owner"]);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = String(formData.get("declaration_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reject_reason") ?? "").trim();

  if (!z.string().uuid().safeParse(id).success || !["confirmed", "rejected"].includes(decision)) {
    return { error: "Unknown decision." };
  }

  if (!hasServiceRole()) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set, so a confirmation cannot open an account or award commission.",
    };
  }

  const admin = createAdminClient();

  if (user.profile.status !== "active") return { error: "Your staff account must be active to review payments." };
  const { data: declaration, error: readError } = await admin.from("payment_declarations")
    .select("*").eq("id", id).maybeSingle();
  if (readError || !declaration) return { error: "Payment request could not be found." };
  if (declaration.user_id === user.id) return { error: "Another finance reviewer must verify your payment." };
  if (declaration.status !== "submitted") return { error: "This payment has already been reviewed. Refresh the queue." };

  if (decision === "rejected") {
    if (reason.length < 5 || reason.length > 500) {
      return { error: "Say why, so the member can fix it." };
    }

    const { data: updated, error: rejectError } = await admin
      .from("payment_declarations")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason,
      })
      .eq("id", id)
      .eq("status", "submitted").select("id").maybeSingle();
    if (rejectError || !updated) return { error: "Could not reject this payment. Refresh the queue and try again." };

    revalidatePath("/admin/payments");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/pricing");
    return { ok: "Rejected, and the member has been told why." };
  }

  if (formData.get("verified") !== "on") return { error: "Check the receipt against the JazzCash transaction history, then confirm the verification checkbox." };
  if (declaration.method === jazzCash.id) {
    if (!declaration.proof_path || !ownsPaymentProof(declaration.user_id, declaration.proof_path)) return { error: "A valid payment screenshot is required." };
    const { error: proofError } = await admin.storage.from(jazzCash.proofBucket).info(declaration.proof_path);
    if (proofError) return { error: "The screenshot is unavailable. Do not approve until it can be reviewed." };
  }

  // Confirming runs record_payment inside one transaction: it opens the
  // account, awards the one time 40% up the chain, and awards the
  // leaderboard points. Either all of that happens or none of it does.
  const { error } = await admin.rpc("confirm_declaration", {
    p_declaration: id,
    p_reviewer: user.id,
  });

  if (error) {
    return { error: `Could not confirm it: ${error.message}` };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/pricing");
  revalidatePath("/admin/members");
  return { ok: "Payment verified. The account is active and plan access is unlocked." };
}
