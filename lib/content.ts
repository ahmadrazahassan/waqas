/* ==========================================================================
   HOME PAGE CONTENT

   Copy rules, section 13 of the spec. British English. Second person for the
   member, first person plural for the company. No em dashes, no exclamation
   marks, no emoji, no Title Case headings. Specifics beat superlatives.
   ========================================================================== */

/* --------------------------------------------------------------------------
   ⚠ PLACEHOLDER NUMBERS

   Every figure in this block is invented for layout review and MUST be replaced
   with real data before this site goes near a customer. Section 13: "Every
   number in shipped copy is real or the section does not ship."

   Set `statsAreReal` to true only once every value below has been checked
   against the database. Until then the UI marks them in development.
   -------------------------------------------------------------------------- */

export const statsAreReal = false;

export const heroProof = [
  { value: "2,480", label: "Members" },
  { value: "1,317", label: "Tasks paid this month" },
  { value: "Rs 6,240,000", label: "Commission paid to date" },
] as const;

export const splitStats = [
  {
    value: "43%",
    label: "Of member income came from referrals last quarter",
  },
  {
    value: "3.2",
    label: "Average direct referrals per active member",
  },
] as const;

/* -------------------------------------------------------------------------- */

export const hero = {
  eyebrow: "UK platform",
  heading: "Get paid for the work. Get paid again for who you bring.",
  lead: "Assignwork is a UK platform for paid online tasks. Complete work that matches your level, and earn commission on every member you introduce, three levels deep.",
  primaryCta: { label: "One payment from 5,000 PKR", href: "/pricing" },
  secondaryCta: { label: "See how referrals pay", href: "/referrals" },
  image: "/images/assignwork/members-workspace.webp",
} as const;

export const statement = {
  eyebrow: "Introduction",
  body: "We built Assignwork around one idea. The people who bring good members in should be paid properly for it, and they should be able to see exactly where every pound came from.",
  cta: { label: "Learn more", href: "/how-it-works" },
} as const;

export const referralSteps = [
  {
    depth: 1,
    rate: "40%",
    title: "You",
    body: "You share your link. Someone joins and pays for their account. You take 40% of it, once, and it is the same 40% whatever plan you are on.",
  },
  {
    depth: 2,
    rate: "8%",
    title: "Your referral",
    body: "They start bringing people in too. You earn on their referrals without doing anything further.",
  },
  {
    depth: 3,
    rate: "4%",
    title: "Their referral",
    body: "One more level down, and that is where it stops. Three levels, published rates, no hidden tiers.",
  },
] as const;

export const services = [
  {
    key: "tasks",
    title: "Paid tasks",
    body: "We post work every weekday. Writing, research, editing, data cleaning, transcription and translation. You claim what suits you, submit it, and the payment lands in your wallet once it is approved.",
  },
  {
    key: "referrals",
    title: "40% referral commission",
    body: "Share your link. When someone you introduced pays for their account, you take 40% of it. The 40% is the same on every plan and does not depend on what you spent, and it is paid once per member, not monthly.",
  },
  {
    key: "ranks",
    title: "Level progression",
    body: "Six levels, earned on the members you bring in, from 10 direct referrals up to 100. Reach Level 5 and we pay you 30,000 PKR a month on top of everything else. Level 6 pays 50,000. Levels cannot be bought.",
  },
  {
    key: "prizes",
    title: "Leaderboard prizes",
    body: "Referrals earn points. Points build a public table. At the end of each season the top of that table takes the prize, including Umrah packages on the Pakistan board.",
  },
] as const;

export const imageBand = {
  heading: "The people doing the work should be able to see where the money went",
  cta: { label: "Read the income disclosure", href: "/legal/income-disclosure" },
  image: "/images/assignwork/members-meeting.webp",
} as const;

export const leaderboardTeaser = {
  eyebrow: "Season",
  heading: "There is no draw and no luck involved",
  body: "Every referral earns points on a published formula. The board is public and it stays online after the season closes, so anyone can go back and check how a prize was won.",
  formula: [
    { label: "Starter referral", value: "10 points" },
    { label: "Pro referral", value: "22 points" },
    { label: "Elite referral", value: "45 points" },
  ],
  note: "Still subscribed after 90 days? You earn half those points again. Approved tasks earn 1 point each, capped at a fifth of your season total.",
} as const;

export const faqs = [
  {
    q: "What do I actually get for 5,000 PKR?",
    a: "Access to the task pool with five claims a month, the referral programme, and a place on the leaderboard. It is one payment, so there is no monthly fee and nothing to cancel afterwards.",
  },
  {
    q: "When do I get paid?",
    a: "Task payments land in your wallet as soon as a reviewer approves your submission. Referral commission is held for three days first, covering the 24 hour refund window and a fraud check. After that it becomes available and you can request a payout once you are above your plan threshold.",
  },
  {
    q: "What happens if someone I referred cancels?",
    a: "Commission is paid once, on the payment that opened their account, so there is nothing to stop. If they refund within the 24 hour window, that commission is reversed and you will see the reversal in your ledger with the reason attached.",
  },
  {
    q: "Why was my commission put under review?",
    a: "Our fraud checks flag things like several signups from one device, or a payment method used across multiple accounts. Flagged commission is held rather than cancelled, and you will see an expected resolution date. Most reviews clear within three working days.",
  },
  {
    q: "Do I have to refer people to earn?",
    a: "No. You can work tasks and never share your link. The reverse is not true though. To stay eligible for commission you need at least one approved task in the last 90 days, because income here cannot come from recruitment alone.",
  },
  {
    q: "Is the leaderboard a prize draw?",
    a: "No. There is no random element anywhere in it. Points are earned on a published formula, the standings are public throughout the season, and the top of the table wins. Ties break on whoever reached the total first.",
  },
  {
    q: "Can I pay to get higher on the leaderboard?",
    a: "No, and this is deliberate. Points come from the plan the person you referred buys, not from the plan you bought. A Starter member and an Elite member earn identical points for referring the same person.",
  },
  {
    q: "How much do people actually earn?",
    a: "Most members earn very little in their first few months, and some earn nothing. We publish real median and percentile figures in the income disclosure rather than showing you the top earner and letting you assume. Read it before you sign up.",
  },
] as const;

export const ctaBand = {
  lead: "Ready",
  strong: "when you are",
  links: [
    { label: "Get started", href: "/signup" },
    { label: "Talk to us", href: "/contact" },
  ],
} as const;
