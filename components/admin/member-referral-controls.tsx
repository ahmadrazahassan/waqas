"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateMemberSponsor, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

const input = "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-small";
const label = "block text-micro font-medium uppercase tracking-[0.08em] text-muted";

type Sponsor = { id: string; full_name: string; username: string; status: string };

export function MemberReferralControls({
  memberId,
  currentSponsorId,
  sponsors,
  lockedAt,
}: {
  memberId: string;
  currentSponsorId: string | null;
  sponsors: Sponsor[];
  lockedAt: string | null;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateMemberSponsor, {});

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div>
        <p className="text-small font-medium">Referral relationship</p>
        <p className="mt-1 text-micro text-muted">
          Attach, move or remove this member&apos;s sponsor. The referral graph is rebuilt after each approved change.
        </p>
      </div>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="member_id" value={memberId} />
        <div>
          <label htmlFor="member-sponsor" className={label}>Sponsor</label>
          <select id="member-sponsor" name="sponsor_id" defaultValue={currentSponsorId ?? ""} className={input}>
            <option value="">No sponsor · direct member</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.full_name} · @{sponsor.username} · {sponsor.status}
              </option>
            ))}
          </select>
          <p className="mt-2 text-micro text-muted">
            {lockedAt ? `Currently locked since ${new Date(lockedAt).toLocaleDateString()}.` : "No sponsor is currently attached."}
          </p>
        </div>
        <div>
          <label htmlFor="member-sponsor-reason" className={label}>Reason for change</label>
          <textarea id="member-sponsor-reason" name="reason" minLength={10} maxLength={500} required rows={3} placeholder="Example: Corrected sponsor after verified support ticket and payment record review." className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" />
        </div>
        <label className="flex items-start gap-3 rounded-control border border-warning/30 bg-warning/5 p-3 text-small">
          <input type="checkbox" name="acknowledged" required className="mt-1 size-4 accent-violet" />
          <span>I confirm this is an audited referral correction. Existing commissions are not rewritten.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} variant="tertiary">
            {pending ? <LoaderCircle size={15} className="animate-spin" /> : "Save referral relationship"}
          </Button>
          {state.error ? <p role="alert" className="text-small text-critical">{state.error}</p> : null}
          {state.ok ? <p role="status" className="text-small text-positive">{state.ok}</p> : null}
        </div>
      </form>
    </div>
  );
}
