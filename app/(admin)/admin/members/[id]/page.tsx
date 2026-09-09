import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, DataTable, Empty, Status } from "@/components/app/ui";
import { MemberControls } from "@/components/admin/member-controls";
import { MemberFinanceControls } from "@/components/admin/member-finance-controls";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Member management" };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: member }, { data: membership }, { data: claims }, { data: referrals }, { data: commissions }, { data: fraud }, { data: audit }, { data: wallet }] = await Promise.all([
    supabase.from("profiles").select("*, ranks(*)").eq("id", id).maybeSingle(),
    supabase.from("memberships").select("*, plans(name, price_minor)").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("task_claims").select("id, status, claimed_at, due_at, tasks(title, payout_minor, currency)").eq("user_id", id).order("claimed_at", { ascending: false }).limit(25),
    supabase.from("profiles").select("id, full_name, username, status, created_at, ranks(name)").eq("referred_by", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("commissions").select("id, amount_minor, currency, depth, status, created_at, source_user_id").eq("earner_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("fraud_signals").select("id, signal, severity, state, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("audit_log").select("id, action, subject_table, created_at, after").eq("subject_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("wallet_entries").select("balance_after_minor").eq("user_id", id).order("id", { ascending: false }).limit(1),
  ]);
  if (!member) notFound();
  const rank = member.ranks as unknown as { name: string; multiplier_bps: number; direct_referrals: number } | null;
  const currentMembership = membership?.[0] as unknown as { status: string; expires_at: string | null; plans: { name: string; price_minor: number } | null } | undefined;
  const taskRows = (claims ?? []) as unknown as { id: string; status: string; claimed_at: string; due_at: string; tasks: { title: string; payout_minor: number; currency: string } | null }[];
  const referralRows = (referrals ?? []) as unknown as { id: string; full_name: string; username: string; status: string; created_at: string; ranks: { name: string } | null }[];
  const commissionRows = (commissions ?? []) as unknown as { id: string; amount_minor: number; currency: string; depth: number; status: string; created_at: string }[];
  const balance = wallet?.[0]?.balance_after_minor ?? 0;

  return (
    <>
      <PageTitle title={member.full_name} lead={`@${member.username} · joined ${formatDate(member.created_at)} · member operations profile`}>
        <Link href="/admin/members" className="inline-flex h-10 items-center rounded-sm border border-line px-4 text-small">Back to members</Link>
      </PageTitle>

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Account</p><div className="mt-3"><Status status={member.status} /></div><p className="mt-3 text-small text-muted">{member.country_code} · {member.timezone}</p></div>
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Rank</p><p className="mt-3 text-h3">{rank?.name ?? "Associate"}</p><p className="mt-2 text-small text-muted">{rank?.direct_referrals ?? 0} direct referrals</p></div>
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Plan</p><p className="mt-3 text-h3">{currentMembership?.plans?.name ?? "None"}</p><p className="mt-2 text-small text-muted">{currentMembership?.status ?? "No active membership"}</p></div>
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Risk signals</p><p className="mt-3 text-h3">{(fraud ?? []).filter((s) => s.state === "open").length}</p><p className="mt-2 text-small text-muted">{(fraud ?? []).length} recorded in total</p></div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7"><Card><h2 className="text-h4">Member controls</h2><p className="mt-2 mb-5 text-small text-muted">Every change is written to the audit log. Historical payments and wallet entries are never deleted from this screen.</p><MemberControls member={{ id: member.id, status: member.status, kyc_status: member.kyc_status, commission_eligible: member.commission_eligible, full_name: member.full_name, display_name: member.display_name, headline: member.headline, bio: member.bio, phone_e164: member.phone_e164, country_code: member.country_code, timezone: member.timezone, leaderboard_optin: member.leaderboard_optin }} /></Card></div>
        <div className="space-y-6 xl:col-span-5"><Card><p className="text-micro uppercase tracking-widest text-muted">Identity and referral</p><dl className="mt-4 divide-y divide-line border-y border-line"><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Referral code</dt><dd className="tabular">{member.referral_code}</dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Sponsor</dt><dd className="tabular">{member.referred_by ? "Attached" : "Direct"}</dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">KYC</dt><dd><Status status={member.kyc_status} /></dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Commission</dt><dd>{member.commission_eligible ? "Eligible" : "Paused"}</dd></div></dl></Card><Card><h2 className="text-h4">Recent risk signals</h2>{(fraud ?? []).length ? <ul className="mt-4 divide-y divide-line">{fraud?.slice(0, 5).map((signal) => <li key={signal.id} className="py-3"><div className="flex justify-between gap-3 text-small"><span>{signal.signal}</span><Status status={signal.state} /></div><p className="mt-1 text-micro text-muted">{signal.severity} · {formatDate(signal.created_at)}</p></li>)}</ul> : <p className="mt-3 text-small text-muted">No recorded fraud signals.</p>}</Card></div>
      </div>

      <div className="mt-8"><Card><h2 className="text-h4">Financial controls</h2><p className="mt-2 mb-5 max-w-[70ch] text-small text-muted">Finance, admin and owner roles can correct a member’s earning position here. The original commission and ledger records remain intact; corrections are new, visible entries with a reason.</p><MemberFinanceControls memberId={member.id} balance={balance} commissions={commissionRows.map((row) => ({ id: row.id, amount_minor: row.amount_minor, status: row.status, created_at: row.created_at }))} /></Card></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2"><Card><h2 className="text-h4">Task activity</h2><div className="mt-4"><DataTable rows={taskRows} keyOf={(row) => row.id} empty={<Empty title="No task claims" body="This member has not claimed a task yet." />} columns={[{ key: "task", header: "Task", render: (row) => row.tasks?.title ?? "Unknown task" }, { key: "status", header: "Status", render: (row) => <Status status={row.status} /> }, { key: "due", header: "Due", render: (row) => formatDate(row.due_at) }, { key: "payout", header: "Payout", align: "end", render: (row) => formatMoney(row.tasks?.payout_minor ?? 0, row.tasks?.currency === "USD" ? "USD" : "PKR") }]} /></div></Card><Card><h2 className="text-h4">Referral activity</h2><div className="mt-4"><DataTable rows={referralRows} keyOf={(row) => row.id} empty={<Empty title="No direct referrals" body="People joining with this member’s code will appear here." />} columns={[{ key: "member", header: "Member", render: (row) => <span><span className="block font-medium">{row.full_name}</span><span className="text-micro text-muted">@{row.username}</span></span> }, { key: "rank", header: "Rank", render: (row) => row.ranks?.name ?? "Associate" }, { key: "status", header: "Status", render: (row) => <Status status={row.status} /> }, { key: "joined", header: "Joined", render: (row) => formatDate(row.created_at) }]} /></div></Card></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2"><Card><h2 className="text-h4">Commission history</h2><div className="mt-4"><DataTable rows={commissionRows} keyOf={(row) => row.id} empty={<Empty title="No commission yet" body="Commission created through the referral ledger will appear here." />} columns={[{ key: "date", header: "Date", render: (row) => formatDate(row.created_at) }, { key: "depth", header: "Depth", render: (row) => `Level ${row.depth}` }, { key: "status", header: "Status", render: (row) => <Status status={row.status} /> }, { key: "amount", header: "Amount", align: "end", render: (row) => formatMoney(row.amount_minor, row.currency === "USD" ? "USD" : "PKR") }]} /></div></Card><Card><h2 className="text-h4">Audit trail</h2>{(audit ?? []).length ? <ul className="mt-4 divide-y divide-line">{audit?.slice(0, 8).map((entry) => <li key={entry.id} className="py-3"><p className="text-small font-medium">{entry.action}</p><p className="mt-1 text-micro text-muted">{entry.subject_table} · {formatDate(entry.created_at)}</p></li>)}</ul> : <p className="mt-3 text-small text-muted">No audit entries for this member yet.</p>}</Card></div>
    </>
  );
}
