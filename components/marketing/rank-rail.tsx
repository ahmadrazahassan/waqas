import { ranks } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

/**
 * Six levels plus the starting tier, as a horizontal rail. Scrolls below the desktop
 * breakpoint with a visible scrollbar track, because a hidden one leaves people
 * unsure there is anything further along.
 */
export function RankRail() {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
      <ol className="flex min-w-max gap-px lg:min-w-0">
        {ranks.map((rank) => (
          <li
            key={rank.id}
            className="flex w-56 shrink-0 flex-col justify-between border-t-2 border-ink bg-surface-alt p-5 lg:w-auto lg:flex-1"
          >
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-micro uppercase tracking-[0.08em] text-muted tabular">
                  {String(rank.id).padStart(2, "0")}
                </span>
                <span className="text-micro font-semibold tabular">
                  {rank.multiplier}
                </span>
              </div>
              <h3 className="mt-4 text-h4">{rank.name}</h3>
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-micro text-muted tabular">
                {rank.directReferrals === 0
                  ? "No referrals needed"
                  : `${rank.directReferrals} ${plural(rank.directReferrals, "referral")}`}
              </p>
              {rank.monthlyRewardMinor ? (
                <p className="rounded-xs bg-lime px-2 py-1 text-micro font-medium text-ink tabular">
                  We pay you {formatMoney(rank.monthlyRewardMinor)} a month
                </p>
              ) : null}
              <p className="text-small text-muted">{rank.unlocks}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
