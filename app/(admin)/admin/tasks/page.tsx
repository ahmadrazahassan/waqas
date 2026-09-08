import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { TaskForm } from "@/components/admin/task-form";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: categories }, { data: ranks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, task_categories(name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("task_categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("ranks").select("id, name").order("id"),
  ]);

  return (
    <>
      <PageTitle
        title="Tasks"
        lead="Assignwork posts every task. A task flagged restricted cannot be published, and that is a database constraint rather than a UI rule."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card>
            <h2 className="text-h4">Post a task</h2>
            <TaskForm
              categories={categories ?? []}
              ranks={ranks ?? []}
            />
          </Card>
        </div>

        <div className="xl:col-span-7">
          <h2 className="text-h4">All tasks</h2>
          <div className="mt-4">
            <DataTable
              rows={tasks ?? []}
              keyOf={(t) => t.id}
              empty={<Empty title="No tasks yet" body="Post one with the form." />}
              columns={[
                {
                  key: "title",
                  header: "Task",
                  render: (t) => {
                    const c = t.task_categories as unknown as { name: string } | null;
                    return (
                      <span>
                        <span className="block font-medium">{t.title}</span>
                        <span className="block text-micro text-muted">
                          {c?.name} · rank {t.min_rank_id}+ ·{" "}
                          {t.claims_used}/{t.max_claims} claimed
                        </span>
                      </span>
                    );
                  },
                },
                {
                  key: "flag",
                  header: "Compliance",
                  render: (t) =>
                    t.compliance_flag === "restricted" ? (
                      <span className="text-critical">Restricted</span>
                    ) : (
                      <span className="text-muted">{t.compliance_flag}</span>
                    ),
                },
                { key: "created", header: "Created", render: (t) => formatDate(t.created_at) },
                { key: "status", header: "Status", render: (t) => <Status status={t.status} /> },
                {
                  key: "payout",
                  header: "Pays",
                  align: "end",
                  render: (t) => formatMoney(t.payout_minor),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
