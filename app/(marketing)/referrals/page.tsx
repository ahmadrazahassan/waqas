import type { Metadata } from "next";
import Link from "next/link";
import { plans } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { Artwork } from "@/components/ui/artwork";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { ReferralCalculator } from "@/components/marketing/referral-calculator";
import { Faq } from "@/components/marketing/faq";
import { LevelRewardBanner } from "@/components/marketing/level-reward-banner";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";

export const metadata: Metadata = {
  title: "Referral programme",
  description:
    "Earn commission on the members you introduce, on the members they introduce, and one level beyond that. Published rates, three levels, no hidden tiers.",
  alternates: { canonical: "/referrals" },
};

const steps = [
  {
    n: "01",
    title: "Share your link",
    body: "Every member gets a link like assignwork.co.uk/r/AW7K4Q2M, plus a QR code and share text you can edit before you send it. From rank 4 you can claim a custom code with your own name in it.",
  },
  {
    n: "02",
    title: "They sign up and pay",
    body: "We record who introduced them the first time they land on the site, and that sticks for 90 days. First touch wins, so you do not lose someone because they clicked a different link later.",
  },
  {
    n: "03",
    title: "Commission clears after three days",
    body: "It sits as pending for three days, which covers the 24 hour refund window and a fraud check, then becomes available in your wallet. You can watch the countdown on every pending row rather than wondering.",
  },
  {
    n: "04",
    title: "You get paid again next month",
    body: "Commission is not a one off. For as long as that member keeps paying, you keep earning on them, and on the two levels below them.",
  },
] as const;

const referralFaqs = [
  {
    q: "How long does my referral link last?",
    a: "The attribution lasts 90 days from the first time someone lands on the site through your link. If they sign up any time in that window, they are yours. After 90 days the cookie expires and they count as unreferred.",
  },
  {
    q: "What if two people refer the same person?",
    a: "First touch wins. Whoever brought them to the site first gets the commission, even if they signed up after clicking someone else's link later. We record last touch too, but only so you can see which of your channels actually work.",
  },
  {
    q: "Can my sponsor be changed later?",
    a: "No. Whoever referred you is locked in at signup and neither you nor our support team can change it afterwards. The only exception is a documented error, which needs two admin approvals and is written to an audit log. That rule exists so nobody can quietly move commission around.",
  },
  {
    q: "Why do I need to complete tasks to earn commission?",
    a: "You need at least one approved task in the last 90 days to stay commission eligible. This is not busywork. A programme where income comes purely from recruiting other people is a pyramid scheme and unlawful in the UK. Tying earnings to real work is what keeps this a legitimate business.",
  },
  {
    q: "Why is level 2 or level 3 locked for me?",
    a: "To earn at a given level you need at least that many direct active referrals. One direct referral unlocks level 1, two unlocks level 2, three unlocks level 3. It stops someone with a single referral collecting from a deep chain they had nothing to do with.",
  },
  {
    q: "What happens when a referral refunds or charges back?",
    a: "The commission is reversed and you will see a reversal entry in your ledger with the reason on it. We never delete the original row. Because the refund window is 24 hours and commission clears after three days, a refund almost always reverses money that had not yet reached your balance. If reversals cluster around one member, that account gets reviewed.",
  },
  {
    q: "Is there a level 4?",
    a: "No. Three levels is the whole programme and the schema is capped there. If that ever changes it would be announced in advance with a date, not slipped into the terms.",
  },
] as const;

export default function ReferralsPage() {
  return (
    <>
      <PageHeader
        artwork="network-sculpture"
        eyebrow="Referral programme"
        heading="40% of everyone you bring, three levels deep"
        lead="You take 40% every time someone you introduced pays their membership, and it stays 40% whatever plan you are on. When they introduce someone, you earn a smaller share of that too, and once more on the level below. Then it stops."
      >
        <ButtonLink href="/signup" size="lg" arrow>
          Get your link
        </ButtonLink>
      </PageHeader>

      {/* How it works */}
      <Section>
        <SectionHeader eyebrow="How it works" heading="Four steps, no small print" />

        <ol className="mt-14 grid gap-px lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} className="border-t-2 border-ink pt-7 lg:pe-8">
              <span className="text-micro text-muted tabular">{step.n}</span>
              <h3 className="mt-4 text-h4">{step.title}</h3>
              <p className="mt-3 text-small text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Rates */}
      <Section className="border-t border-line">
        <SectionHeader
          eyebrow="Rates"
          heading="What each plan pays"
          lead="Level 1 is a flat 40% on every plan. Plans differ on the two deeper levels, and the level you earn through direct referrals multiplies those, up to 1.6x at Level 6."
        />

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">
              Referral commission rate by plan and level
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                  Your plan
                </th>
                <th scope="col" className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                  Level 1
                </th>
                <th scope="col" className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                  Level 2
                </th>
                <th scope="col" className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                  Level 3
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.code} className="border-b border-line">
                  <th scope="row" className="py-5 text-start text-small font-medium">
                    {plan.name}
                  </th>
                  {plan.commission.map((rate, i) => (
                    <td key={i} className="py-5 text-small tabular">
                      {rate}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-[70ch] text-small text-muted">
          Rates apply to net revenue, which is what reaches us after payment
          processing. Paying a share of the sticker price would mean paying out
          on money we never received. Your rank multiplies levels 2 and 3 only,
          so the 40% stays a promise rather than a starting point.
        </p>
      </Section>

      <AnnouncementBand tone="ink" reverse />

      <LevelRewardBanner />

      {/* Calculator */}
      <Section className="border-t border-line">
        <Artwork name="cash-flow" className="mb-10 max-w-[520px]" />
        <SectionHeader
          eyebrow="Calculator"
          heading="Work out what a network would pay you"
          lead="Move the sliders. The locked levels are real: you have to hold enough direct referrals before the deeper levels pay anything."
        />
        <div className="mt-12">
          <ReferralCalculator />
        </div>
      </Section>

      {/* Rules */}
      <Section className="border-t border-line">
        <SectionHeader
          eyebrow="The rules"
          heading="The parts most programmes bury"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Callout title="You must be working">
            <p>
              At least one approved task in the last 90 days, or commission
              eligibility pauses. Income here cannot come from recruitment alone.
            </p>
          </Callout>
          <Callout title="Depth needs width">
            <p>
              One direct referral unlocks level 1, two unlocks level 2, three
              unlocks level 3. You cannot collect from a deep chain off a single
              introduction.
            </p>
          </Callout>
          <Callout title="Refunds claw back">
            <p>
              A refund or chargeback reverses the commission. The original entry
              stays in your ledger with the reason attached, rather than quietly
              disappearing.
            </p>
          </Callout>
        </div>

        <Callout tone="warning" className="mt-6" title="Most members earn very little">
          <p>
            That is the honest position and we would rather you read it here than
            find out later. The{" "}
            <Link href="/legal/income-disclosure">income disclosure</Link> publishes
            real median and percentile earnings, including the members who earned
            nothing at all. Read it before you decide anything.
          </p>
        </Callout>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          align="center"
          eyebrow="Questions"
          heading="Referral questions"
          className="mx-auto"
        />
        <div className="mt-12">
          <Faq items={referralFaqs} />
        </div>
      </Section>
    </>
  );
}
