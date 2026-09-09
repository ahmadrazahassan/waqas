import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { PricingTable } from "@/components/marketing/pricing-table";
import { PlanComparison } from "@/components/marketing/plan-comparison";
import { Faq } from "@/components/marketing/faq";
import { LevelRewardBanner } from "@/components/marketing/level-reward-banner";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PaymentReview } from "@/components/app/payment-review";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One payment from 5,000 PKR. No monthly fee, no renewal and nothing to cancel. Three plans covering task volume and pool access.",
  alternates: { canonical: "/pricing" },
};

const included = [
  {
    title: "Access to the task pool",
    body: "New paid work is posted every weekday. Each task states its payment, deadline and minimum rank before you claim it, so you never find out what a piece pays after you have done it.",
  },
  {
    title: "The referral programme",
    body: "Included on every plan at the same headline rate. What differs between plans is the two deeper levels, not the rate on the people you introduce directly.",
  },
  {
    title: "Level progression",
    body: "Six levels earned on the members you bring in, from 10 direct referrals up to 100. Higher levels see better paid tasks first, and the top two carry a monthly reward we pay you. Levels cannot be bought at any price.",
  },
  {
    title: "Leaderboard eligibility",
    body: "Seasons run quarterly on a published points formula. The standings are public throughout and stay online afterwards.",
  },
] as const;

const pricingFaqs = [
  {
    q: "Is this really a one time payment?",
    a: "Yes. You pay once and the account stays open. There is no monthly fee, no annual renewal, no card kept on file and nothing to cancel. If you ever want a higher plan you pay the difference at that point, and never again after that. The refund window is 24 hours from confirmation.",
  },
  {
    q: "What is the difference between the plans?",
    a: "How many tasks you can claim each month, which pools you can see, and the rates on the two deeper referral levels. The rate you earn on people you introduce directly is the same on all three, because a referral rate that changes with what you spent is a reason to distrust the programme.",
  },
  {
    q: "Can I upgrade later?",
    a: "Contact support for an upgrade quote before making another payment. An approved upgrade changes your plan access. It does not pay commission a second time to whoever referred you, because commission is paid once per member and not once per payment.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes, in full, if you ask within 24 hours of your payment being confirmed. Email us or use the option in your account settings, and we do not ask why. After 24 hours the payment is not refundable, because access is bought once and there is no unused period to return. It is a short window and we would rather you knew that before paying than after.",
  },
  {
    q: "How do I pay from Pakistan?",
    a: "JazzCash QR is our only payment method. Choose your plan, scan the QR in Plans & payments, then submit the transaction ID and a payment screenshot. A six hour review countdown starts once your submission is saved. Your account activates only after an admin verifies the payment. If review takes longer, please contact support rather than paying again.",
  },
  {
    q: "What about tax?",
    a: "Prices on this page are what you pay. Where tax applies to your country it is calculated at checkout and shown before you confirm. Anything you earn on the platform is income, and you are responsible for declaring it where you live.",
  },
] as const;

export default async function PricingPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: waiting } = user ? await supabase.from("payment_declarations")
    .select("id, created_at, reference, plans(name)").eq("user_id", user.id)
    .eq("status", "submitted").order("created_at").limit(1).maybeSingle() : { data: null };
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        heading="One payment. No monthly fee."
        lead="Three plans, from 5,000 PKR. You pay once and the account stays open. There is no renewal, no card kept on file and nothing to cancel."
      />

      <Section>
        {waiting ? <PaymentReview key={waiting.id} submittedAt={waiting.created_at} serverNow={new Date().getTime()} reference={waiting.reference} planName={(waiting.plans as { name: string } | null)?.name} /> : null}
        <PricingTable />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          eyebrow="Included"
          heading="What every plan gives you"
          lead="The plans differ on volume and pool access. Everything below is on all three."
        />

        <div className="mt-12 grid gap-px sm:grid-cols-2">
          {included.map((item) => (
            <div
              key={item.title}
              className="rounded-md border border-transparent bg-surface-alt p-8"
            >
              <h3 className="text-h4">{item.title}</h3>
              <p className="mt-3 max-w-[48ch] text-small text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <LevelRewardBanner variant="inline" />
        </div>
      </Section>

      <AnnouncementBand />

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Compare" heading="What each plan changes" />
        <div className="mt-12">
          <PlanComparison />
        </div>

        <Callout tone="info" className="mt-12" title="Before you pay">
          <p>
            The referral programme is a real part of what you are buying, and it
            is also the part most likely to be oversold. We publish what members
            actually earned, including the ones who earned nothing, in the{" "}
            <Link href="/legal/income-disclosure">income disclosure</Link>. Read
            that before you decide, and read the{" "}
            <Link href="/referrals">referral terms and rates</Link> if you want
            the detail.
          </p>
        </Callout>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          align="center"
          eyebrow="Questions"
          heading="Pricing questions"
          className="mx-auto"
        />
        <div className="mt-12">
          <Faq items={pricingFaqs} />
        </div>
      </Section>
    </>
  );
}
