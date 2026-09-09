"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createTask, updateTask, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

type TaskDraft = {
  id: string;
  title: string;
  slug: string;
  category_id: number;
  min_rank_id: number;
  payout_minor: number;
  currency: string;
  due_hours: number;
  max_claims: number;
  summary: string;
  brief: string;
  compliance_flag: string;
  deliverable_type: string;
  word_count_target: number | null;
  opens_at: string;
  early_access_opens_at: string | null;
  status: string;
};

export function TaskForm({
  categories,
  ranks,
  task,
}: {
  categories: { id: number; name: string }[];
  ranks: { id: number; name: string }[];
  task?: TaskDraft;
}) {
  const editing = Boolean(task);
  const [state, action, pending] = useActionState<AdminState, FormData>(editing ? updateTask : createTask, {});
  const [title, setTitle] = useState(task?.title ?? "");
  const [flag, setFlag] = useState(task?.compliance_flag ?? "standard");
  const [currency, setCurrency] = useState(task?.currency ?? "PKR");
  const slug = editing ? task?.slug ?? "" : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

  return (
    <form action={action} className="mt-5 space-y-5">
      {task ? <input type="hidden" name="task_id" value={task.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" name="title" value={title} onChange={setTitle} />
        <Text label="Slug" name="slug" value={slug} readOnly />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Category" name="category_id" defaultValue={task?.category_id}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select label="Minimum rank" name="min_rank_id" defaultValue={task?.min_rank_id}>{ranks.map((r) => <option key={r.id} value={r.id}>{r.id}. {r.name}</option>)}</Select>
        <Select label="Deliverable" name="deliverable_type" defaultValue={task?.deliverable_type ?? "text"}>
          <option value="text">Written response</option><option value="proof">Proof and screenshot</option><option value="link">Link and explanation</option><option value="file">File upload</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div><label htmlFor="currency" className={labelClass}>Currency</label><select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}><option value="PKR">PKR</option><option value="USD">USD draft only</option></select></div>
        <Number label={`Payout (${currency})`} name="payout_amount" defaultValue={(task?.payout_minor ?? (currency === "PKR" ? 200000 : 200)) / 100} step={currency === "PKR" ? 1 : 0.01} />
        <Number label="Due hours" name="due_hours" defaultValue={task?.due_hours ?? 72} />
        <Number label="Claim spaces" name="max_claims" defaultValue={task?.max_claims ?? 1} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DateTime label="Opens at" name="opens_at" defaultValue={dateInput(task?.opens_at)} />
        <DateTime label="Early access at" name="early_access_opens_at" defaultValue={dateInput(task?.early_access_opens_at)} />
        <Number label="Word target (optional)" name="word_count_target" defaultValue={task?.word_count_target ?? undefined} />
      </div>
      <TextArea label="Summary shown before claiming" name="summary" defaultValue={task?.summary} rows={3} />
      <TextArea label="Full brief and step-by-step instructions" name="brief" defaultValue={task?.brief} rows={9} />
      <Select label="Compliance" name="compliance_flag" defaultValue={task?.compliance_flag ?? "standard"} onChange={setFlag}><option value="standard">Standard commercial work</option><option value="tutoring">Tutoring, guidance only</option><option value="restricted">Restricted, draft only</option></Select>
      {flag === "restricted" ? <p className="rounded-control border border-line border-s-critical bg-bg p-3 text-micro text-muted">Restricted tasks can be saved for internal review but cannot be opened to members.</p> : null}
      {!editing ? <label className="flex items-start gap-3 rounded-control border border-line bg-bg p-4"><input name="publish" type="checkbox" defaultChecked={flag !== "restricted"} disabled={flag === "restricted"} className="mt-0.5 size-4 accent-violet" /><span className="text-small">Publish immediately<span className="mt-1 block text-micro text-muted">Leave unchecked to create a draft and review it later.</span></span></label> : <p className="rounded-control border border-line bg-bg p-4 text-small text-muted">This task is currently <strong className="text-ink">{task?.status}</strong>. Save content here, then use lifecycle controls on the task list to publish, pause or close it.</p>}
      <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={pending} arrow={!pending}>{pending ? <><LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" /> Saving</> : editing ? "Save task changes" : "Create task"}</Button>{state.error ? <p role="alert" className="text-small text-critical">{state.error}</p> : null}{state.ok ? <p role="status" className="text-small text-positive">{state.ok}</p> : null}</div>
    </form>
  );
}

const labelClass = "block text-micro font-medium uppercase tracking-[0.08em] text-muted";
const inputClass = "mt-2 h-11 w-full rounded-control border border-line bg-surface px-3 text-small";

function Text({ label, name, value, onChange, readOnly }: { label: string; name: string; value: string; onChange?: (v: string) => void; readOnly?: boolean }) { return <div><label htmlFor={name} className={labelClass}>{label}</label><input id={name} name={name} value={value} readOnly={readOnly} onChange={onChange ? (e) => onChange(e.target.value) : undefined} className={readOnly ? `${inputClass} text-muted` : inputClass} /></div>; }
function Number({ label, name, defaultValue, step = 1 }: { label: string; name: string; defaultValue?: number; step?: number }) { return <div><label htmlFor={name} className={labelClass}>{label}</label><input id={name} name={name} type="number" min={0} step={step} defaultValue={defaultValue} className={`${inputClass} tabular`} /></div>; }
function DateTime({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) { return <div><label htmlFor={name} className={labelClass}>{label}</label><input id={name} name={name} type="datetime-local" defaultValue={defaultValue} className={`${inputClass} tabular`} /></div>; }
function Select({ label, name, children, defaultValue, onChange }: { label: string; name: string; children: React.ReactNode; defaultValue?: string | number; onChange?: (v: string) => void }) { return <div><label htmlFor={name} className={labelClass}>{label}</label><select id={name} name={name} defaultValue={defaultValue} onChange={onChange ? (e) => onChange(e.target.value) : undefined} className={inputClass}>{children}</select></div>; }
function TextArea({ label, name, defaultValue, rows }: { label: string; name: string; defaultValue?: string; rows: number }) { return <div><label htmlFor={name} className={labelClass}>{label}</label><textarea id={name} name={name} defaultValue={defaultValue} rows={rows} className="mt-2 w-full rounded-control border border-line bg-surface p-3 text-small" /></div>; }
function dateInput(value?: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : undefined; }
