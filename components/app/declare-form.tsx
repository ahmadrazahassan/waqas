"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { declarePayment, type BillingState } from "@/app/(app)/dashboard/billing/actions";
import { FileUpload } from "@/components/app/file-upload";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Plan = {
  id: number;
  code: string;
  name: string;
  price_minor: number;
  summary: string;
};

export function DeclareForm({ plans }: { plans: Plan[] }) {
  const [state, action, pending] = useActionState<BillingState, FormData>(
    declarePayment,
    {},
  );
  const [planId, setPlanId] = useState<number>(plans[1]?.id ?? plans[0]?.id ?? 0);
  const [proofPath, setProofPath] = useState<string>("");

  const plan = plans.find((p) => p.id === planId);
  const amount = plan?.price_minor;

  if (state.ok) {
    return (
      <div role="status" className="mt-5">
        <p className="text-body">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="proof_path" value={proofPath} />

      <div>
        <p className="text-micro font-medium uppercase tracking-[0.08em] text-muted">
          Plan
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanId(p.id)}
              aria-pressed={planId === p.id}
              className={cn(
                "rounded-sm border p-3 text-start transition-colors duration-200",
                planId === p.id
                  ? "border-ink bg-ink text-white"
                  : "border-line hover:border-ink",
              )}
            >
              <span className="block text-small font-medium">{p.name}</span>
              <span
                className={cn(
                  "mt-1 block text-micro tabular",
                  planId === p.id ? "text-lime" : "text-muted",
                )}
              >
                {formatMoney(p.price_minor)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {amount ? (
        <div className="rounded-sm border border-line bg-bg p-4">
          <p className="text-micro uppercase tracking-[0.08em] text-muted">
            Transfer exactly
          </p>
          <p className="mt-1 text-h2 tabular">{formatMoney(amount)}</p>
          <p className="mt-1 text-micro text-muted">
            A different amount slows confirmation down, because we match on the
            amount as well as the reference.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="reference"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Transaction reference
        </label>
        <input
          id="reference"
          name="reference"
          required
          placeholder="The reference your bank or wallet app gave you"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3.5 text-small"
        />
      </div>

      <FileUpload
        bucket="submissions"
        label="Screenshot of the transfer (optional)"
        hint="A screenshot speeds confirmation up a lot. PDF or image, up to 25MB."
        onUploaded={setProofPath}
      />

      <div>
        <label
          htmlFor="note"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Anything we should know (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} arrow={!pending}>
        {pending ? (
          <>
            <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
            Recording
          </>
        ) : (
          "I have sent the transfer"
        )}
      </Button>

      {state.error ? (
        <p role="alert" className="text-small text-critical">
          {state.error}
        </p>
      ) : null}

      <p className="text-micro text-muted">
        Declaring a transfer does not switch your plan on by itself. We match it
        against the bank first. That is deliberate: a self declaration that
        activated an account would let anyone open one for free and pay their
        own upline commission on it.
      </p>
    </form>
  );
}
