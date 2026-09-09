"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { plans, type Plan } from "@/lib/site";
import { convertAndFormat, currencies, type CurrencyCode } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Plan cards.
 *
 * These state the price and what it includes. Deliberately no earnings
 * projections, no "you are up X a month", no referral calculator. A price
 * list that argues its own return reads like a pitch rather than a price
 * list, and the honest version of that number lives on the referrals page
 * next to the income disclosure where it belongs.
 */
export function PricingTable() {
  const [currency, setCurrency] = useState<CurrencyCode>("PKR");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-micro uppercase tracking-[0.08em] text-muted">
            One payment
          </p>
          <p className="mt-2 max-w-[52ch] text-small text-muted">
            There is no monthly fee, no renewal and nothing to cancel. You pay
            once and the account stays open.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="currency"
            className="text-micro uppercase tracking-[0.08em] text-muted"
          >
            Show in
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="h-11 rounded-sm border border-line bg-surface px-3 text-small"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currency !== "PKR" ? (
        <p className="mt-4 text-small text-muted">
          Indicative conversion only. Every plan is priced and charged in PKR,
          so your bank decides the final amount.
        </p>
      ) : null}

      <div className="mt-10 grid gap-px lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.code} plan={plan} currency={currency} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, currency }: { plan: Plan; currency: CurrencyCode }) {
  const dark = Boolean(plan.featured);

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border p-8",
        dark ? "border-ink bg-ink text-white" : "border-line bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn("text-h4", dark && "text-white")}>{plan.name}</h3>
        {dark ? <Badge tone="lime">Most chosen</Badge> : null}
      </div>

      <p
        className={cn(
          "mt-3 min-h-12 max-w-[32ch] text-small",
          dark ? "text-white/60" : "text-muted",
        )}
      >
        {plan.summary}
      </p>

      <div className="mt-8">
        <p className={cn("text-h1 leading-none tabular", dark && "text-white")}>
          {convertAndFormat(plan.priceMinor, currency)}
        </p>
        <p
          className={cn(
            "mt-3 text-small",
            dark ? "text-white/60" : "text-muted",
          )}
        >
          One time. 24 hour refund window.
        </p>
      </div>

      <div className="mt-8">
        <ButtonLink
          href={`/dashboard/billing?plan=${plan.code}`}
          variant={dark ? "primary" : "tertiary"}
          size="lg"
          className="w-full"
          arrow
        >
          Choose {plan.name}
        </ButtonLink>
      </div>

      <ul
        className={cn(
          "mt-8 space-y-3.5 border-t pt-8",
          dark ? "border-line-dark" : "border-line",
        )}
      >
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-small">
            <Check
              size={16}
              strokeWidth={1.25}
              className={cn("mt-0.5 shrink-0", dark ? "text-lime" : "text-ink")}
              aria-hidden="true"
            />
            <span className={cn(dark && "text-white/90")}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
