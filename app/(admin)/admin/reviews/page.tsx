import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Empty } from "@/components/app/ui";
import { ReviewForm } from "@/components/admin/review-form";
import { formatMoney, formatDate } from "@/lib/utils";
import { TaskInstructions } from "@/components/app/task-instructions";

export const metadata: Metadata = { title: "Review queue" };

export default async function ReviewsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("task_claims")
    .select(
      "id, status, due_at, claimed_at, profiles(full_name, username), tasks(title, payout_minor, brief), submissions(id, version, body, notes, created_at, file_paths)",
    )
    .in("status", ["submitted", "in_review"])
    .order("claimed_at", { ascending: true })
    .limit(50);

  return (
    <>
      <PageTitle
        title="Review queue"
        lead="Score against the rubric the member could read before they started. Approving pays them immediately."
      />

      {(pending ?? []).length === 0 ? (
        <Empty
          title="Nothing waiting"
          body="Submitted work lands here. The queue is genuinely empty rather than filtered."
        />
      ) : (
        <div className="space-y-6">
          {(pending ?? []).map((claim) => {
            const member = claim.profiles as unknown as {
              full_name: string;
              username: string;
            } | null;
            const task = claim.tasks as unknown as {
              title: string;
              payout_minor: number;
              brief: string;
            } | null;
            const submissions = (claim.submissions ?? []) as unknown as {
              id: string;
              version: number;
              body: string | null;
              notes: string | null;
              created_at: string;
              file_paths: string[];
            }[];
            const latest = submissions.sort((a, b) => b.version - a.version)[0];

            if (!latest) return null;

            return (
              <Card key={claim.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-h4">{task?.title}</h2>
                    <p className="mt-1 text-small text-muted">
                      {member?.full_name} (@{member?.username}) · version{" "}
                      {latest.version} · submitted {formatDate(latest.created_at)}
                    </p>
                  </div>
                  <span className="text-h4 tabular">
                    {formatMoney(task?.payout_minor ?? 0)}
                  </span>
                </div>

                <details className="mt-5 border-t border-line pt-4">
                  <summary className="cursor-pointer text-small font-medium">
                    The brief
                  </summary>
                  <div className="mt-3"><TaskInstructions brief={task?.brief ?? ""}/></div>
                </details>

                <div className="mt-5 rounded-sm border border-line bg-bg p-4">
                  <p className="text-micro uppercase tracking-[0.08em] text-muted">
                    Submitted work
                  </p>
                  <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-line text-small">
                    {latest.body}
                  </p>
                  {latest.notes ? (
                    <p className="mt-4 border-t border-line pt-3 text-small text-muted">
                      <span className="font-medium text-ink">Their note: </span>
                      {latest.notes}
                    </p>
                  ) : null}
                  {latest.file_paths.length ? <ul className="mt-4 flex flex-wrap gap-3">{latest.file_paths.map((path,index)=><li key={path}><a href={`/api/submissions/${latest.id}/files/${index}`} className="inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-4 text-small text-violet">Download proof {index+1}</a></li>)}</ul> : null}
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  <ReviewForm submissionId={latest.id} claimId={claim.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
