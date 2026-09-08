"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { plans, ranks, DIRECT_COMMISSION_RATE } from "@/lib/site";
import {
  MAX_RATE_PER_LEVEL,
  MULTIPLIER_APPLIES_FROM_LEVEL,
  NET_REVENUE_FACTOR,
} from "@/lib/commission";
import { formatMoney } from "@/lib/utils";
import { Segmented } from "@/components/ui/segmented";
import { Callout } from "@/components/ui/states";

const planOptions = plans.map((p) => ({ value: p.code, label: p.name }));

export function ReferralCalculator() {
  const [yourPlan, setYourPlan] = useState<(typeof plans)[number]["code"]>("pro");
  const [theirPlan, setTheirPlan] = useState<(typeof plans)[number]["code"]>("starter");
  const [directs, setDirects] = useState(6);
  const [eachRefers, setEachRefers] = useState(2);
  const [rankId, setRankId] = useState(3);

  const directsId = useId();
  const eachId = useId();
  const rankSelectId = useId();

  const result = useMemo(() => {
    const mine = plans.find((p) => p.code === yourPlan)!;
    const theirs = plans.find((p) => p.code === theirPlan)!;
    const rank = ranks.find((r) => r.id === rankId)!;
    const multiplier = Number(rank.multiplier.replace("x", ""));

    const netPerMember = theirs.priceMinor * NET_REVENUE_FACTOR;

    const counts = [
      directs,
      directs * eachRefers,
      directs * eachRefers * eachRefers,
    ];

    const levels = counts.map((count, i) => {
      const depth = i + 1;

      // Qualification rule: to earn at depth N you need at least N direct
      // active referrals. Without this the calculator would overstate.
      const qualified = directs >= depth;

      // Level 1 is a flat 40% for everyone. The rank multiplier applies from
      // level 2 down, so the headline rate stays a promise rather than a
      // starting point, and never breaches the per level cap.
      const baseRate = mine.commission[i] ?? 0;
      const rate =
        depth >= MULTIPLIER_APPLIES_FROM_LEVEL
          ? Math.min(baseRate * multiplier, MAX_RATE_PER_LEVEL)
          : baseRate;

      // One time: this is what the whole level pays once, not per month.
      const payout = qualified
        ? Math.floor((count * netPerMember * rate) / 100)
        : 0;

      return { depth, count, rate, baseRate, qualified, payout };
    });

    const total = levels.reduce((sum, l) => sum + l.payout, 0);
    const lockedDepths = levels.filter((l) => !l.qualified && l.count > 0);

    return { levels, total, lockedDepths, multiplier, netPerMember };
  }, [yourPlan, theirPlan, directs, eachRefers, rankId]);

  return (
    <div className="grid gap-px lg:grid-cols-2">
      {/* Controls */}
      <div className="rounded-md border border-line bg-surface p-7 lg:p-9">
        <h3 className="text-h4">Your situation</h3>

        <div className="mt-7 space-y-7">
          <div>
            <p className="text-micro uppercase tracking-[0.08em] text-muted">
              Your plan
            </p>
            <Segmented
              className="mt-3 flex-wrap"
              label="Your plan"
              options={planOptions}
              value={yourPlan}
              onChange={setYourPlan}
            />
          </div>

          <div>
            <label
              htmlFor={directsId}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="text-micro uppercase tracking-[0.08em] text-muted">
                People you refer directly
              </span>
              <span className="text-h4 tabular">{directs}</span>
            </label>
            <input
              id={directsId}
              type="range"
              min={0}
              max={40}
              step={1}
              value={directs}
              onChange={(e) => setDirects(Number(e.target.value))}
              className="mt-3 w-full accent-violet"
            />
          </div>

          <div>
            <label
              htmlFor={eachId}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="text-micro uppercase tracking-[0.08em] text-muted">
                People each of them refers
              </span>
              <span className="text-h4 tabular">{eachRefers}</span>
            </label>
            <input
              id={eachId}
              type="range"
              min={0}
              max={8}
              step={1}
              value={eachRefers}
              onChange={(e) => setEachRefers(Number(e.target.value))}
              className="mt-3 w-full accent-violet"
            />
          </div>

          <div>
            <p className="text-micro uppercase tracking-[0.08em] text-muted">
              What they typically buy
            </p>
            <Segmented
              className="mt-3 flex-wrap"
              label="Plan your referrals buy"
              options={planOptions}
              value={theirPlan}
              onChange={setTheirPlan}
            />
          </div>

          <div>
            <label
              htmlFor={rankSelectId}
              className="block text-micro uppercase tracking-[0.08em] text-muted"
            >
              Your rank
            </label>
            <select
              id={rankSelectId}
              value={rankId}
              onChange={(e) => setRankId(Number(e.target.value))}
              className="mt-3 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small"
            >
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.multiplier} multiplier
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="flex flex-col rounded-md bg-ink p-7 text-white lg:p-9">
        <h3 className="text-h4 text-white">What that network pays you</h3>

        <dl className="mt-7 border-t border-line-dark">
          {result.levels.map((level) => (
            <div
              key={level.depth}
              className="flex items-baseline justify-between gap-4 border-b border-line-dark py-4"
            >
              <dt>
                <span className="text-small text-white/80">
                  Level {level.depth}
                </span>
                <span className="ms-2 text-micro text-white/60 tabular">
                  {level.count} {level.count === 1 ? "person" : "people"} ·{" "}
                  {Math.round(level.rate * 100) / 100}%
                  {level.depth === 1 ? " flat" : null}
                </span>
              </dt>
              <dd className="text-h4 tabular">
                {level.qualified ? (
                  formatMoney(level.payout)
                ) : (
                  <span className="text-small text-white/60">Locked</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex items-baseline justify-between gap-4">
          <p className="text-micro uppercase tracking-[0.08em] text-white/60">
            Total, paid once
          </p>
          <p className="text-display leading-none text-lime tabular">
            {formatMoney(result.total)}
          </p>
        </div>

        <p className="mt-4 text-small text-white/60">
          Commission is paid once per member, on the payment that opens their
          account. Building the same network again next year would pay this
          again. The same people paying again would not.
        </p>

        {result.lockedDepths.length > 0 ? (
          <p className="mt-7 border-t border-line-dark pt-6 text-small text-white/60">
            {result.lockedDepths.length === 1 ? "Level" : "Levels"}{" "}
            {result.lockedDepths.map((l) => l.depth).join(" and ")}{" "}
            {result.lockedDepths.length === 1 ? "is" : "are"} locked because you
            need at least {Math.min(...result.lockedDepths.map((l) => l.depth))}{" "}
            direct active referrals to earn that far down. Refer more people and
            they unlock.
          </p>
        ) : null}
      </div>

      <Callout tone="warning" className="lg:col-span-2" title="This is a projection, not a forecast">
        <p>
          It assumes every one of those people actually joins and pays, and
          that your whole network buys the same plan. Neither happens in
          practice. Level 1 is a flat {DIRECT_COMMISSION_RATE}% for everyone;
          your rank multiplies levels 2 and 3 only. Commission is paid once per
          member, calculated on what we keep after payment processing, currently
          about {Math.round(NET_REVENUE_FACTOR * 100)}% of the price, and held
          for three days before it is yours to withdraw. Before you decide
          anything from this number, read the{" "}
          <Link href="/legal/income-disclosure">income disclosure</Link>, which
          shows what members actually earned rather than what they could have.
        </p>
      </Callout>
    </div>
  );
}
