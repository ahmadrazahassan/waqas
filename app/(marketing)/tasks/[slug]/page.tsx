import Link from "next/link";
import { notFound } from "next/navigation";
import { taskCatalogue } from "@/lib/task-catalogue";
import { TaskInstructions } from "@/components/app/task-instructions";
import { Section } from "@/components/ui/primitives";

export function generateStaticParams() { return taskCatalogue.map(t=>({slug:t.slug})); }
export default async function TaskPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = taskCatalogue.find(t=>t.slug===slug);
  if (!task) notFound();
  return <Section><div className="mx-auto max-w-4xl"><Link href="/tasks" className="text-small text-muted">← All task briefs</Link><p className="mt-6 text-micro uppercase tracking-widest text-violet">{task.category} · Task preview</p><h1 className="mt-3 text-h2">{task.title}</h1><p className="mt-4 text-small text-muted">{task.summary}</p><div className="my-6 rounded-panel border border-violet/15 bg-violet-soft p-5"><p className="text-small font-medium">{task.brief.rewardUsdCents ? `Proposed reward: $${(task.brief.rewardUsdCents/100).toFixed(2)} per approved task.` : "Awaiting an approved video and reward."}</p><p className="mt-2 text-small text-muted">This brief is not open for claims yet. Active members can claim published tasks from their dashboard. Final PKR payment and availability will be shown before claiming. This is not a promise of daily income.</p><Link href="/dashboard/tasks" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-lime px-5 text-small font-medium">Go to my tasks</Link></div><TaskInstructions brief={JSON.stringify(task.brief)}/></div></Section>;
}
