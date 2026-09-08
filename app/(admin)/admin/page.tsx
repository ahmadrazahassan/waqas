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
    </>
  );
}
