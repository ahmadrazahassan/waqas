import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Status } from "@/components/app/ui";
import { TaskForm } from "@/components/admin/task-form";

export const metadata: Metadata = { title: "Edit task" };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: task }, { data: categories }, { data: ranks }, { count: claims }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase.from("task_categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("ranks").select("id, name").order("id"),
    supabase.from("task_claims").select("id", { count: "exact", head: true }).eq("task_id", id),
  ]);
  if (!task) notFound();
  return (
    <>
      <PageTitle title="Edit task" lead="Update the brief, payout, eligibility or schedule. Lifecycle controls stay on the catalogue so publishing is deliberate.">
        <Link href="/admin/tasks" className="inline-flex h-10 items-center rounded-sm border border-line px-4 text-small">Back to tasks</Link>
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8"><Card><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-micro uppercase tracking-widest text-muted">Task editor</p><h2 className="mt-2 text-h3">{task.title}</h2></div><Status status={task.status} /></div><TaskForm categories={categories ?? []} ranks={ranks ?? []} task={task} /></Card></div>
        <aside className="space-y-4 xl:col-span-4"><Card><p className="text-micro uppercase tracking-widest text-muted">Operations snapshot</p><dl className="mt-4 divide-y divide-line border-y border-line"><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Claims</dt><dd className="tabular">{claims ?? 0} / {task.max_claims}</dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Payout</dt><dd className="tabular">{task.currency} {task.payout_minor / 100}</dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Deliverable</dt><dd>{task.deliverable_type}</dd></div><div className="flex justify-between gap-4 py-3 text-small"><dt className="text-muted">Minimum rank</dt><dd>Level {task.min_rank_id}</dd></div></dl></Card><Card><h2 className="text-h4">Publishing rule</h2><p className="mt-2 text-small text-muted">Restricted tasks remain internal. For published tasks, changes apply to new claims while existing member claims retain their own deadline.</p></Card></aside>
      </div>
    </>
  );
}
