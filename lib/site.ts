export const site = {
  name: "Assignwork",
  legalName: "Assignwork Ltd",
  tagline: "Paid tasks and three level referral commission",
  url: "https://assignwork.co.uk",
  description:
    "Assignwork is a UK platform for paid online tasks. Complete work that matches your rank, and earn commission on every member you introduce, three levels deep.",
  founded: 2026,
  email: "hello@assignwork.co.uk",
} as const;

export const offices = [
  {
    city: "London",
    lines: ["86 Paul Street", "London EC2A 4NE"],
    phone: "020 7946 0388",
  },
  {
    city: "Manchester",
    lines: ["1 St Peter's Square", "Manchester M2 3DE"],
    phone: "0161 850 4127",
  },
] as const;

/* --------------------------------------------------------------------------
   NAVIGATION
   Seven items would crowd the bar, so the last four sit behind More rather
   than shrinking the type. Section 3.7 of the spec.
   -------------------------------------------------------------------------- */

export const primaryNav = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Referrals", href: "/referrals" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Tasks", href: "/tasks" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const secondaryNav = [
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Browse tasks", href: "/tasks" },
      { label: "Pricing", href: "/pricing" },
      { label: "Ranks", href: "/how-it-works#ranks" },
      { label: "Guides", href: "/guides" },
    ],
  },
  {
    title: "Programme",
    links: [
      { label: "Referral programme", href: "/referrals" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Prizes", href: "/prizes" },
      { label: "Umrah season", href: "/prizes/umrah" },
      { label: "Income disclosure", href: "/legal/income-disclosure" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Referral terms", href: "/legal/referral-terms" },
      { label: "Competition rules", href: "/legal/competition-rules" },
      { label: "Refunds", href: "/legal/refunds" },
    ],
  },
] as const;

/* --------------------------------------------------------------------------
   PLANS

   PKR is the base currency, not a conversion. priceMinor is paisa, so
   5,000 PKR is 500000. Never a float, never a display string.

   These are ONE TIME prices. There is no monthly fee, no renewal and nothing
   to cancel. A member pays once and the account stays open.

   Level 1 commission is a flat 40% on every plan. That is the headline of the
   whole product and it does not change with what you bought. Plans differ on
   task volume and on the two deeper levels.

   referralPoints is what a referral OF this plan awards the referrer. Points
   come from what your referral buys, never from what you bought, so nobody
   can purchase a better leaderboard position.
   -------------------------------------------------------------------------- */

/** Flat direct referral rate. Referenced everywhere rather than retyped. */
export const DIRECT_COMMISSION_RATE = 40;

export type Plan = {
  code: "starter" | "pro" | "elite";
  name: string;
  priceMinor: number;
  claims: number | null;
  commission: [number, number, number];
  referralPoints: number;
  payoutThresholdMinor: number;
  summary: string;
  features: string[];
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    code: "starter",
    name: "Starter",
    priceMinor: 500_000, // 5,000 PKR, paid once
    claims: 5,
    commission: [DIRECT_COMMISSION_RATE, 5, 2],
    referralPoints: 10,
    payoutThresholdMinor: 300_000, // 3,000 PKR
    summary: "For members starting out and testing the platform.",
    features: [
      "5 task claims a month",
      "Entry and standard task pools",
      "Referral programme included",
      "Leaderboard eligible",
      "Withdraw from 3,000 PKR",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    priceMinor: 800_000, // 8,000 PKR, paid once
    claims: 20,
    commission: [DIRECT_COMMISSION_RATE, 8, 4],
    referralPoints: 22,
    payoutThresholdMinor: 200_000, // 2,000 PKR
    summary: "For members working the platform regularly.",
    features: [
      "20 task claims a month",
      "Six hour head start on new tasks from rank 3",
      "Referral materials in Urdu and English",
      "Higher rates on the two deeper referral levels",
      "Withdraw from 2,000 PKR",
    ],
    featured: true,
  },
  {
    code: "elite",
    name: "Elite",
    priceMinor: 999_900, // 9,999 PKR, paid once
    claims: 50,
    commission: [DIRECT_COMMISSION_RATE, 10, 5],
    referralPoints: 45,
    payoutThresholdMinor: 100_000, // 1,000 PKR
    summary: "For members building a network rather than working alone.",
    features: [
      "50 task claims a month",
      "Premium task pool",
      "Vanity referral code from rank 4",
      "Priority review on submitted work",
      "Withdraw from 1,000 PKR",
    ],
  },
];

/* --------------------------------------------------------------------------
   LEVELS

   Earned on direct active referrals, never purchased. "Active" means the
   referral holds a paid membership, so an unpaid signup moves nobody up.

   The top two levels carry a monthly reward the company PAYS the member, for
   as long as they hold the level. It is a liability, not a requirement.

   A member with no referrals still needs a level to sit on, which is why
   Member exists below Level 1.
   -------------------------------------------------------------------------- */

export type Rank = {
  id: number;
  name: string;
  directReferrals: number;
  /** Paisa paid TO the member each month while they hold this level. */
  monthlyRewardMinor: number | null;
  multiplier: string;
  unlocks: string;
};

export const ranks: Rank[] = [
  {
    id: 1,
    name: "Member",
    directReferrals: 0,
    monthlyRewardMinor: null,
    multiplier: "1.00x",
    unlocks: "Task pool and the referral programme",
  },
  {
    id: 2,
    name: "Level 1",
    directReferrals: 10,
    monthlyRewardMinor: null,
    multiplier: "1.10x",
    unlocks: "Standard task pool",
  },
  {
    id: 3,
    name: "Level 2",
    directReferrals: 20,
    monthlyRewardMinor: null,
    multiplier: "1.20x",
    unlocks: "Six hour head start on new tasks",
  },
  {
    id: 4,
    name: "Level 3",
    directReferrals: 35,
    monthlyRewardMinor: null,
    multiplier: "1.30x",
    unlocks: "Premium task pool",
  },
  {
    id: 5,
    name: "Level 4",
    directReferrals: 50,
    monthlyRewardMinor: null,
    multiplier: "1.40x",
    unlocks: "Vanity referral code and priority review",
  },
  {
    id: 6,
    name: "Level 5",
    directReferrals: 65,
    monthlyRewardMinor: 3_000_000, // 30,000 PKR paid to them monthly
    multiplier: "1.50x",
    unlocks: "Weekly payouts, plus 30,000 PKR a month",
  },
  {
    id: 7,
    name: "Level 6",
    directReferrals: 100,
    monthlyRewardMinor: 5_000_000, // 50,000 PKR paid to them monthly
    multiplier: "1.60x",
    unlocks: "Revenue share pool, plus 50,000 PKR a month",
  },
];
