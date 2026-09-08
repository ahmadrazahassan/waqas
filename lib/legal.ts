/* ==========================================================================
   LEGAL PAGES

   ⚠ These are working drafts written to make the site coherent and to record
   the commitments the product actually enforces. They have NOT been reviewed
   by a solicitor and must be before the platform takes a payment. Every page
   renders a notice saying so while `legalReviewed` is false.

   The referral terms and competition rules in particular carry real regulatory
   weight: the Trading Schemes Act 1996 for the first, and the reason there is
   no prize draw anywhere in this product for the second.
   ========================================================================== */

export const legalReviewed = false;
export const lastUpdated = "2026-08-27";

export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const legalDocs: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of use",
    summary:
      "The agreement between you and Assignwork Ltd covering membership, tasks, payment and the ways either of us can end it.",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "Assignwork is operated by Assignwork Ltd, a company being incorporated in England and Wales. Our registration number, registered office and VAT number will appear here and in the site footer before we take a first payment.",
          "These terms are governed by the law of England and Wales, and the courts of England and Wales have jurisdiction over any dispute.",
        ],
      },
      {
        heading: "Membership",
        paragraphs: [
          "Membership is a single payment, not a subscription. There is no monthly fee, no renewal and nothing to cancel. It gives you access to the task pool at the volume set by your plan, participation in the referral programme, and eligibility for the leaderboard.",
          "You must be at least 18 years old and legally able to enter a contract. One account per person. Accounts are personal and may not be sold, shared or transferred.",
          "There is nothing to cancel, because there is nothing recurring. If you want a refund you must ask within 24 hours of your payment being confirmed. See the refunds policy.",
        ],
      },
      {
        heading: "Tasks and submissions",
        paragraphs: [
          "Tasks are posted by Assignwork. Each one states its payment, deadline, deliverable and minimum rank before you claim it. Claiming a task is a commitment to deliver it by the stated deadline.",
          "Submissions are reviewed against a rubric published with the task. Approved work is paid into your wallet at the stated amount. Work that does not meet the brief gets one revision round with written feedback.",
          "You confirm that everything you submit is your own work, that you have the right to supply it, and that it does not infringe anyone else's rights. On approval and payment, ownership of the deliverable passes to Assignwork or its client.",
          "You must not submit work produced for a student to hand in as their own. We do not post such tasks and we will close accounts that attempt to route that work through the platform.",
        ],
      },
      {
        heading: "Payment and payouts",
        paragraphs: [
          "Plans are priced and charged in PKR as a one time payment. Prices shown are what you pay; where tax applies to your country it is calculated at checkout and shown before you confirm.",
          "Wallet balances can be withdrawn once they exceed your plan's payout threshold. We may require identity verification before releasing payouts once your lifetime earnings pass 150,000 PKR, and we will tell you before you reach that point rather than at the moment you are blocked.",
          "We do not charge a fee to withdraw. Your payment provider or bank may.",
        ],
      },
      {
        heading: "Suspension and closure",
        paragraphs: [
          "We may restrict or close an account for fraud, repeated missed deadlines, plagiarism, abuse of the referral programme, or a serious breach of these terms. Where we can, we will tell you what happened and give you a chance to respond.",
          "If we close your account, any wallet balance you have legitimately earned remains payable to you, subject to the usual verification.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We may change these terms. Material changes will be notified by email at least 30 days before they take effect. Because access is already bought and does not expire, a change to these terms never takes access away from you. Commission rates in force when a payment was taken always apply to that payment.",
        ],
      },
    ],
  },
  {
    slug: "referral-terms",
    title: "Referral terms",
    summary:
      "How referral commission is earned, calculated, held, reversed and paid. Read this alongside the income disclosure.",
    sections: [
      {
        heading: "What you earn on",
        paragraphs: [
          "You earn 40% of the net revenue Assignwork receives from a member you introduced directly, for as long as they keep paying. That rate is the same on every plan. Net revenue is what reaches us after payment processing. It is not the sticker price.",
          "The programme runs three levels deep. You earn on the members you introduce, on the members they introduce, and one level beyond that. There is no fourth level.",
          "Level 1 is a flat 40%. Levels 2 and 3 are set by your plan and multiplied by your rank, capped at 45% of net revenue at any single level. The rank multiplier does not apply to level 1.",
        ],
      },
      {
        heading: "Eligibility",
        paragraphs: [
          "To earn commission you must hold a paid account and have had at least one task approved in the previous 90 days. If you stop completing work, commission eligibility pauses until you complete a task again.",
          "This requirement is not administrative. A scheme where participants' income comes mainly from recruiting other participants rather than from selling a genuine service is a pyramid promotional scheme and is unlawful in the United Kingdom. Tying earnings to real completed work is what keeps this programme lawful, and it is enforced in our systems rather than promised here.",
          "To earn at a given level you need at least that many direct active referrals. One unlocks level one, two unlocks level two, three unlocks level three.",
        ],
      },
      {
        heading: "Attribution",
        paragraphs: [
          "We record who introduced a visitor the first time they arrive through a referral link, and that attribution lasts 90 days. First touch wins. If someone arrives through your link and later clicks a different member's link before signing up, the commission is still yours.",
          "Your sponsor is fixed when you sign up and cannot be changed afterwards by you, by them, or by our support team. Correcting a documented error requires two administrator approvals and is recorded in an audit log.",
          "Self referral is not permitted. Attempting it, including through a second account, a family member's account you control, or a shared payment method, will forfeit the commission and may close both accounts.",
        ],
      },
      {
        heading: "Holding and reversal",
        paragraphs: [
          "Commission is held as pending for three days from the payment it arises from. That covers the 24 hour refund window and leaves room for a fraud check. After that it becomes available in your wallet.",
          "If the underlying payment is refunded or charged back, the commission is reversed. The original entry is never deleted; a reversal entry appears in your ledger with the reason attached.",
          "Commission flagged by our fraud checks is held for review rather than cancelled, and you will see an expected resolution date. Most reviews clear within three working days.",
        ],
      },
      {
        heading: "What we do not do",
        paragraphs: [
          "There is no joining fee, no inventory to buy, no minimum monthly spend to stay active, and no way to pay for a higher rank or a better leaderboard position.",
          "We do not pay anything for a signup alone. Commission arises only when a member actually pays for a service.",
        ],
      },
    ],
  },
  {
    slug: "competition-rules",
    title: "Competition rules",
    summary:
      "How leaderboard seasons run and how prizes are awarded. There is no element of chance anywhere in this.",
    sections: [
      {
        heading: "This is a competition, not a draw",
        paragraphs: [
          "Prizes are awarded to the members who finish highest on a published points table. There is no draw, no lottery, no random selection, no odds and no ticket. Standings are public throughout a season and remain online after it closes.",
          "Because the outcome is determined entirely by measured performance rather than chance, this is not a lottery under the Gambling Act 2005 and does not require a licence. We will not introduce a random tiebreak, a bonus entry or any chance based mechanic, because doing so would change that.",
        ],
      },
      {
        heading: "Earning points",
        paragraphs: [
          "Points are earned when a member you referred directly pays for their first month, at a rate set by the plan they bought. If that member is still subscribed 90 days later you earn half those points again.",
          "Each approved task earns one point, capped at one fifth of your season total.",
          "Points come from the plan your referral buys, never from the plan you hold. No plan confers a scoring advantage.",
        ],
      },
      {
        heading: "Seasons and settlement",
        paragraphs: [
          "The points formula, prize table, dates and eligible track are published before a season opens and cannot be changed once the first point is earned. Changing them requires closing the season and opening a new one.",
          "At the closing date the board locks. A seven day settlement window then runs, during which refunds, chargebacks and fraud reviews remove points. Final standings are computed after settlement.",
          "Ties are broken in favour of whoever reached the tied total first. This is deterministic and requires no random selection.",
        ],
      },
      {
        heading: "Prizes",
        paragraphs: [
          "Every travel or physical prize carries a cash alternative at a published value. No winner is required to accept a prize they cannot use.",
          "Travel prizes are fulfilled by a named licensed third party operator contracted before the season opens. Assignwork does not sell travel and does not hold customer money for travel.",
          "Winners must verify their identity before a prize is booked or shipped. Names and photographs are published only with written consent; a winner who declines appears as a member number and receives the prize regardless.",
          "Prizes may be taxable where you live. We cannot give tax advice and you are responsible for your own position.",
        ],
      },
      {
        heading: "Eligibility",
        paragraphs: [
          "Seasons run on three tracks: Pakistan, United Kingdom, and Global. Your track follows your verified country of residence, which is set at signup and can be changed only with verification.",
          "Employees of Assignwork Ltd and their immediate families are not eligible.",
        ],
      },
    ],
  },
  {
    slug: "income-disclosure",
    title: "Income disclosure",
    summary:
      "What members actually earn from the referral programme, including the ones who earn nothing.",
    sections: [
      {
        heading: "There is no data yet",
        paragraphs: [
          "The platform has not launched, so there are no real earnings to report. This page will publish median and percentile referral earnings by tenure, the proportion of members who earned nothing, and the proportion who earned less than their membership fee, updated quarterly.",
          "We are not going to fill this page with projections or with a top earner's figures. A disclosure built from the best case is not a disclosure.",
        ],
      },
      {
        heading: "What we can tell you now",
        paragraphs: [
          "Referral programmes of this shape typically produce very small earnings for most participants and meaningful earnings for a small minority. You should assume you will be in the first group unless and until the published data tells you otherwise.",
          "A plan costs money up front and the refund window is 24 hours. Referral commission is held for three days and is reversed if the person refunds. Treat what you pay as a cost you are choosing to carry, not as an investment that will pay for itself.",
          "The earnings calculator on the referrals page is a projection built from inputs you choose. It assumes nobody cancels and everybody pays every month. Neither happens in practice.",
        ],
      },
      {
        heading: "When this changes",
        paragraphs: [
          "The first disclosure will be published 90 days after launch and updated every quarter after that. It will be linked from the pricing page, the referrals page and the signup flow, at the same size as everything else on those pages.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary:
      "What personal data we collect, why, how long we keep it, and the rights you have over it under UK GDPR.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "Account data: your name, username, email address, country, and optionally a phone number and avatar.",
          "Financial data: purchase and payment records. Card details are handled by Stripe and never reach our servers. Payout destinations are tokenised by our payment provider; we do not store raw bank details.",
          "Work data: tasks you claim, submissions you upload, and review scores and feedback.",
          "Referral data: who introduced you, who you introduced, and click records. Click records store a hashed IP address and a hashed user agent, never the raw values.",
          "Identity data: where verification is required for payouts, the documents you supply. These are stored in a private bucket and served only through short lived signed links.",
        ],
      },
      {
        heading: "Why we process it",
        paragraphs: [
          "To provide the service under our contract with you, to calculate and pay commission accurately, to prevent fraud, and to meet our legal and tax obligations. Analytics and non essential cookies run only with your consent.",
        ],
      },
      {
        heading: "Who sees it",
        paragraphs: [
          "Members in your upline can see your display name, rank, the month you joined and whether you hold an active plan. They cannot see your email address, phone number, address or earnings.",
          "Our processors include Stripe for payments, Supabase for database and storage hosting, Vercel for application hosting, and Resend for transactional email. We do not sell personal data to anyone.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Under UK GDPR you can request access to your data, correction, erasure, restriction, portability, and you can object to processing. Email us and we will respond within one month.",
          "Some records must be retained after account closure for tax and anti fraud purposes, typically six years for financial records.",
          "If you are unhappy with how we handled your data you can complain to the Information Commissioner's Office at ico.org.uk.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookies",
    summary: "The cookies we set, what each one does, and how long it lasts.",
    sections: [
      {
        heading: "Strictly necessary",
        paragraphs: [
          "Authentication cookies keep you signed in. Without them the dashboard cannot work.",
          "aw_ref records the referral code you arrived through, so the member who introduced you is credited correctly. It lasts 90 days and holds only a referral code.",
          "aw_visitor is a first party identifier used to match referral clicks to signups and to prevent abuse. It lasts 400 days.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "We use PostHog to understand which pages help people and which do not. These cookies are set only if you consent, and declining them changes nothing about how the platform works for you.",
        ],
      },
      {
        heading: "Managing them",
        paragraphs: [
          "You can change your choice at any time from the cookie settings link in the footer, and you can clear cookies in your browser. Clearing aw_ref before you sign up means the member who referred you will not be credited.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refunds",
    summary:
      "You have 24 hours from paying to change your mind. This explains how that works, what happens afterwards, and what a refund does to commission.",
    sections: [
      {
        heading: "Twenty four hours",
        paragraphs: [
          "You can ask for a full refund within 24 hours of your payment being confirmed. Email us or use the option in your account settings. We do not ask you why.",
          "The 24 hours runs from the moment we confirm your payment and open your account, not from the moment you sent the transfer. Your billing page shows the exact time your window closes.",
          "If you have already claimed and been paid for tasks inside that window, those earnings stay yours. The refund covers what you paid for access.",
        ],
      },
      {
        heading: "After 24 hours",
        paragraphs: [
          "After the window closes the payment is not refundable. Access is bought once and does not expire, so there is no unused period to refund and nothing to cancel.",
          "That is a short window and we would rather you knew it before you paid than after. It is stated on the pricing page, on the payment form and in the confirmation email.",
          "If we fail to provide what you paid for, that is different. A prolonged outage of the task pool, or access you were charged for and never received, is something we will put right whether or not 24 hours have passed. Contact us.",
        ],
      },
      {
        heading: "Where the law gives you longer",
        paragraphs: [
          "Nothing in this policy removes a right you have under the consumer law where you live. If your local law gives you a longer cancellation period than 24 hours, that law applies and this policy does not override it.",
          "In practice this matters most for members in the United Kingdom and the European Union, where distance selling rules give consumers a statutory cancellation period. If you are in one of those places and the statutory period is longer, you keep it.",
        ],
      },
      {
        heading: "Effect on referral commission",
        paragraphs: [
          "When a payment is refunded, any commission paid on it to members in the upline is reversed. Those members see a reversal entry in their ledger with the reason attached.",
          "Leaderboard points arising from a refunded payment are also removed. This is why a seven day settlement window runs after every season closes and before prizes are awarded.",
          "Commission is held for three days before it becomes available, which covers the 24 hour refund window and leaves room for a fraud check. Refunds inside that window therefore reverse commission that had not yet been released.",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string) {
  return legalDocs.find((d) => d.slug === slug);
}
