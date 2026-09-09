"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import { setTaskStatus, type AdminState } from "@/app/(admin)/admin/actions";
import { route } from "@/lib/routes";

export function TaskLifecycleControls({ taskId, status }: { taskId: string; status: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(setTaskStatus, {});
  const next = status === "open" ? "draft" : "open";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={route(`/admin/tasks/${taskId}`)} className="inline-flex h-8 items-center gap-2 rounded-sm border border-line px-3 text-micro font-medium hover:border-ink"><Pencil size={13} strokeWidth={1.5} /> Edit</Link>
      {!["completed", "cancelled", "expired"].includes(status) ? (
        <form action={action} className="inline-flex items-center gap-2">
          <input type="hidden" name="task_id" value={taskId} />
          <input type="hidden" name="status" value={next} />
          <button type="submit" disabled={pending} className="inline-flex h-8 items-center rounded-sm border border-line px-3 text-micro font-medium hover:border-ink disabled:opacity-50">{pending ? <LoaderCircle size={13} className="animate-spin" /> : next === "open" ? "Publish" : "Pause"}</button>
        </form>
      ) : null}
      {state.error ? <span role="alert" className="max-w-40 text-end text-[11px] text-critical">{state.error}</span> : null}
      {state.ok ? <span role="status" className="max-w-40 text-end text-[11px] text-positive">{state.ok}</span> : null}
    </div>
  );
}
