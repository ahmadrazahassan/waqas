"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { claimTask, submitWork, type ActionState } from "@/app/(app)/dashboard/actions";
import { FileUpload } from "@/components/app/file-upload";
import { Button } from "@/components/ui/button";

/**
 * A disabled control always says why it is disabled. Greying something out
 * and leaving the member to guess is the thing this product does not do.
 */
export function ClaimButton({
  taskId,
  disabledReason,
}: {
  taskId: string;
  disabledReason: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(claimTask, {});

  if (disabledReason) {
    return (
      <div>
        <Button size="lg" className="w-full" disabled>
          Claim this task
        </Button>
        <p className="mt-2 text-micro text-muted">{disabledReason}</p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="task_id" value={taskId} />
      <Button size="lg" className="w-full" disabled={pending} arrow={!pending}>
        {pending ? (
          <>
            <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
            Claiming
          </>
        ) : (
          "Claim this task"
        )}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-2 text-micro text-critical">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-2 text-micro text-positive">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}

export function SubmitWorkForm({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitWork, {});
  const [paths, setPaths] = useState<string[]>([]);

  return (
    <form action={action}>
      <input type="hidden" name="claim_id" value={claimId} />
      {paths.map((p) => (
        <input key={p} type="hidden" name="file_paths" value={p} />
      ))}

      <label
        htmlFor={`body-${claimId}`}
        className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
      >
        Your work
      </label>
      <textarea
        id={`body-${claimId}`}
        name="body"
        rows={8}
        required
        className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
        placeholder="Paste your work here."
      />

      <label
        htmlFor={`notes-${claimId}`}
        className="mt-4 block text-micro font-medium uppercase tracking-[0.08em] text-muted"
      >
        Notes for the reviewer (optional)
      </label>
      <textarea
        id={`notes-${claimId}`}
        name="notes"
        rows={2}
        className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
        placeholder="Anything they should know, such as a judgement call you made."
      />

      <div className="mt-4">
        <FileUpload
          bucket="submissions"
          label="Attach files (optional)"
          hint="Documents, spreadsheets, audio or images, up to 25MB each. Files go straight to private storage that only you and a reviewer can open."
          multiple
          onUploaded={(path) =>
            setPaths((prev) => (path ? [...prev, path] : []))
          }
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button type="submit" disabled={pending} arrow={!pending}>
          {pending ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
              Submitting
            </>
          ) : (
            "Submit for review"
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

      <p className="mt-3 text-micro text-muted">
        A reviewer scores this against the rubric published with the task, and
        you see every line of that score plus their written feedback.
      </p>
    </form>
  );
}
