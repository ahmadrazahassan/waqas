/* ==========================================================================
   LEADERBOARD AND PRIZES

   There is no element of chance anywhere in this system. No draw, no lottery,
   no random selection, no odds, no seed, no ticket. Points are earned on a
   published formula, standings are public throughout the season, and the top
   of the table wins. Ties break on whoever reached the total first, which is
   deterministic and needs no randomness.

   Never introduce a random tiebreak, a bonus entry, or a spin to win mechanic.
   That is precisely what would turn a performance competition into a lottery.
   ========================================================================== */

import { plans } from "@/lib/site";

export const pointsFormula = plans.map((p) => ({
  label: `${p.name} referral`,
  points: p.referralPoints,
}));

export const pointsRules = [
  {
    title: "Points come from what your referral buys",
    body: "Not from what you bought. A Starter member and a Studio member earn identical points for referring the same person. Nobody can buy a better position.",
  },
  {
    title: "Staying counts double",
    body: "If someone you referred is still subscribed after 90 days, you earn half their original points again. The board rewards bringing people who stay, not people who sign up and vanish.",
  },
  {
    title: "Work counts too",
    body: "Every approved task earns one point, capped at a fifth of your season total. Enough to matter, not enough to let anyone grind their way to the top without referring.",
  },
  {
    title: "Refunds remove points",
    body: "If a referral refunds or charges back, those points come off. A seven day settlement window runs after every season closes for exactly this reason.",
  },
] as const;

export type Track = "pk" | "uk" | "global";

export const tracks: { value: Track; label: string; blurb: string }[] = [
  {
    value: "pk",
    label: "Pakistan",
    blurb:
      "Umrah packages, Northern Areas trips and cash. Open to members with a verified address in Pakistan.",
  },
  {
    value: "uk",
    label: "United Kingdom",
    blurb: "Cash awards, equipment and a training budget.",
  },
  {
    value: "global",
    label: "Global",
    blurb: "Cash awards and equipment, for members everywhere else.",
  },
];

/**
 * ⚠ PLACEHOLDER. Every prize below must be costed and a supplier contracted
 * before a season opens. Nothing is announced that is not already paid for or
 * underwritten. Prize values are deliberately absent until that happens.
 */
export const prizeTables: Record<
  Track,
  { positions: string; prize: string; cashAlternative: boolean }[]
> = {
  pk: [
    { positions: "1", prize: "Umrah package for two, including flights, visa, hotel and transfers", cashAlternative: true },
    { positions: "2", prize: "Northern Areas trip for two, Naran and Kaghan, five nights", cashAlternative: true },
    { positions: "3", prize: "Laptop", cashAlternative: true },
    { positions: "4 to 10", prize: "Smartphone", cashAlternative: true },
    { positions: "11 to 25", prize: "Wallet credit", cashAlternative: false },
    { positions: "26 to 100", prize: "Wallet credit", cashAlternative: false },
  ],
  uk: [
    { positions: "1", prize: "Cash award", cashAlternative: false },
    { positions: "2", prize: "Cash award", cashAlternative: false },
    { positions: "3", prize: "Laptop", cashAlternative: true },
    { positions: "4 to 10", prize: "Equipment budget", cashAlternative: true },
    { positions: "11 to 25", prize: "Wallet credit", cashAlternative: false },
    { positions: "26 to 100", prize: "Wallet credit", cashAlternative: false },
  ],
  global: [
    { positions: "1", prize: "Cash award", cashAlternative: false },
    { positions: "2", prize: "Cash award", cashAlternative: false },
    { positions: "3", prize: "Laptop", cashAlternative: true },
    { positions: "4 to 10", prize: "Equipment budget", cashAlternative: true },
    { positions: "11 to 25", prize: "Wallet credit", cashAlternative: false },
    { positions: "26 to 100", prize: "Wallet credit", cashAlternative: false },
  ],
};

export const prizeTerms = [
  "Every travel or physical prize carries a cash alternative at a published value. Nobody is forced to take a trip they cannot make.",
  "Travel is arranged by a named third party operator contracted in advance. Assignwork does not sell travel and does not hold money for it.",
  "Winners verify their identity before anything is booked or shipped.",
  "Names and photographs are published only with written consent. An opted out winner appears as a member number and still receives the prize.",
  "Prizes may be taxable where you live. We cannot give tax advice, so check your own position.",
] as const;

/**
 * No season is live yet. When one is, this becomes a Supabase query against
 * `seasons` and the leaderboard renders real standings. Until then the page
 * shows the format and the rules rather than invented names on a fake board.
 */
export const liveSeason: null = null;
