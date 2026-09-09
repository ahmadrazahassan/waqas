"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { declarePayment, type BillingState } from "@/app/(app)/dashboard/billing/actions";
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

export function DeclareForm({ plans, selectedPlan }: { plans: Plan[]; selectedPlan?: string }) {
  const [state, action, pending] = useActionState<BillingState, FormData>(
    declarePayment,
    {},
  );
  const [planId, setPlanId] = useState<number>(plans.find(p => p.code === selectedPlan)?.id ?? plans[0]?.id ?? 0);

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
            Pay exactly in PKR
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
          JazzCash transaction ID
        </label>
        <input
          id="reference"
          name="reference"
          required
          minLength={4}
          maxLength={80}
          placeholder="Transaction ID from your JazzCash receipt"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3.5 text-small"
        />
      </div>

      <div className="rounded-sm border border-dashed border-line bg-bg p-5">
        <label htmlFor="payment-proof" className="block text-small font-medium">Payment screenshot <span className="text-muted">(required)</span></label>
        <p id="proof-hint" className="mt-2 text-micro text-muted">Show the transaction ID, amount, recipient and successful payment status. PNG, JPG or WebP, up to 5 MB. Only you and authorised finance staff can view it.</p>
        <input id="payment-proof" name="proof" type="file" required accept="image/png,image/jpeg,image/webp" aria-describedby="proof-hint" className="mt-4 block w-full min-w-0 text-small file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-surface file:px-4 file:py-3 file:text-small" />
      </div>

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
          maxLength={500}
          className="mt-2 w-full rounded-sm border border-line bg-surface p-3 text-small"
        />
      </div>

      <label className="flex items-start gap-3 text-small text-muted">
        <input type="checkbox" name="acknowledged" required className="mt-1 size-4 shrink-0 accent-ink" />
        <span>I have paid the selected amount to Muhammad Waqas using the JazzCash QR above. This receipt belongs to my payment. I understand activation requires admin verification.</span>
      </label>
      <Button type="submit" size="lg" disabled={pending || !plan} arrow={!pending}>
        {pending ? (
          <>
            <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
            Submitting screenshot
          </>
        ) : (
          "Submit payment for review"
        )}
      </Button>

      {state.error ? (
        <p role="alert" className="text-small text-critical">
          {state.error}
        </p>
      ) : null}

      <p className="text-micro text-muted">
        The six hour review countdown starts after your screenshot is successfully submitted.
        Your account activates only after payment is verified. Please submit once and keep your original receipt.
      </p>
    </form>
  );
}
