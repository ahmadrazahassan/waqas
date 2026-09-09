import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { requirePaidAccess } from "@/lib/payment-access";
import { parseTaskBrief } from "@/lib/task-brief";
import { TaskInstructions } from "@/components/app/task-instructions";
import { ClaimButton, SubmitWorkForm } from "@/components/app/task-forms";
import { TimeLeft } from "@/components/app/time-left";
import { Status } from "@/components/app/ui";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Task workspace" };
export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await requirePaidAccess(user);
  const supabase = await createClient();
  const [{ data: task }, { data: claim }] = await Promise.all([
    supabase.from("tasks").select("*, task_categories(name)").eq("id",id).maybeSingle(),
    supabase.from("task_claims").select("*").eq("task_id",id).eq("user_id",user.id).maybeSingle(),
  ]);
  if (!task || (task.status === "draft" && !claim)) notFound();
  const guide = parseTaskBrief(task.brief);
  const { data: submissions } = claim ? await supabase.from("submissions").select("id, version, body, created_at, submission_reviews(decision, feedback, created_at)").eq("claim_id",claim.id).eq("user_id",user.id).order("version",{ascending:false}) : { data: null };
  const canSubmit = claim && ["active","revision"].includes(claim.status) && new Date(claim.due_at).getTime() > new Date().getTime();
  const reason = task.currency !== "PKR" ? "Payout conversion must be confirmed before this task opens."
    : task.status !== "open" ? "This task is not open for new claims."
    : task.min_rank_id > user.profile.rank_id ? `Available from rank ${task.min_rank_id}.`
    : task.claims_used >= task.max_claims ? "All spaces have been claimed." : null;
  return <>
    <Link href="/dashboard/tasks" className="mb-5 inline-block text-small text-muted">← Back to tasks</Link>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><p className="text-micro uppercase tracking-widest text-violet">{task.task_categories?.name ?? "Task workspace"}</p><h1 className="mt-2 text-h2">{task.title}</h1><p className="mt-3 text-small text-muted">{task.summary}</p></div><div className="rounded-panel border border-line bg-surface px-5 py-4"><p className="text-micro text-muted">On approval</p><p className="mt-1 text-h3">{formatMoney(task.payout_minor, task.currency === "USD" ? "USD" : "PKR")}</p></div></div>
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-control border border-line bg-surface px-5 py-3 text-small"><span>{task.due_hours} hours to complete</span>{claim ? <><Status status={claim.status}/><TimeLeft dueAt={claim.due_at}/></> : <span className="text-muted">Deadline starts when you claim</span>}</div>
    <TaskInstructions brief={task.brief}/>
    <section id="submission" className="mt-6 scroll-mt-8 rounded-panel border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-h3">{claim?.status === "revision" ? "Update your submission" : "Submit your work"}</h2>
      {!claim ? <div className="mt-4 max-w-md"><p className="mb-5 text-small text-muted">Read the steps above, then claim your place to start the deadline and unlock this form.</p><ClaimButton taskId={task.id} disabledReason={reason}/></div>
        : canSubmit ? <div className="mt-5"><SubmitWorkForm claimId={claim.id} guide={guide}/></div>
        : <p className="mt-4 text-small text-muted">{["submitted","in_review"].includes(claim.status) ? "Your work is with the reviewer. Your submission and feedback appear below." : claim.status === "approved" ? "Your work has been approved. Check your earnings for the payment record." : "This submission is closed or its deadline has passed."}</p>}
    </section>
    {submissions?.length ? <section className="mt-6 rounded-panel border border-line bg-surface p-6"><h2 className="text-h4">Submission history & feedback</h2>{submissions.map(s=><details key={s.id} className="mt-4 border-t border-line pt-4" open={s.version === submissions[0]?.version}><summary className="cursor-pointer text-small font-medium">Version {s.version} · {formatDate(s.created_at)}</summary><p className="mt-3 whitespace-pre-wrap break-words text-small text-muted">{s.body}</p>{s.submission_reviews?.map((r,i)=><div key={i} className="mt-4 rounded-control bg-violet-soft p-4"><p className="text-small font-semibold">Reviewer: {r.decision}</p><p className="mt-2 whitespace-pre-wrap text-small">{r.feedback}</p></div>)}</details>)}</section> : null}
  </>;
}
