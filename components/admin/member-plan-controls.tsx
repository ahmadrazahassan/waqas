"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateMemberPlan, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

type Plan = { id: number; name: string; price_minor: number };

export function MemberPlanControls({ memberId, plans, currentPlanId, currentStatus, pendingReceipts }: {
  memberId: string; plans: Plan[]; currentPlanId?: number; currentStatus?: string; pendingReceipts: number;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateMemberPlan, {});
  const field = "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-small";
  return (
    <section id="plan-access" className="mt-8 rounded-panel border border-line bg-surface p-6">
      <h2 className="text-h4">Plan and account access</h2>
      <p className="mt-2 text-small text-muted">Change the member’s plan or activate, pause and cancel access. Activating also opens their account. Manual access changes do not record a new payment or award referral commission.</p>
      {pendingReceipts > 0 ? (
        <div className="mt-4 rounded-control border border-violet/20 bg-violet/5 p-4 text-small">
          This member has {pendingReceipts} receipt awaiting review. Verify the payment to activate their purchased plan.
          <Link href="/admin/payments" className="ms-2 font-medium text-violet underline underline-offset-4">Review payment</Link>
        </div>
      ) : null}
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="member_id" value={memberId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-small font-medium" htmlFor="member-plan">Plan
            <select id="member-plan" name="plan_id" required defaultValue={currentPlanId ?? ""} className={field}>
              <option value="" disabled>Choose a plan</option>
              {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {formatMoney(plan.price_minor)}</option>)}
            </select>
          </label>
          <label className="text-small font-medium" htmlFor="member-plan-status">Access status
            <select id="member-plan-status" name="status" defaultValue={["active", "paused", "cancelled"].includes(currentStatus ?? "") ? currentStatus : "active"} className={field}>
              <option value="active">Active · unlock account and plan</option>
              <option value="paused">Paused · temporarily stop plan access</option>
              <option value="cancelled">Cancelled · revoke plan access</option>
            </select>
          </label>
        </div>
        <label htmlFor="member-plan-reason" className="block text-small font-medium">Reason
          <textarea id="member-plan-reason" name="reason" required minLength={10} maxLength={500} rows={2} placeholder="Explain the plan or access change for the member record." className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !plans.length}>{pending ? "Saving…" : "Save plan and access"}</Button>
          {state.error ? <p role="alert" className="text-small text-critical">{state.error}</p> : null}
          {state.ok ? <p role="status" className="text-small text-positive">{state.ok}</p> : null}
        </div>
      </form>
    </section>
  );
}
