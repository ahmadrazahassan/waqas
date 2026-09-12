import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable, StatTile } from "@/components/app/ui";
import { TaskForm } from "@/components/admin/task-form";
import { TaskLifecycleControls } from "@/components/admin/task-lifecycle-controls";
import { formatMoney, formatDate } from "@/lib/utils";
import { route } from "@/lib/routes";

export const metadata: Metadata = { title: "Task operations" };

export default async function AdminTasksPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();
  let taskQuery = supabase.from("tasks").select("*, task_categories(name)").order("created_at", { ascending: false }).limit(100);
  if (q.trim()) taskQuery = taskQuery.ilike("title", `%${q.trim()}%`);
  if (status) taskQuery = taskQuery.eq("status", status as never);

  const [{ data: tasks }, { data: categories }, { data: ranks }, { data: allTasks }, { count: pendingClaims }] = await Promise.all([
    taskQuery,
    supabase.from("task_categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("ranks").select("id, name").order("id"),
    supabase.from("tasks").select("status, claims_used, max_claims"),
    supabase.from("task_claims").select("id", { count: "exact", head: true }).in("status", ["submitted", "in_review"]),
  ]);
  const counts = (allTasks ?? []).reduce<Record<string, number>>((acc, task) => { acc[task.status] = (acc[task.status] ?? 0) + 1; return acc; }, {});
  const claims = (allTasks ?? []).reduce((sum, task) => sum + task.claims_used, 0);
  const capacity = (allTasks ?? []).reduce((sum, task) => sum + task.max_claims, 0);

  return (
    <>
      <PageTitle title="Task operations" lead="Create, edit, schedule and control every task from one place. A task cannot be published while its compliance flag is restricted.">
        <Link href="#new-task" className="inline-flex h-10 items-center rounded-sm bg-lime px-5 text-small font-medium">New task</Link>
      </PageTitle>

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total tasks" value={String(allTasks?.length ?? 0)} sub={`${counts.open ?? 0} open now`} />
        <StatTile label="Drafts" value={String(counts.draft ?? 0)} sub="Awaiting operator review" tone="ink" />
        <StatTile label="Claimed capacity" value={`${claims}/${capacity}`} sub="Across all task spaces" />
        <StatTile label="Review queue" value={String(pendingClaims ?? 0)} sub="Submitted or in review" href="/admin/reviews" tone={pendingClaims ? "lime" : "light"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div id="new-task" className="scroll-mt-6 xl:col-span-5"><Card><div className="flex items-baseline justify-between gap-4"><div><h2 className="text-h4">Create a task</h2><p className="mt-1 text-small text-muted">Use the full brief for the member-facing instructions.</p></div><span className="rounded-xs bg-violet-soft px-2 py-1 text-micro text-violet">operator</span></div><TaskForm categories={categories ?? []} ranks={ranks ?? []} /></Card></div>
        <div className="xl:col-span-7"><Card><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-h4">Task catalogue</h2><p className="mt-1 text-small text-muted">Search, inspect and change lifecycle without leaving the queue.</p></div><form className="flex w-full flex-wrap gap-2 sm:w-auto"><input name="q" defaultValue={q} placeholder="Search task title" className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-small sm:w-auto" /><select name="status" defaultValue={status} className="h-10 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-small sm:flex-none"><option value="">All statuses</option><option value="draft">Draft</option><option value="open">Open</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="h-10 rounded-sm border border-ink bg-ink px-4 text-small font-medium text-white">Filter</button></form></div><div className="mt-5"><DataTable rows={tasks ?? []} keyOf={(t) => t.id} empty={<Empty title="No tasks match" body="Change the filter or create a new task." />} columns={[{ key: "task", header: "Task", render: (t) => { const category = t.task_categories as unknown as { name: string } | null; return <span><Link href={route(`/admin/tasks/${t.id}`)} className="font-medium underline-offset-4 hover:underline">{t.title}</Link><span className="block text-micro text-muted">{category?.name ?? "Uncategorised"} · rank {t.min_rank_id}+ · {t.deliverable_type}</span></span>; } }, { key: "status", header: "Status", render: (t) => <Status status={t.status} /> }, { key: "usage", header: "Usage", render: (t) => <span className="tabular">{t.claims_used}/{t.max_claims}<span className="block text-micro text-muted">opens {formatDate(t.opens_at)}</span></span> }, { key: "payout", header: "Payout", align: "end", render: (t) => <span>{formatMoney(t.payout_minor, t.currency === "USD" ? "USD" : "PKR")}<span className="block text-micro text-muted">{t.currency}</span></span> }, { key: "actions", header: "Actions", align: "end", render: (t) => <TaskLifecycleControls taskId={t.id} status={t.status} /> }]} /></div></Card></div>
      </div>
    </>
  );
}
