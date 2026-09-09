"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { recomputeMemberRank, updateMemberControls, updateMemberProfile, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

const input = "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-small";
const label = "block text-micro font-medium uppercase tracking-[0.08em] text-muted";

export function MemberControls({ member }: { member: { id: string; status: string; kyc_status: string; commission_eligible: boolean; full_name: string; display_name: string | null; headline: string | null; bio: string | null; phone_e164: string | null; country_code: string; timezone: string; leaderboard_optin: boolean } }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateMemberControls, {});
  const [rankState, rankAction, rankPending] = useActionState<AdminState, FormData>(recomputeMemberRank, {});
  const [profileState, profileAction, profilePending] = useActionState<AdminState, FormData>(updateMemberProfile, {});
  return (
    <div className="space-y-6">
      <form action={profileAction} className="space-y-4">
        <input type="hidden" name="member_id" value={member.id} />
        <div><p className="text-small font-medium">Profile access</p><p className="mt-1 text-micro text-muted">Admins can correct member-facing profile details without touching authentication credentials.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="member-full-name" className={label}>Full name</label><input id="member-full-name" name="full_name" required defaultValue={member.full_name} className={input} /></div><div><label htmlFor="member-display-name" className={label}>Display name</label><input id="member-display-name" name="display_name" defaultValue={member.display_name ?? ""} className={input} /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="member-headline" className={label}>Headline</label><input id="member-headline" name="headline" defaultValue={member.headline ?? ""} className={input} /></div><div><label htmlFor="member-phone" className={label}>Phone (E.164)</label><input id="member-phone" name="phone_e164" defaultValue={member.phone_e164 ?? ""} placeholder="+923001234567" className={input} /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="member-country" className={label}>Country code</label><input id="member-country" name="country_code" maxLength={2} required defaultValue={member.country_code} className={`${input} uppercase`} /></div><div><label htmlFor="member-timezone" className={label}>Timezone</label><input id="member-timezone" name="timezone" required defaultValue={member.timezone} className={input} /></div></div>
        <div><label htmlFor="member-bio" className={label}>Bio</label><textarea id="member-bio" name="bio" rows={3} maxLength={1000} defaultValue={member.bio ?? ""} className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" /></div>
        <label className="flex items-start gap-3 rounded-control border border-line bg-bg p-4"><input type="checkbox" name="leaderboard_optin" defaultChecked={member.leaderboard_optin} className="mt-0.5 size-4 accent-violet" /><span className="text-small"><span className="font-medium">Leaderboard opt-in</span><span className="mt-1 block text-micro text-muted">Controls whether this member appears publicly on prize and performance boards.</span></span></label>
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={profilePending} variant="tertiary">{profilePending ? <LoaderCircle size={15} className="animate-spin" /> : "Save profile"}</Button>{profileState.error ? <p role="alert" className="text-small text-critical">{profileState.error}</p> : null}{profileState.ok ? <p role="status" className="text-small text-positive">{profileState.ok}</p> : null}</div>
      </form>
      <div className="border-t border-line pt-6">
      <form action={action} className="space-y-4">
        <input type="hidden" name="member_id" value={member.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="member-status" className={label}>Account status</label><select id="member-status" name="status" defaultValue={member.status} className={input}><option value="pending">Pending</option><option value="active">Active</option><option value="restricted">Restricted</option><option value="suspended">Suspended</option><option value="closed">Closed</option></select></div>
          <div><label htmlFor="member-kyc" className={label}>KYC status</label><select id="member-kyc" name="kyc_status" defaultValue={member.kyc_status} className={input}><option value="none">Not started</option><option value="pending">Pending review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></div>
        </div>
        <label className="flex items-start gap-3 rounded-control border border-line bg-bg p-4"><input type="checkbox" name="commission_eligible" defaultChecked={member.commission_eligible} className="mt-0.5 size-4 accent-violet" /><span className="text-small"><span className="font-medium">Commission eligible</span><span className="mt-1 block text-micro text-muted">Turn this off to hold new commission without deleting historical ledger entries.</span></span></label>
        <div><label htmlFor="member-note" className={label}>Member notice (optional)</label><textarea id="member-note" name="note" rows={3} maxLength={500} placeholder="A clear note the member should see in their notifications." className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" /></div>
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending} arrow={!pending}>{pending ? <LoaderCircle size={15} className="animate-spin" /> : "Save member controls"}</Button>{state.error ? <p role="alert" className="text-small text-critical">{state.error}</p> : null}{state.ok ? <p role="status" className="text-small text-positive">{state.ok}</p> : null}</div>
      </form>
      <form action={rankAction} className="border-t border-line pt-5"><input type="hidden" name="member_id" value={member.id} /><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-small font-medium">Recalculate rank</p><p className="mt-1 text-micro text-muted">Uses paid referrals and approved task activity from the database.</p></div><Button type="submit" size="sm" variant="tertiary" disabled={rankPending}>{rankPending ? <LoaderCircle size={14} className="animate-spin" /> : "Recompute"}</Button></div>{rankState.error ? <p role="alert" className="mt-3 text-small text-critical">{rankState.error}</p> : null}{rankState.ok ? <p role="status" className="mt-3 text-small text-positive">{rankState.ok}</p> : null}</form>
      </div>
    </div>
  );
}
