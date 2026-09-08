"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { reviewSubmission, type AdminState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

const RUBRIC = [
  "Follows the brief",
  "Accuracy, nothing invented",
  "Structure and clarity",
  "Language and mechanics",
];

export function ReviewForm({
  submissionId,
  claimId,
}: {
  submissionId: string;
  claimId: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    reviewSubmission,
    {},
  );
  const [decision, setDecision] = useState<"approve" | "revise" | "reject">(
    "approve",
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="claim_id" value={claimId} />
      <input type="hidden" name="decision" value={decision} />

      <div className="flex flex-wrap gap-2">
        {(["approve", "revise", "reject"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecision(d)}
            aria-pressed={decision === d}
            className={
              decision === d
                ? "rounded-sm border border-ink bg-ink px-4 py-2 text-small font-medium text-white"
                : "rounded-sm border border-line px-4 py-2 text-small text-muted hover:border-ink hover:text-ink"
            }
          >
            {d === "approve" ? "Approve and pay" : d === "revise" ? "Ask for changes" : "Reject"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`score-${claimId}`}
            className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
          >
            Score out of 5
          </label>
          <input
            id={`score-${claimId}`}
            name="score"
            type="number"
            min={0}
            max={5}
            step={0.5}
            defaultValue={4}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small tabular"
          />
          <p className="mt-2 text-micro text-muted">
            Judged on: {RUBRIC.join(", ").toLowerCase()}.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor={`feedback-${claimId}`}
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Written feedback
        </label>
        <textarea
          id={`feedback-${claimId}`}
          name="feedback"
          rows={3}
          required
          placeholder="What was good, and what specifically to change. The member sees this word for word."
          className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} arrow={!pending}>
          {pending ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
              Saving
            </>
          ) : decision === "approve" ? (
            "Approve and pay"
          ) : (
            "Record decision"
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
