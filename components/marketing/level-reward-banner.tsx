import Link from "next/link";
import { ranks } from "@/lib/site";
import { formatMoney } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The monthly level reward, used as a hook across the site.
 *
 * Two things are always shown alongside the number, and they are not fine
 * print: the reward is paid while you HOLD the level, and it stops if you
 * drop below it. Advertising a monthly figure without the condition attached
 * is how a programme ends up promising an income it cannot pay.
 */

const rewardLevels = ranks.filter((r) => r.monthlyRewardMinor !== null);

export function LevelRewardBanner({
  variant = "band",
  className,
}: {
  variant?: "band" | "inline";
  className?: string;
}) {
  if (rewardLevels.length === 0) return null;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "rounded-md border border-line border-s-2 border-s-ink bg-surface p-6",
          className,
        )}
      >
        <p className="text-micro uppercase tracking-[0.08em] text-muted">
          Monthly level reward
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
          {rewardLevels.map((level) => (
            <div key={level.id}>
              <dt className="text-small text-muted">{level.name}</dt>
              <dd className="mt-1 text-h3 text-violet tabular">
                {formatMoney(level.monthlyRewardMinor!)}
                <span className="ms-1 text-small text-muted">a month</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-[62ch] text-small text-muted">
          Paid into your wallet every month for as long as you hold the level.
          It stops if your referral count drops below the threshold.
        </p>
      </div>
    );
  }

  return (
    <section className={cn("bg-ink text-white", className)}>
      <div className="container-site py-18 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>Monthly level reward</Eyebrow>
            <h2 className="mt-6 max-w-[20ch] text-h2 text-white">
              Reach Level 5 and we pay you every month
            </h2>
            <p className="mt-5 max-w-[52ch] text-lead text-white/70">
              On top of your referral commission and your task payments. It
              lands in your wallet on the first of the month, automatically.
            </p>
            <div className="mt-9">
              <ButtonLink href="/how-it-works#ranks" size="lg" arrow>
                See the levels
              </ButtonLink>
            </div>
          </div>

          <dl className="grid gap-px sm:grid-cols-2 lg:col-span-7">
            {rewardLevels.map((level) => (
              <div
                key={level.id}
                className="border-t border-line-dark pt-8 lg:pe-8"
              >
                <dt>
                  <span className="text-micro uppercase tracking-[0.08em] text-white/60">
                    {level.name}
                  </span>
                  <span className="mt-2 block text-small text-white/60 tabular">
                    {level.directReferrals} direct referrals
                  </span>
                </dt>
                <dd className="mt-6 text-display leading-none text-lime tabular">
                  {formatMoney(level.monthlyRewardMinor!)}
                </dd>
                <p className="mt-4 text-small text-white/60">
                  every month you hold it
                </p>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-14 max-w-[76ch] text-small text-white/60">
          The reward is paid for as long as you hold the level, and it stops if
          you drop below it. Levels are recomputed nightly on direct referrals
          who hold a paid account, so a refund or a lapse can move you down. You
          also need at least one approved task in the last 90 days, because
          income here cannot come from bringing people in alone. Full detail in
          the{" "}
          <Link
            href="/legal/referral-terms"
            className="text-white underline underline-offset-2"
          >
            referral terms
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
