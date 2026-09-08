"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { requestPayout, type ActionState } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export function PayoutForm({
  balance,
  threshold,
  inFlight,
  kycStatus,
}: {
  balance: number;
  threshold: number;
  inFlight: number;
  kycStatus: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestPayout, {});
  const [amount, setAmount] = useState(Math.max(balance, 0));

  const belowThreshold = balance < threshold;
  const kycBlocked = kycStatus === "pending" || kycStatus === "rejected";

  if (inFlight > 0) {
    return (
      <div className="mt-4">
        <p className="text-body">
          You have {formatMoney(inFlight)} already in the payout queue. We
          process one request at a time so the ledger cannot disagree with the
          bank.
        </p>
      </div>
    );
  }

  if (belowThreshold) {
    return (
      <div className="mt-4">
        <p className="text-body text-muted">
          Your balance is {formatMoney(balance)} and your plan&apos;s threshold
          is {formatMoney(threshold)}. You need{" "}
          <strong className="text-ink">{formatMoney(threshold - balance)}</strong>{" "}
          more before you can withdraw.
        </p>
        <p className="mt-3 text-micro text-muted">
          Thresholds exist because a bank transfer costs us more than a very
          small payout is worth. Higher plans have lower thresholds.
        </p>
      </div>
    );
  }

  if (kycBlocked) {
    return (
      <div className="mt-4">
        <p className="text-body">
          {kycStatus === "pending"
            ? "Your identity check is in progress. Payouts resume as soon as it clears, usually within two working days."
            : "Your identity check did not pass. Contact support and we will tell you exactly what was wrong with it."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="amount"
          className="flex items-baseline justify-between gap-3"
        >
          <span className="text-micro font-medium uppercase tracking-[0.08em] text-muted">
            Amount
          </span>
          <span className="text-micro text-muted tabular">
            {formatMoney(balance)} available
          </span>
        </label>
        <div className="mt-2 flex">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-s-sm border border-e-0 border-line bg-bg text-small text-muted">
            Rs
          </span>
          <input
            id="amount"
            type="number"
            min={Math.round(threshold / 100)}
            max={Math.round(balance / 100)}
            step={1}
            value={Math.round(amount / 100)}
            onChange={(e) => setAmount(Number(e.target.value) * 100)}
            className="h-12 w-full rounded-e-sm border border-line bg-surface px-3 text-small tabular"
          />
        </div>
        <input type="hidden" name="amount_minor" value={amount} />
      </div>

      <div>
        <label
          htmlFor="method"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Method
        </label>
        <select
          id="method"
          name="method"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3 text-small"
        >
          <option value="bank_pkr">Bank transfer, PKR</option>
          <option value="wise">Wise</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="destination_label"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Where to send it
        </label>
        <input
          id="destination_label"
          name="destination_label"
          placeholder="Bank name and the last four digits"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3 text-small"
        />
        <p className="mt-2 text-micro text-muted">
          Full account details are collected by the payment provider, not by us.
          We never store a raw account number.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending} arrow={!pending}>
        {pending ? (
          <>
            <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
            Requesting
          </>
        ) : (
          `Request ${formatMoney(amount)}`
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
    </form>
  );
}
