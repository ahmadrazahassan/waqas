import { parseTaskBrief } from "@/lib/task-brief";

export function TaskInstructions({ brief }: { brief: string }) {
  const guide = parseTaskBrief(brief);
  if (!guide) return <section className="rounded-panel border border-line bg-surface p-6"><h2 className="text-h4">Task brief</h2><p className="mt-4 whitespace-pre-line text-small text-muted">{brief}</p><p className="mt-5 text-small">Read the brief, prepare the requested deliverable, then use the submission form below. Ask support if source material is missing.</p></section>;
  return <div className="space-y-6">
    <section className="rounded-panel border border-line bg-surface p-6 sm:p-8">
      <p className="text-micro uppercase tracking-widest text-violet">Your brief</p>
      <h2 className="mt-2 text-h3">Everything you need to start</h2>
      <p className="mt-4 whitespace-pre-line text-small leading-relaxed">{guide.sourceMaterial}</p>
      {guide.videoUrl ? <a href={guide.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-violet-soft px-4 text-small text-violet">Open approved video</a> : null}
    </section>
    <section className="rounded-panel border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-h3">How to complete this task</h2>
      <ol className="mt-6 space-y-6">{guide.steps.map((step,i)=><li key={step.title} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-violet-soft text-small font-semibold text-violet">{String(i+1).padStart(2,"0")}</span><div><h3 className="text-small font-semibold">{step.title}</h3><p className="mt-1 text-small text-muted">{step.body}</p></div></li>)}</ol>
    </section>
    <section className="rounded-panel border border-violet/15 bg-violet-soft p-6 sm:p-8">
      <h2 className="text-h4">Before you submit</h2>
      <ul className="mt-4 list-disc space-y-2 ps-5 text-small">{guide.requirements.map(item=><li key={item}>{item}</li>)}</ul>
      <p className="mt-4 text-small text-muted">{guide.aiPolicy}</p>
      <p className="mt-3 text-micro text-muted">Reviewed for completeness, accuracy, originality and the evidence requested above. Payment follows approval, not submission alone.</p>
    </section>
  </div>;
}
