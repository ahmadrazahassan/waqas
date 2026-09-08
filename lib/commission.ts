import { DIRECT_COMMISSION_RATE, type Plan } from "@/lib/site";

/**
 * What reaches us after payment processing. Commission is calculated on this,
 * never on the headline price, because paying a share of money we never
 * received is how a programme like this quietly runs at a loss.
 *
 * ⚠ Replace with the real blended rate once there are enough settled payments
 * to measure it. Local Pakistani rails price differently to card.
 */
export const NET_REVENUE_FACTOR = 0.95;

/**
 * The rank multiplier applies to levels 2 and 3 only.
 *
 * Level 1 is a flat 40% for everyone, which is the single clearest promise the
 * product makes. Multiplying it would both break that promise and blow through
 * the 45% per level cap the moment anyone reached rank 4 (40 x 1.2 = 48).
 */
export const MULTIPLIER_APPLIES_FROM_LEVEL = 2;

/** Hard ceiling on any single level, enforced in SQL as well as here. */
export const MAX_RATE_PER_LEVEL = 45;

/** Monthly commission in paisa for one referral on a given plan. */
export function commissionPerReferral(
  referredPlan: Plan,
  ratePercent: number = DIRECT_COMMISSION_RATE,
  multiplier = 1,
) {
  const effectiveRate = Math.min(ratePercent * multiplier, MAX_RATE_PER_LEVEL);
  return Math.floor(
    (referredPlan.priceMinor * NET_REVENUE_FACTOR * effectiveRate) / 100,
  );
}

/**
 * How many same plan referrals it takes for the commission to cover the
 * membership fee. Computed rather than written down, so it stays true if a
 * rate or a price changes.
 */
export function referralsToBreakEven(plan: Plan) {
  const perReferral = commissionPerReferral(plan);
  if (perReferral <= 0) return Infinity;
  return Math.ceil(plan.priceMinor / perReferral);
}
