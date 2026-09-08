import { plans, ranks, DIRECT_COMMISSION_RATE } from "@/lib/site";
import { formatMoney } from "@/lib/utils";

/* ==========================================================================
   ANNOUNCEMENTS

   Every line here is derived from real values in lib/site.ts, never typed as
   a string. Change a price or a reward in one place and every marquee on the
   site follows. A banner that says 30,000 while the database pays 25,000 is
   the kind of thing that ends up in a complaint.
   ========================================================================== */

const cheapest = plans[0]!;
const rewardLevels = ranks.filter((r) => r.monthlyRewardMinor !== null);
const topReward = rewardLevels[rewardLevels.length - 1];
const firstReward = rewardLevels[0];

export type Announcement = {
  text: string;
  emphasis?: boolean;
  /** Country code for a flag, or "GLOBAL" for the globe. */
  flag?: string;
};

/** Thin bar at the very top of the site. Short lines only. */
export const topAnnouncements: Announcement[] = [
  { text: `${DIRECT_COMMISSION_RATE}% on everyone you bring in`, emphasis: true },
  { text: `One payment from ${formatMoney(cheapest.priceMinor)}` },
  { text: "No monthly fee. Nothing to cancel." },
  ...(firstReward
    ? [
        {
          text: `${firstReward.name} pays you ${formatMoney(firstReward.monthlyRewardMinor!)} a month`,
          emphasis: true,
        },
      ]
    : []),
  { text: "New paid tasks posted every weekday" },
  { text: "Northern Areas trips on the Pakistan board", flag: "PK" },
  ...(topReward
    ? [
        {
          text: `${topReward.name} pays you ${formatMoney(topReward.monthlyRewardMinor!)} a month`,
        },
      ]
    : []),
  { text: "Umrah package for the top of the Pakistan board", emphasis: true, flag: "PK" },
  { text: "Commission clears in three days" },
  { text: "A UK company, paying in PKR", flag: "GB" },
  { text: "Open to members worldwide", flag: "GLOBAL" },
];

/** Large band used as a section break. Fewer, bigger lines. */
export const bandAnnouncements: Announcement[] = [
  { text: `${DIRECT_COMMISSION_RATE}% on every referral` },
  ...(firstReward
    ? [{ text: `${formatMoney(firstReward.monthlyRewardMinor!)} a month at ${firstReward.name}` }]
    : []),
  ...(topReward
    ? [{ text: `${formatMoney(topReward.monthlyRewardMinor!)} a month at ${topReward.name}` }]
    : []),
  { text: "Paid every month you hold it" },
  { text: "Umrah on the Pakistan board", flag: "PK" },
  { text: "Northern Areas trips", flag: "PK" },
  { text: "Cash and equipment worldwide", flag: "GLOBAL" },
];

/** Shown inside the member dashboard. Written to the person, not the market. */
export const memberAnnouncements: Announcement[] = [
  ...(firstReward
    ? [
        {
          text: `Reach ${firstReward.name} with ${firstReward.directReferrals} paid referrals and we pay you ${formatMoney(firstReward.monthlyRewardMinor!)} a month`,
          emphasis: true,
        },
      ]
    : []),
  { text: `${DIRECT_COMMISSION_RATE}% of what every member you bring in pays` },
  ...(topReward
    ? [
        {
          text: `${topReward.name} at ${topReward.directReferrals} referrals pays ${formatMoney(topReward.monthlyRewardMinor!)} a month`,
        },
      ]
    : []),
  { text: "Rewards land in your wallet on the 1st" },
  { text: "Your level is recomputed nightly" },
  { text: "Umrah package at the top of the Pakistan board", flag: "PK" },
];
