import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatTile, Card, Status, Empty } from "@/components/app/ui";
import { formatMoney, formatDate } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { count: members },
    { count: activeMembers },
    { data: monthPayments },
    { data: liability },
    { data: payoutQueue },
    { count: openTasks },
    { count: reviewQueue },
    { count: openFraud },
    { data: recentMembers },
    { count: pendingKyc },
    { count: openClaims },
    { data: recentAudit },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"]),
    supabase
      .from("payments")
      .select("net_minor, gross_minor")
      .eq("status", "succeeded")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("commissions")
      .select("amount_minor")
      .in("status", ["pending", "review", "available"]),
    supabase
      .from("payout_requests")
      .select("amount_minor")
      .in("status", ["requested", "approved", "processing"]),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "in_review"]),
    supabase
      .from("fraud_signals")
      .select("*", { count: "exact", head: true })
      .eq("state", "open"),
    supabase
      .from("profiles")
      .select("id, full_name, username, country_code, status, created_at, ranks(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "pending"),
    supabase.from("task_claims").select("id", { count: "exact", head: true }).in("status", ["active", "submitted", "in_review"]),
    supabase.from("audit_log").select("id, action, subject_table, subject_id, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const mrr = (monthPayments ?? []).reduce((s, p) => s + p.gross_minor, 0);
  const net = (monthPayments ?? []).reduce((s, p) => s + p.net_minor, 0);
  const outstanding = (liability ?? []).reduce((s, c) => s + c.amount_minor, 0);
  const queueValue = (payoutQueue ?? []).reduce((s, p) => s + p.amount_minor, 0);

  return (
    <>
      <PageTitle
        title="Overview"
        lead="Everything here is live from the database. No cached figures, no rounded totals."
      />

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Members" value={String(members ?? 0)} sub={`${activeMembers ?? 0} on a paid plan`} />
        <StatTile label="Revenue this month" value={formatMoney(mrr)} sub={`${formatMoney(net)} net of fees`} tone="ink" />
        <StatTile
          label="Commission liability"
          value={formatMoney(outstanding)}
          sub="Pending plus cleared but unpaid"
        />
        <StatTile
          label="Payout queue"
          value={formatMoney(queueValue)}
          sub={`${(payoutQueue ?? []).length} requests waiting`}
          href="/admin/payouts"
        />
      </div>

      <div className="mt-px grid gap-px sm:grid-cols-3">
        <StatTile label="Open tasks" value={String(openTasks ?? 0)} href="/admin/tasks" />
        <StatTile
          label="Awaiting review"
          value={String(reviewQueue ?? 0)}
          href="/admin/reviews"
          tone={reviewQueue && reviewQueue > 0 ? "lime" : "light"}
        />
        <StatTile
          label="Open fraud signals"
          value={String(openFraud ?? 0)}
          href="/admin/fraud"
        />
      </div>

      <div className="mt-px grid gap-px sm:grid-cols-3">
        <StatTile label="Active claims" value={String(openClaims ?? 0)} sub="Members currently working" href="/admin/reviews" />
        <StatTile label="KYC pending" value={String(pendingKyc ?? 0)} sub="Identity checks to review" href="/admin/members" tone={pendingKyc ? "lime" : "light"} />
        <StatTile label="Staff activity" value={String(recentAudit?.length ?? 0)} sub="Latest audit entries shown below" />
      </div>

      <div className="mt-8">
        <Card>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-h4">Newest members</h2>
            <Link
              href="/admin/members"
              className="text-small text-violet underline-offset-2 hover:underline"
            >
              All members
            </Link>
          </div>

          <div className="mt-5">
            {(recentMembers ?? []).length === 0 ? (
              <Empty
                title="No members yet"
                body="The first signup will appear here. Nothing on this page is seeded."
              />
            ) : (
              <ul className="border-t border-line">
                {(recentMembers ?? []).map((m) => {
                  const rank = m.ranks as unknown as { name: string } | null;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-4 border-b border-line py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-small font-medium">
                          {m.full_name}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-micro text-muted">
                          <span>@{m.username}</span>
                          <span aria-hidden="true">·</span>
                          <CountryChip code={m.country_code} size="sm" />
                          <span aria-hidden="true">·</span>
                          <span>{rank?.name}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-micro text-muted">
                          {formatDate(m.created_at)}
                        </span>
                        <Status status={m.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-baseline justify-between gap-4"><h2 className="text-h4">Operations queue</h2><span className="text-micro uppercase tracking-widest text-muted">Next actions</span></div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            <li className="flex items-center justify-between gap-4 py-4"><div><p className="text-small font-medium">Payment verification</p><p className="text-micro text-muted">Receipts waiting for a finance decision</p></div><Link href="/admin/payments" className="text-small text-violet underline-offset-4 hover:underline">Open queue</Link></li>
            <li className="flex items-center justify-between gap-4 py-4"><div><p className="text-small font-medium">Task submissions</p><p className="text-micro text-muted">Score work against the member-facing brief</p></div><Link href="/admin/reviews" className="text-small text-violet underline-offset-4 hover:underline">Review work</Link></li>
            <li className="flex items-center justify-between gap-4 py-4"><div><p className="text-small font-medium">Member health</p><p className="text-micro text-muted">KYC, restrictions and fraud signals</p></div><Link href="/admin/members" className="text-small text-violet underline-offset-4 hover:underline">Manage members</Link></li>
          </ul>
        </Card>
        <Card>
          <div className="flex items-baseline justify-between gap-4"><h2 className="text-h4">Recent audit activity</h2><Link href="/admin/members" className="text-small text-violet underline-offset-4 hover:underline">Member controls</Link></div>
          {(recentAudit ?? []).length ? <ul className="mt-4 divide-y divide-line border-y border-line">{recentAudit?.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-small font-medium">{entry.action}</p><p className="text-micro text-muted">{entry.subject_table} · {entry.subject_id ? `${entry.subject_id.slice(0, 8)}…` : "system"}</p></div><span className="shrink-0 text-micro text-muted">{formatDate(entry.created_at)}</span></li>)}</ul> : <Empty title="No audit activity" body="Operational changes will appear here as staff use the console." />}
        </Card>
      </div>
    </>
  );
}
