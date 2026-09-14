"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { addMemberWalletAdjustment, setCommissionStatus, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

const input = "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-small";
const label = "block text-micro font-medium uppercase tracking-[0.08em] text-muted";

type CommissionRow = { id: string; amount_minor: number; status: string; created_at: string };

export function MemberFinanceControls({ memberId, balance, commissions }: { memberId: string; balance: number; commissions: CommissionRow[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(addMemberWalletAdjustment, {});
  return (
    <div className="space-y-6">
      <div className="grid gap-px sm:grid-cols-2"><div className="rounded-control border border-line bg-bg p-4"><p className="text-micro uppercase tracking-widest text-muted">Current wallet</p><p className="mt-2 text-h3 tabular">PKR {(balance / 100).toLocaleString()}</p></div><div className="rounded-control border border-line bg-bg p-4"><p className="text-micro uppercase tracking-widest text-muted">Financial authority</p><p className="mt-2 text-small font-medium">Finance, admin and owner</p><p className="mt-1 text-micro text-muted">Every adjustment is append-only and audited.</p></div></div>
      <form action={action} className="space-y-4 border-t border-line pt-5"><div><p className="text-small font-medium">Wallet adjustment</p><p className="mt-1 text-micro text-muted">Use a credit for a documented bonus or a debit for a documented correction. Do not edit old ledger rows.</p></div><input type="hidden" name="member_id" value={memberId} /><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="adjustment-direction" className={label}>Direction</label><select id="adjustment-direction" name="direction" defaultValue="credit" className={input}><option value="credit">Credit wallet</option><option value="debit">Debit wallet</option></select></div><div><label htmlFor="adjustment-amount" className={label}>Amount (PKR)</label><input id="adjustment-amount" name="amount_pkr" type="number" min="1" step="1" required className={`${input} tabular`} /></div></div><div><label htmlFor="adjustment-memo" className={label}>Reason</label><textarea id="adjustment-memo" name="memo" minLength={10} maxLength={500} required rows={3} placeholder="Example: Approved goodwill credit after duplicate task review." className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" /></div><label className="flex items-start gap-3 rounded-control border border-warning/30 bg-warning/5 p-3 text-small"><input type="checkbox" name="acknowledged" required className="mt-1 size-4 accent-violet" /><span>I confirm this is a documented financial correction and the member will see it in their ledger.</span></label><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending} variant="violet">{pending ? <LoaderCircle size={15} className="animate-spin" /> : "Post audited adjustment"}</Button>{state.error ? <p role="alert" className="text-small text-critical">{state.error}</p> : null}{state.ok ? <p role="status" className="text-small text-positive">{state.ok}</p> : null}</div></form>
      <div className="border-t border-line pt-5"><p className="text-small font-medium">Commission controls</p><p className="mt-1 text-micro text-muted">Pending entries can be held for review or voided with a reason. Wallet release, payout and reversal use their dedicated audited processes.</p><div className="mt-4 space-y-3">{commissions.length ? commissions.slice(0, 8).map((commission) => <CommissionControl key={commission.id} memberId={memberId} commission={commission} />) : <p className="text-small text-muted">No commission entries for this member.</p>}</div></div>
    </div>
  );
}

function CommissionControl({ memberId, commission }: { memberId: string; commission: CommissionRow }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(setCommissionStatus, {});
  const editable = ["pending", "review"].includes(commission.status);
  return <div className="rounded-control border border-line bg-bg p-3"><p className="text-small font-medium">PKR {(commission.amount_minor / 100).toLocaleString()} · {commission.status}</p>{editable ? <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]"><input type="hidden" name="commission_id" value={commission.id} /><input type="hidden" name="member_id" value={memberId} /><div><input name="reason" required minLength={10} maxLength={500} placeholder="Reason for status change" className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-micro" />{state.error ? <p role="alert" className="mt-2 text-micro text-critical">{state.error}</p> : null}{state.ok ? <p role="status" className="mt-2 text-micro text-positive">{state.ok}</p> : null}</div><div className="flex items-end gap-2"><select name="status" defaultValue={commission.status} className="h-10 rounded-sm border border-line bg-surface px-2 text-micro"><option value="pending">Pending</option><option value="review">Review</option><option value="void">Void</option></select><Button type="submit" size="sm" variant="tertiary" disabled={pending}>{pending ? <LoaderCircle size={14} className="animate-spin" /> : "Save"}</Button></div></form> : <p className="mt-1 text-micro text-muted">Locked to its audited wallet or payment record.</p>}</div>;
}
