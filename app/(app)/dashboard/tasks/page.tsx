import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePaidAccess } from "@/lib/payment-access";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty } from "@/components/app/ui";
import { ClaimButton } from "@/components/app/task-forms";
import { TimeLeft } from "@/components/app/time-left";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "available" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await requirePaidAccess(user);

  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: open }, { data: claims }, { data: membership }, { count: usedThisMonth }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, task_categories(name)")
        .eq("status", "open")
        .order("opens_at", { ascending: false }),
      supabase
        .from("task_claims")
        .select("*, tasks(title, slug, payout_minor, brief, task_categories(name))")
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false }),
      supabase
        .from("memberships")
        .select("plans(name, monthly_claims)")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle(),
      supabase
        .from("task_claims")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("claimed_at", monthStart.toISOString()),
    ]);

  const plan = (membership as { plans?: { name: string; monthly_claims: number | null } } | null)?.plans;
  const quota = plan?.monthly_claims ?? null;
  const used = usedThisMonth ?? 0;
  const remaining = quota === null ? null : Math.max(0, quota - used);

  const claimedIds = new Set((claims ?? []).map((c) => c.task_id));
  const active = (claims ?? []).filter((c) => ["active", "revision"].includes(c.status));
  const inReview = (claims ?? []).filter((c) => ["submitted", "in_review"].includes(c.status));
  const done = (claims ?? []).filter((c) => ["approved", "rejected", "expired"].includes(c.status));

  const tabs = [
    { key: "available", label: "Available", count: (open ?? []).length },
    { key: "active", label: "In progress", count: active.length },
    { key: "review", label: "In review", count: inReview.length },
    { key: "history", label: "History", count: done.length },
  ];

  return (
    <>
      <PageTitle
        title="Tasks"
        lead={
          plan
            ? remaining === null
              ? `${plan.name} plan, unlimited claims.`
              : `${plan.name} plan. ${remaining} of ${quota} claims left this month.`
            : "You need an active plan to claim tasks."
        }
      />

      <nav aria-label="Task tabs" className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/tasks?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={
              tab === t.key
                ? "border-b-2 border-ink px-4 py-3 text-small font-medium"
                : "border-b-2 border-transparent px-4 py-3 text-small text-muted hover:text-ink"
            }
          >
            {t.label}
            <span className="ms-2 text-micro tabular">{t.count}</span>
          </a>
        ))}
      </nav>

      {tab === "available" ? (
        (open ?? []).length === 0 ? (
          <Empty
            title="Nothing open right now"
            body="New tasks go up every weekday. We would rather show you an empty pool than tasks nobody can claim."
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {(open ?? []).map((task) => {
              const category = task.task_categories as unknown as { name: string } | null;
              const alreadyClaimed = claimedIds.has(task.id);
              const quotaHit = remaining !== null && remaining <= 0;
              const rankLocked = task.min_rank_id > user.profile.rank_id;

              const reason = task.currency !== "PKR" ? "Payout confirmation pending"
                : task.claims_used >= task.max_claims ? "All spaces are taken"
                : !plan
                ? "You need an active plan"
                : rankLocked
                  ? `Needs rank ${task.min_rank_id} or above`
                  : alreadyClaimed
                    ? "You have already claimed this"
                    : quotaHit
                      ? "No claims left this month"
                      : null;

              return (
                <Card key={task.id} className="flex flex-col rounded-panel">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-micro uppercase tracking-[0.08em] text-muted">
                        {category?.name}
                      </p>
                      <h2 className="mt-2 text-h4">{task.title}</h2>
                    </div>
                    <span className="shrink-0 text-h4 tabular">
                      {formatMoney(task.payout_minor, task.currency === "USD" ? "USD" : "PKR")}
                    </span>
                  </div>

                  <p className="mt-3 flex-1 text-small text-muted">{task.summary}</p>

                  <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                    <div>
                      <dt className="text-micro text-muted">Deadline</dt>
                      <dd className="text-small tabular">{task.due_hours}h</dd>
                    </div>
                    <div>
                      <dt className="text-micro text-muted">Min rank</dt>
                      <dd className="text-small tabular">{task.min_rank_id}</dd>
                    </div>
                    <div>
                      <dt className="text-micro text-muted">Spaces</dt>
                      <dd className="text-small tabular">
                        {task.max_claims - task.claims_used} left
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    {alreadyClaimed ? <Link href={`/dashboard/tasks/${task.id}#submission`} className="inline-flex min-h-11 items-center rounded-control bg-lime px-5 text-small font-medium">Open & submit work</Link> : <ClaimButton taskId={task.id} disabledReason={reason} />}
                    <Link href={`/dashboard/tasks/${task.id}`} className="mt-3 inline-flex min-h-9 items-center text-small text-violet">Read instructions →</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "active" ? (
        active.length === 0 ? (
          <Empty
            title="Nothing in progress"
            body="Claim something from the available tab and it appears here with a countdown."
            action={{ label: "Browse available", href: "/dashboard/tasks?tab=available" }}
          />
        ) : (
          <div className="space-y-6">
            {active.map((claim) => {
              const task = claim.tasks as unknown as {
                title: string;
                brief: string;
                payout_minor: number;
              } | null;
              return (
                <Card key={claim.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-h4">{task?.title}</h2>
                      <TimeLeft dueAt={claim.due_at} className="mt-1 block" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-h4 tabular">
                        {formatMoney(task?.payout_minor ?? 0)}
                      </span>
                      <Status status={claim.status} />
                    </div>
                  </div>

                  <div className="mt-5 border-t border-line pt-5">
                    <Link href={`/dashboard/tasks/${claim.task_id}#submission`} className="inline-flex min-h-11 items-center rounded-control bg-lime px-5 text-small font-medium">Continue & submit work →</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "review" ? (
        inReview.length === 0 ? (
          <Empty title="Nothing waiting on a reviewer" body="Submitted work shows up here until it is scored." />
        ) : (
          <div className="space-y-3">
            {inReview.map((claim) => {
              const task = claim.tasks as unknown as { title: string; payout_minor: number } | null;
              return (
                <Card key={claim.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-small font-medium">{task?.title}</p>
                    <p className="text-micro text-muted">
                      Submitted {formatDate(claim.claimed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-small tabular">
                      {formatMoney(task?.payout_minor ?? 0)}
                    </span>
                    <Status status={claim.status} />
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "history" ? (
        done.length === 0 ? (
          <Empty title="No history yet" body="Approved and rejected work collects here." />
        ) : (
          <div className="space-y-3">
            {done.map((claim) => {
              const task = claim.tasks as unknown as { title: string; payout_minor: number } | null;
              return (
                <Card key={claim.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-small font-medium">{task?.title}</p>
                    <p className="text-micro text-muted">
                      {claim.closed_at ? formatDate(claim.closed_at) : formatDate(claim.claimed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-small tabular">
                      {formatMoney(task?.payout_minor ?? 0)}
                    </span>
                    <Status status={claim.status} />
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}
    </>
  );
}
