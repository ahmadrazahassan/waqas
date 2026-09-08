import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import { memberAnnouncements } from "@/lib/announcements";
import { PageTitle, StatTile, Card, Status, Empty, Progress } from "@/components/app/ui";
import { ReferralLink } from "@/components/app/referral-link";
import { TimeLeft } from "@/components/app/time-left";
import { formatMoney, formatDate } from "@/lib/utils";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const h = await headers();
  const origin =
    h.get("origin") ??
    (h.get("host") ? `https://${h.get("host")}` : site.url);

  const [
    { data: walletRows },
    { data: pendingRows },
    { data: activeClaims },
    { data: recentLedger },
    { count: directCount },
    { count: networkCount },
    { data: membership },
    { data: openTasks },
    { data: nextRank },
  ] = await Promise.all([
    supabase
      .from("wallet_entries")
      .select("balance_after_minor")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("commissions")
      .select("amount_minor")
      .eq("earner_id", user.id)
      .in("status", ["pending", "review"]),
    supabase
      .from("task_claims")
      .select("id, status, due_at, tasks(title, slug, payout_minor)")
      .eq("user_id", user.id)
      .in("status", ["active", "revision"])
      .order("due_at", { ascending: true })
      .limit(4),
    supabase
      .from("wallet_entries")
      .select("id, entry_type, amount_minor, memo, created_at")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(5),
    supabase
      .from("referral_edges")
      .select("*", { count: "exact", head: true })
      .eq("ancestor_id", user.id)
      .eq("depth", 1),
    supabase
      .from("referral_edges")
      .select("*", { count: "exact", head: true })
      .eq("ancestor_id", user.id),
    supabase
      .from("memberships")
      .select("*, plans(name, price_minor)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, slug, payout_minor, due_hours, task_categories(name)")
      .eq("status", "open")
      .order("opens_at", { ascending: false })
      .limit(4),
    supabase
      .from("ranks")
      .select("*")
      .gt("id", user.profile.rank_id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const balance = walletRows?.[0]?.balance_after_minor ?? 0;
  const pending = (pendingRows ?? []).reduce((sum, r) => sum + r.amount_minor, 0);
  const plan = (membership as { plans?: { name: string } } | null)?.plans;

  return (
    <>
      <PageTitle
        title={`Assalam o alaikum, ${user.profile.full_name.split(" ")[0]}`}
        lead={
          plan
            ? `You are on ${plan.name}. Everything below is live from your account.`
            : "You have not bought a plan yet, so the task pool and commission are locked."
        }
      />

      {!plan ? (
        <div className="mb-8 rounded-md border border-line border-s-2 border-s-warning bg-surface p-6">
          <p className="text-h4">Pick a plan to unlock the platform</p>
          <p className="mt-2 max-w-[62ch] text-small text-muted">
            One payment from 5,000 PKR opens your account for good. It unlocks
            the task pool, the referral programme, and a place on the
            leaderboard. There is no monthly fee.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex h-11 items-center rounded-sm border border-ink bg-lime px-5 text-small font-medium text-ink transition-colors duration-200 hover:bg-lime-press"
          >
            See the plans
          </Link>
        </div>
      ) : null}

      <AnnouncementBand
        items={memberAnnouncements}
        tone="ink"
        speed={44}
        className="mb-8 rounded-md"
      />

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Available balance"
          value={formatMoney(balance)}
          sub="Ready to withdraw"
          tone="ink"
          href="/dashboard/earnings"
        />
        <StatTile
          label="Pending commission"
          value={formatMoney(pending)}
          sub="Clears three days after each payment"
          href="/dashboard/earnings"
        />
        <StatTile
          label="Direct referrals"
          value={String(directCount ?? 0)}
          sub={`${networkCount ?? 0} in your whole network`}
          href="/dashboard/referrals"
        />
        <StatTile
          label="Active tasks"
          value={String(activeClaims?.length ?? 0)}
          sub={
            nextRank
              ? `Next level: ${nextRank.name}`
              : "You are at the top level"
          }
          href="/dashboard/tasks"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 xl:col-span-7">
          <Card>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-h4">Your work this week</h2>
              <Link
                href="/dashboard/tasks"
                className="text-small text-violet underline-offset-2 hover:underline"
              >
                All tasks
              </Link>
            </div>

            <div className="mt-5">
              {activeClaims && activeClaims.length > 0 ? (
                <ul className="border-t border-line">
                  {activeClaims.map((claim) => {
                    const task = claim.tasks as unknown as {
                      title: string;
                      payout_minor: number;
                    } | null;
                    return (
                      <li
                        key={claim.id}
                        className="flex items-center justify-between gap-4 border-b border-line py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-small font-medium">
                            {task?.title ?? "Task"}
                          </p>
                          <TimeLeft dueAt={claim.due_at} />
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-small tabular">
                            {formatMoney(task?.payout_minor ?? 0)}
                          </span>
                          <Status status={claim.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty
                  title="Nothing in progress"
                  body="Claim a task and it will show up here with a countdown to the deadline."
                  action={{ label: "Browse open tasks", href: "/dashboard/tasks" }}
                />
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-h4">Open now, matching your rank</h2>
              <Link
                href="/dashboard/tasks"
                className="text-small text-violet underline-offset-2 hover:underline"
              >
                See all
              </Link>
            </div>

            <div className="mt-5">
              {openTasks && openTasks.length > 0 ? (
                <ul className="border-t border-line">
                  {openTasks.map((task) => {
                    const category = task.task_categories as unknown as {
                      name: string;
                    } | null;
                    return (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-4 border-b border-line py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-small font-medium">
                            {task.title}
                          </p>
                          <p className="text-micro text-muted">
                            {category?.name} · {task.due_hours} hours
                          </p>
                        </div>
                        <span className="shrink-0 text-small tabular">
                          {formatMoney(task.payout_minor)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty
                  title="The pool is empty right now"
                  body="New tasks are posted every weekday. We would rather show you nothing than a task you cannot claim."
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6 xl:col-span-5">
          <Card>
            <ReferralLink code={user.profile.referral_code} origin={origin} />
          </Card>

          <Card>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-h4">Recent wallet activity</h2>
              <Link
                href="/dashboard/earnings"
                className="text-small text-violet underline-offset-2 hover:underline"
              >
                Full ledger
              </Link>
            </div>

            <div className="mt-5">
              {recentLedger && recentLedger.length > 0 ? (
                <ul className="border-t border-line">
                  {recentLedger.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-4 border-b border-line py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-small">
                          {entry.memo ?? entry.entry_type}
                        </p>
                        <p className="text-micro text-muted">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                      <span
                        className={
                          entry.amount_minor >= 0
                            ? "shrink-0 text-small text-positive tabular"
                            : "shrink-0 text-small text-critical tabular"
                        }
                      >
                        {entry.amount_minor >= 0 ? "+" : ""}
                        {formatMoney(entry.amount_minor)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-muted">
                  Nothing yet. Your first task payment or commission will appear
                  here.
                </p>
              )}
            </div>
          </Card>

          {nextRank ? (
            <Card>
              <h2 className="text-h4">Progress to {nextRank.name}</h2>
              <div className="mt-5 space-y-4">
                <Progress
                  label="Direct active referrals"
                  value={Math.min(directCount ?? 0, nextRank.direct_referrals)}
                  max={nextRank.direct_referrals}
                />
                <p className="text-micro text-muted">
                  {nextRank.unlocks}
                </p>
              </div>
              <Link
                href="/dashboard/rank"
                className="mt-5 inline-block text-small text-violet underline-offset-2 hover:underline"
              >
                See every requirement
              </Link>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
