"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { incomingPayment, usesPaymentProofBucket, ownsPaymentProof } from "@/lib/billing";

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

const memberControlSchema = z.object({
  member_id: z.string().uuid(),
  status: z.enum(["pending", "active", "restricted", "suspended", "closed"]),
  kyc_status: z.enum(["none", "pending", "verified", "rejected"]),
  commission_eligible: z.boolean(),
  note: z.string().trim().max(500),
});

const memberProfileSchema = z.object({
  member_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  display_name: z.string().trim().max(80),
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(1000),
  phone_e164: z.string().trim().max(30).regex(/^$|^\+[1-9][0-9]{7,14}$/, "Use an international phone number or leave it blank."),
  country_code: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(3).max(80),
  leaderboard_optin: z.boolean(),
});

export async function updateMemberProfile(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const parsed = memberProfileSchema.safeParse({
    member_id: formData.get("member_id"), full_name: formData.get("full_name"), display_name: formData.get("display_name") ?? "", headline: formData.get("headline") ?? "", bio: formData.get("bio") ?? "", phone_e164: formData.get("phone_e164") ?? "", country_code: formData.get("country_code"), timezone: formData.get("timezone"), leaderboard_optin: formData.get("leaderboard_optin") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the member profile." };
  if (!hasServiceRole()) return { error: "Profile controls are unavailable without the server service role." };
  const admin = createAdminClient();
  const { data: before } = await admin.from("profiles").select("full_name, display_name, headline, bio, phone_e164, country_code, timezone, leaderboard_optin").eq("id", parsed.data.member_id).maybeSingle();
  if (!before) return { error: "Member not found." };
  const after = { full_name: parsed.data.full_name, display_name: parsed.data.display_name || null, headline: parsed.data.headline || null, bio: parsed.data.bio || null, phone_e164: parsed.data.phone_e164 || null, country_code: parsed.data.country_code, timezone: parsed.data.timezone, leaderboard_optin: parsed.data.leaderboard_optin };
  const { error } = await admin.from("profiles").update(after).eq("id", parsed.data.member_id);
  if (error) return { error: `Could not update profile: ${error.message}` };
  await admin.from("audit_log").insert({ actor_id: actor.id, action: "member.profile_updated", subject_table: "profiles", subject_id: parsed.data.member_id, before, after });
  revalidatePath(`/admin/members/${parsed.data.member_id}`);
  revalidatePath("/admin/members");
  return { ok: "Member profile saved and audited." };
}

export async function updateMemberControls(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const parsed = memberControlSchema.safeParse({
    member_id: formData.get("member_id"),
    status: formData.get("status"),
    kyc_status: formData.get("kyc_status"),
    commission_eligible: formData.get("commission_eligible") === "on",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the member controls." };
  if (parsed.data.member_id === actor.id && parsed.data.status !== "active") return { error: "You cannot suspend or close your own staff account." };
  if (!hasServiceRole()) return { error: "Member controls are disabled until the server service role is configured." };
  const admin = createAdminClient();
  const { data: before } = await admin.from("profiles").select("status, kyc_status, commission_eligible").eq("id", parsed.data.member_id).maybeSingle();
  if (!before) return { error: "Member not found." };
  const { error } = await admin.from("profiles").update({ status: parsed.data.status as never, kyc_status: parsed.data.kyc_status as never, commission_eligible: parsed.data.commission_eligible }).eq("id", parsed.data.member_id);
  if (error) return { error: `Could not update member: ${error.message}` };
  await admin.from("audit_log").insert({ actor_id: actor.id, action: "member.controls_updated", subject_table: "profiles", subject_id: parsed.data.member_id, before, after: { status: parsed.data.status, kyc_status: parsed.data.kyc_status, commission_eligible: parsed.data.commission_eligible, note: parsed.data.note || null } });
  if (parsed.data.note) await admin.from("notifications").insert({ user_id: parsed.data.member_id, kind: "account_notice", title: "An account note was added", body: parsed.data.note, href: "/dashboard/settings" });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${parsed.data.member_id}`);
  return { ok: `Member controls updated by ${actor.profile.full_name}.` };
}

const memberSponsorSchema = z.object({
  member_id: z.string().uuid(),
  sponsor_id: z.string().uuid().nullable(),
  reason: z.string().trim().min(10, "Add a reason for the referral change.").max(500),
  acknowledged: z.literal("on", { error: "Confirm the audited referral change." }),
});

export async function updateMemberPlan(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  if (actor.profile.status !== "active") return { error: "Your admin account must be active." };
  const parsed = z.object({
    member_id: z.string().uuid(),
    plan_id: z.coerce.number().int().positive(),
    status: z.enum(["active", "paused", "cancelled"]),
    reason: z.string().trim().min(10, "Add a reason for this plan change.").max(500),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the plan details." };
  if (!hasServiceRole()) return { error: "Plan controls are temporarily unavailable." };
  const { error } = await createAdminClient().rpc("admin_set_member_plan", {
    p_member: parsed.data.member_id, p_plan: parsed.data.plan_id,
    p_status: parsed.data.status, p_reason: parsed.data.reason, p_actor: actor.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/pricing");
  return { ok: parsed.data.status === "active" ? "Plan saved. Account and plan access are active." : "Plan access updated." };
}

export async function updateMemberSponsor(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const rawSponsor = String(formData.get("sponsor_id") ?? "").trim();
  const parsed = memberSponsorSchema.safeParse({
    member_id: formData.get("member_id"),
    sponsor_id: rawSponsor ? rawSponsor : null,
    reason: formData.get("reason"),
    acknowledged: formData.get("acknowledged"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the referral change." };
  if (parsed.data.sponsor_id === parsed.data.member_id) return { error: "A member cannot sponsor themselves." };
  if (!hasServiceRole()) return { error: "Referral controls are unavailable without the server service role." };

  const admin = createAdminClient();
  const { data: before } = await admin.from("profiles").select("id, full_name, referred_by, sponsor_locked_at").eq("id", parsed.data.member_id).maybeSingle();
  if (!before) return { error: "Member not found." };
  if (before.referred_by === parsed.data.sponsor_id) return { error: "This referral relationship is already set." };
  if (parsed.data.sponsor_id) {
    const { data: sponsor } = await admin.from("profiles").select("id, full_name, status").eq("id", parsed.data.sponsor_id).maybeSingle();
    if (!sponsor) return { error: "The selected sponsor does not exist." };
    if (["closed", "suspended"].includes(sponsor.status)) return { error: "A closed or suspended member cannot be a sponsor." };
  }

  const { error } = await admin.rpc("admin_update_member_sponsor", { p_member: parsed.data.member_id, p_sponsor: parsed.data.sponsor_id });
  if (error) return { error: `Could not update the referral chain: ${error.message}` };
  const after = { referred_by: parsed.data.sponsor_id, reason: parsed.data.reason, changed_by: actor.id };
  await admin.from("audit_log").insert({ actor_id: actor.id, action: "member.sponsor_changed", subject_table: "profiles", subject_id: parsed.data.member_id, before, after });
  await admin.from("notifications").insert({ user_id: parsed.data.member_id, kind: "account_notice", title: "Your referral relationship was updated", body: "An administrator updated your sponsor relationship. Contact support if you need clarification.", href: "/dashboard/referrals" });
  revalidatePath(`/admin/members/${parsed.data.member_id}`);
  revalidatePath("/admin/members");
  revalidatePath("/admin/referrals");
  return { ok: parsed.data.sponsor_id ? "Sponsor updated and referral chain rebuilt." : "Sponsor removed and referral chain rebuilt." };
}

export async function recomputeMemberRank(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const memberId = String(formData.get("member_id") ?? "");
  if (!z.string().uuid().safeParse(memberId).success) return { error: "Invalid member." };
  if (!hasServiceRole()) return { error: "Rank recompute is unavailable without the service role." };
  const { error } = await createAdminClient().rpc("recompute_rank", { p_user: memberId });
  if (error) return { error: `Could not recompute rank: ${error.message}` };
  await createAdminClient().from("audit_log").insert({ actor_id: actor.id, action: "member.rank_recomputed", subject_table: "profiles", subject_id: memberId, after: { reason: "admin_requested" } });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: "Rank recalculated from verified member activity." };
}

const walletAdjustmentSchema = z.object({
  member_id: z.string().uuid(),
  direction: z.enum(["credit", "debit"]),
  amount_pkr: z.coerce.number().positive().max(100000000),
  memo: z.string().trim().min(10, "Explain why this adjustment is needed.").max(500),
  acknowledged: z.literal("on", { error: "Confirm the audited wallet adjustment." }),
});

export async function addMemberWalletAdjustment(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["finance", "admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const parsed = walletAdjustmentSchema.safeParse({ member_id: formData.get("member_id"), direction: formData.get("direction"), amount_pkr: formData.get("amount_pkr"), memo: formData.get("memo"), acknowledged: formData.get("acknowledged") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the adjustment." };
  if (!hasServiceRole()) return { error: "Financial controls are unavailable without the server service role." };
  const admin = createAdminClient();
  const amount = Math.round(parsed.data.amount_pkr * 100) * (parsed.data.direction === "credit" ? 1 : -1);
  // wallet_balance intentionally requires a signed-in user for member-facing reads.
  // Admin actions use the service-role ledger directly so finance controls do not
  // depend on the browser session being forwarded into an RPC.
  const { data: latestWalletEntry, error: balanceError } = await admin
    .from("wallet_entries")
    .select("balance_after_minor")
    .eq("user_id", parsed.data.member_id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (balanceError) return { error: `Could not read the member balance: ${balanceError.message}` };
  const balance = latestWalletEntry?.balance_after_minor ?? 0;
  if (amount < 0 && Math.abs(amount) > balance) return { error: "A debit cannot take the member below a zero wallet balance." };
  const refId = crypto.randomUUID();
  const { error } = await admin.rpc("post_wallet_entry", { p_user: parsed.data.member_id, p_type: "adjustment", p_amount: amount, p_created_by: actor.id, p_ref_table: "admin_adjustments", p_ref_id: refId, p_memo: `Admin adjustment: ${parsed.data.memo}` });
  if (error) return { error: `The ledger rejected this adjustment: ${error.message}` };
  await admin.from("audit_log").insert({ actor_id: actor.id, action: "wallet.admin_adjustment", subject_table: "profiles", subject_id: parsed.data.member_id, after: { amount_minor: amount, direction: parsed.data.direction, memo: parsed.data.memo, reference: refId } });
  await admin.from("notifications").insert({ user_id: parsed.data.member_id, kind: "wallet_adjustment", title: parsed.data.direction === "credit" ? "A wallet credit was added" : "A wallet correction was applied", body: parsed.data.memo, href: "/dashboard/earnings" });
  revalidatePath(`/admin/members/${parsed.data.member_id}`);
  revalidatePath("/admin/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/earnings");
  return { ok: `Wallet ${parsed.data.direction} recorded as ${parsed.data.amount_pkr.toLocaleString()} PKR.` };
}

const commissionStatusSchema = z.object({
  commission_id: z.string().uuid(),
  member_id: z.string().uuid(),
  status: z.enum(["pending", "review", "available", "paid", "reversed", "void"]),
  reason: z.string().trim().min(10, "Add a reason for the commission change.").max(500),
});

export async function setCommissionStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let actor;
  try { actor = await requireRole(["finance", "admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const parsed = commissionStatusSchema.safeParse({ commission_id: formData.get("commission_id"), member_id: formData.get("member_id"), status: formData.get("status"), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the commission change." };
  if (!hasServiceRole()) return { error: "Commission controls are unavailable without the server service role." };
  const admin = createAdminClient();
  const { data: before } = await admin.from("commissions").select("id, amount_minor, status, reversed_reason, earner_id").eq("id", parsed.data.commission_id).eq("earner_id", parsed.data.member_id).maybeSingle();
  if (!before) return { error: "Commission entry not found for this member." };
  if (before.status === "paid" && parsed.data.status !== "paid") return { error: "A paid commission cannot be silently changed. Record a wallet correction with its own audit reason." };
  const { error } = await admin.from("commissions").update({ status: parsed.data.status as never, reversed_reason: ["reversed", "void"].includes(parsed.data.status) ? parsed.data.reason : null }).eq("id", parsed.data.commission_id).eq("earner_id", parsed.data.member_id);
  if (error) return { error: `Could not change commission status: ${error.message}` };
  await admin.from("audit_log").insert({ actor_id: actor.id, action: "commission.status_changed", subject_table: "commissions", subject_id: parsed.data.commission_id, before, after: { status: parsed.data.status, reason: parsed.data.reason } });
  await admin.from("notifications").insert({ user_id: parsed.data.member_id, kind: "commission_update", title: "A commission entry was updated", body: parsed.data.reason, href: "/dashboard/referrals" });
  revalidatePath(`/admin/members/${parsed.data.member_id}`);
  revalidatePath("/admin/referrals");
  revalidatePath("/dashboard/referrals");
  return { ok: `Commission marked ${parsed.data.status}.` };
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
  payout_amount: z.coerce.number().positive().max(10000000),
  currency: z.enum(["PKR", "USD"]),
  min_rank_id: z.coerce.number().int().min(1).max(8),
  due_hours: z.coerce.number().int().positive(),
  max_claims: z.coerce.number().int().positive(),
  deliverable_type: z.string().trim().min(2).max(40),
  word_count_target: z.number().int().min(0).max(100000).nullable(),
  opens_at: z.string().trim().optional(),
  early_access_opens_at: z.string().trim().optional(),
  compliance_flag: z.enum(["standard", "tutoring", "restricted"]),
  publish: z.boolean(),
});

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    category_id: formData.get("category_id"),
    summary: formData.get("summary"),
    brief: formData.get("brief"),
    payout_amount: formData.get("payout_amount"),
    currency: formData.get("currency") || "PKR",
    min_rank_id: formData.get("min_rank_id"),
    due_hours: formData.get("due_hours"),
    max_claims: formData.get("max_claims"),
    deliverable_type: formData.get("deliverable_type") || "text",
    word_count_target: String(formData.get("word_count_target") ?? "").trim()
      ? Number(formData.get("word_count_target"))
      : null,
    opens_at: String(formData.get("opens_at") ?? "").trim(),
    early_access_opens_at: String(formData.get("early_access_opens_at") ?? "").trim(),
    compliance_flag: formData.get("compliance_flag"),
    publish: formData.get("publish") === "on",
  });
}

function taskValues(data: z.infer<typeof taskSchema>) {
  const now = new Date().toISOString();
  const toIso = (value: string | undefined, fallback: string | null) => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
  };
  const opensAt = toIso(data.opens_at, now) ?? now;
  const earlyAccess = toIso(data.early_access_opens_at, null);
  return {
    title: data.title,
    slug: data.slug,
    category_id: data.category_id,
    summary: data.summary,
    brief: data.brief,
    payout_minor: Math.round(data.payout_amount * 100),
    currency: data.currency,
    min_rank_id: data.min_rank_id,
    due_hours: data.due_hours,
    max_claims: data.max_claims,
    deliverable_type: data.deliverable_type,
    word_count_target: data.word_count_target,
    opens_at: opensAt,
    early_access_opens_at: earlyAccess,
    compliance_flag: data.compliance_flag,
  };
}

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

  const parsed = parseTaskForm(formData);

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
    ...taskValues(parsed.data),
    status: parsed.data.publish ? "open" : "draft",
    created_by: user.id,
  } as never);

  if (error) {
    return error.code === "23505"
      ? { error: "That slug is already used." }
      : { error: `Could not create the task: ${error.message}` };
  }

  revalidatePath("/admin/tasks");
  return { ok: parsed.data.publish ? "Published." : "Saved as a draft." };
}

export async function updateTask(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let user;
  try { user = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const taskId = String(formData.get("task_id") ?? "");
  if (!z.string().uuid().safeParse(taskId).success) return { error: "That task could not be identified." };
  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  if (parsed.data.compliance_flag === "restricted") {
    const current = await (await createClient()).from("tasks").select("status").eq("id", taskId).maybeSingle();
    if (current.data?.status === "open" || current.data?.status === "scheduled") return { error: "Pause this task before marking it restricted." };
  }
  const supabase = await createClient();
  const { data: before } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  if (!before) return { error: "Task not found." };
  const { error } = await supabase.from("tasks").update(taskValues(parsed.data) as never).eq("id", taskId);
  if (error) return { error: error.code === "23505" ? "That slug is already used." : `Could not update the task: ${error.message}` };
  await supabase.rpc("write_audit", { p_action: "task.updated", p_table: "tasks", p_id: taskId, p_before: before, p_after: taskValues(parsed.data) });
  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { ok: `Task updated by ${user.profile.full_name}.` };
}

export async function setTaskStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  let user;
  try { user = await requireRole(["admin", "owner"]); } catch (e) { return { error: (e as Error).message }; }
  const taskId = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!z.string().uuid().safeParse(taskId).success || !["draft", "scheduled", "open", "completed", "cancelled", "expired"].includes(status)) return { error: "Invalid task lifecycle change." };
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("id, status, compliance_flag, title").eq("id", taskId).maybeSingle();
  if (!task) return { error: "Task not found." };
  if (["open", "scheduled"].includes(status) && task.compliance_flag === "restricted") return { error: "Restricted tasks cannot be published." };
  const { error } = await supabase.from("tasks").update({ status: status as never }).eq("id", taskId);
  if (error) return { error: `Could not change task status: ${error.message}` };
  await supabase.rpc("write_audit", { p_action: `task.${status}`, p_table: "tasks", p_id: taskId, p_before: { status: task.status }, p_after: { status, title: task.title, actor: user.id } });
  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  return { ok: `Task marked ${status}.` };
}

/* ------------------------------------------------ verify a Easypaisa Bank payment */

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

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/pricing");
    return { ok: "Rejected, and the member has been told why." };
  }

  if (formData.get("verified") !== "on") return { error: "Check the receipt against the payment account transaction history, then confirm the verification checkbox." };
  if (usesPaymentProofBucket(declaration.method)) {
    if (!declaration.proof_path || !ownsPaymentProof(declaration.user_id, declaration.proof_path)) return { error: "A valid payment screenshot is required." };
    const { error: proofError } = await admin.storage.from(incomingPayment.proofBucket).info(declaration.proof_path);
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

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/pricing");
  return { ok: "Payment verified. The account is active and plan access is unlocked." };
}
