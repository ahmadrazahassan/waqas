import Link from "next/link";
import { taskCatalogue } from "@/lib/task-catalogue";

export function TaskLibrary() {
  return <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{taskCatalogue.map(task=><article key={task.slug} className="flex flex-col rounded-panel border border-line bg-surface p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-micro text-violet">{task.category}</span><span className="rounded-control bg-violet-soft px-3 py-1 text-micro text-violet">Preview</span></div>
    <h3 className="mt-4 text-h4">{task.title}</h3><p className="mt-3 flex-1 text-small text-muted">{task.summary}</p>
    <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4"><div><p className="text-h3">{task.brief.rewardUsdCents ? `$${(task.brief.rewardUsdCents/100).toFixed(2)}` : "To be set"}</p><p className="mt-1 text-micro text-muted">{task.brief.rewardUsdCents ? "Proposed reward on approval" : "Reward not published"}</p></div><Link href={`/tasks/${task.slug}`} className="inline-flex min-h-11 items-center rounded-control bg-violet-soft px-4 text-small font-medium text-violet">Read brief →</Link></div>
  </article>)}</div>;
}
