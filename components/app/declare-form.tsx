"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { declarePayment, type BillingState } from "@/app/(app)/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { paymentQr } from "@/lib/billing";

type Plan = {
  id: number;
  code: string;
  name: string;
  price_minor: number;
  currency: string;
  summary: string;
};

export function DeclareForm({ plans, selectedPlan }: { plans: Plan[]; selectedPlan?: string }) {
  const [state, action, pending] = useActionState<BillingState, FormData>(
    declarePayment,
    {},
  );
  const [planId, setPlanId] = useState<number>(plans.find(p => p.code === selectedPlan && paymentQr(p.price_minor, p.currency))?.id ?? plans.find(p => paymentQr(p.price_minor, p.currency))?.id ?? 0);

  const plan = plans.find((p) => p.id === planId);
  const amount = plan?.price_minor;
  const qr = plan ? paymentQr(plan.price_minor, plan.currency) : null;

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
              disabled={pending || !paymentQr(p.price_minor, p.currency)}
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

      {amount && qr ? (
        <div className="rounded-sm border border-line bg-bg p-4">
          <p className="text-micro uppercase tracking-[0.08em] text-muted">
            Pay exactly in PKR
          </p>
          <p className="mt-1 text-h2 tabular">{formatMoney(amount)}</p>
          <div key={qr} className="mt-4 grid items-center gap-5 sm:grid-cols-2">
            <a href={qr} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line bg-white p-3" aria-label={`Open Easypaisa QR for ${formatMoney(amount)}`}>
              <Image src={qr} alt={`Easypaisa Bank QR for ${plan?.name}, ${formatMoney(amount)}`} width={650} height={550} unoptimized className="h-auto w-full object-contain" />
            </a>
            <div className="space-y-3 text-small">
              <p className="font-medium">Pay with Easypaisa Bank</p>
              <ol className="list-inside list-decimal space-y-2 text-muted">
                <li>Scan this plan’s QR in your payment app.</li>
                <li>Check the recipient and pay exactly {formatMoney(amount)}.</li>
                <li>Save your receipt and submit it below.</li>
              </ol>
              <a href={qr} download={`Assignwork-Easypaisa-${amount / 100}.png`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium">Save QR</a>
              <p className="text-micro text-muted">Using one phone? Save the QR and select it from your payment app’s image scanner.</p>
            </div>
          </div>
          <p className="mt-1 text-micro text-muted">
            A different amount slows confirmation down, because we match on the
            amount as well as the reference.
          </p>
        </div>
      ) : <p role="alert" className="text-small text-critical">No payment QR is configured for this plan. Please contact support before paying.</p>}

      <div>
        <label
          htmlFor="reference"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Easypaisa transaction ID
        </label>
        <input
          id="reference"
          name="reference"
          required
          minLength={4}
          maxLength={80}
          placeholder="Transaction ID from your successful payment receipt"
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
        <span>I have checked the recipient and paid the selected amount using this plan’s Easypaisa Bank QR. This is my payment receipt. I understand activation requires admin verification.</span>
      </label>
      <Button type="submit" size="lg" disabled={pending || !plan || !qr} arrow={!pending}>
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
