"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createTask, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function TaskForm({
  categories,
  ranks,
}: {
  categories: { id: number; name: string }[];
  ranks: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createTask, {});
  const [title, setTitle] = useState("");
  const [flag, setFlag] = useState("standard");

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return (
    <form action={action} className="mt-5 space-y-4">
      <Text label="Title" name="title" value={title} onChange={setTitle} />
      <Text label="Slug" name="slug" value={slug} readOnly />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Category" name="category_id">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Minimum rank" name="min_rank_id">
          {ranks.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}. {r.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Number label="Pays (PKR)" name="payout_rupees" defaultValue={2000} />
        <Number label="Hours" name="due_hours" defaultValue={72} />
        <Number label="Spaces" name="max_claims" defaultValue={1} />
      </div>

      <Area label="Summary, shown before claiming" name="summary" rows={2} />
      <Area label="Full brief, shown after claiming" name="brief" rows={6} />

      <Select
        label="Compliance"
        name="compliance_flag"
        onChange={setFlag}
      >
        <option value="standard">Standard commercial work</option>
        <option value="tutoring">Tutoring, produces guidance only</option>
        <option value="restricted">Restricted, cannot be published</option>
      </Select>

      {flag === "restricted" ? (
        <p className="rounded-sm border border-line border-s-2 border-s-critical bg-surface p-3 text-micro text-muted">
          A restricted task can be saved as a draft but never opened to members.
          The database refuses it with a check constraint, so this cannot be
          bypassed by any role, including an owner.
        </p>
      ) : null}

      <label className="flex items-start gap-3 rounded-sm border border-line bg-bg p-4">
        <input
          name="publish"
          type="checkbox"
          defaultChecked
          disabled={flag === "restricted"}
          className="mt-0.5 size-4 accent-violet"
        />
        <span className="text-small">
          Publish straight away
          <span className="mt-1 block text-micro text-muted">
            Otherwise it saves as a draft.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} arrow={!pending}>
          {pending ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
              Saving
            </>
          ) : (
            "Create task"
          )}
        </Button>
        {state.error ? (
          <p role="alert" className="text-small text-critical">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p role="status" className="text-small text-positive">
            {state.ok}
          </p>
        ) : null}
      </div>
    </form>
  );
}

const labelClass =
  "block text-micro font-medium uppercase tracking-[0.08em] text-muted";
const inputClass =
  "mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small";

function Text({
  label,
  name,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={readOnly ? `${inputClass} text-muted` : inputClass}
      />
    </div>
  );
}

function Number({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue}
        className={`${inputClass} tabular`}
      />
    </div>
  );
}

function Select({
  label,
  name,
  children,
  onChange,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={inputClass}
      >
        {children}
      </select>
    </div>
  );
}

function Area({
  label,
  name,
  rows,
}: {
  label: string;
  name: string;
  rows: number;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
      />
    </div>
  );
}
