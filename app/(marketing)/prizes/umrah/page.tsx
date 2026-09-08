import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, SectionHeader, Eyebrow } from "@/components/ui/primitives";
import { Media } from "@/components/ui/media";
import { Artwork } from "@/components/ui/artwork";
import { Reveal } from "@/components/ui/reveal";
import { Callout } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { Faq } from "@/components/marketing/faq";
import { pointsFormula } from "@/lib/prizes";
import { Flag } from "@/components/ui/flag";

export const metadata: Metadata = {
  title: "Umrah season",
  description:
    "The top of the Pakistan leaderboard each quarter receives an Umrah package for two. Awarded on published points, not on a draw.",
  alternates: { canonical: "/prizes/umrah" },
};

const includes = [
  "Return flights for two from Karachi, Lahore or Islamabad",
  "Umrah visa processing for both travellers",
  "Hotel accommodation in Makkah and Madinah",
  "Airport and intercity transfers",
  "Ziyarat transport in both cities",
] as const;

const excludes = [
  "Passport issue or renewal",
  "Vaccinations and any medical requirements",
  "Meals beyond those stated in the hotel booking",
  "Personal spending and shopping",
  "Travel insurance",
] as const;

const umrahFaqs = [
  {
    q: "How is the winner decided?",
    a: "By points, and only by points. Whoever finishes first on the Pakistan board at the end of the quarter receives the package. The standings are public throughout the season, so you can see exactly where you stand before it closes. There is no draw and no random element.",
  },
  {
    q: "What if I cannot travel?",
    a: "There is a cash alternative at a published value and you are free to take it. Nobody has to accept a trip they cannot make, and choosing the cash does not affect your standing or anything else on the platform.",
  },
  {
    q: "Can I give the second place to a family member?",
    a: "Yes. The second traveller is yours to nominate and does not need to be an Assignwork member. They will need a valid passport and to meet the same visa requirements.",
  },
  {
    q: "Who arranges the travel?",
    a: "A licensed third party travel operator, contracted before the season opens. Assignwork does not sell travel and does not hold money for it. The operator's name and licence details are published with the season rules.",
  },
  {
    q: "When would I travel?",
    a: "Dates are agreed with the operator after the season settles and your identity is verified. There is a booking window rather than a fixed date, so it can work around your commitments within reason.",
  },
  {
    q: "Do I have to let you use my name?",
    a: "No. We publish a winner's name or photograph only with written consent. Decline and you appear on the archived board as a member number, and you still receive the prize exactly the same.",
  },
] as const;

export default function UmrahPage() {
  return (
    <>
      <Media
        src="/images/assignwork/umrah-makkah.webp"
        preload
        className="flex min-h-[62dvh] items-end"
        position="center 45%"
      >
        <Container className="py-16 lg:py-20">
          <Reveal priority className="flex flex-col items-start">
            <span className="flex items-center gap-3">
              <Flag code="PK" size={30} />
              <Eyebrow>Pakistan track</Eyebrow>
            </span>
            <h1 className="mt-6 max-w-[20ch] text-h1 text-white">
              An Umrah package for two, each quarter
            </h1>
            <p className="mt-6 max-w-[58ch] text-lead text-white/90">
              It goes to whoever finishes first on the Pakistan leaderboard.
              Decided on published points, settled in public, with the board
              left online afterwards so anyone can check the result.
            </p>
          </Reveal>
        </Container>
      </Media>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Artwork name="umrah-madinah" alt="Generated view of the green dome and minarets of Al Masjid an Nabawi" />
          <div><Eyebrow>Makkah and Madinah</Eyebrow>
            <h2 className="mt-6 text-h2">A journey to share</h2>
            <p className="mt-6 text-body text-muted">Time for reflection, prayer and a journey with someone close to you. The season announcement will include the operator, travel dates and accommodation details.</p>
            <p className="mt-4 text-micro text-muted">AI generated destination imagery. It does not depict a confirmed itinerary or hotel.</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-h3">What the package includes</h2>
            <ul className="mt-6 border-t border-line">
              {includes.map((item) => (
                <li key={item} className="border-b border-line py-4 text-body">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-h3">What it does not include</h2>
            <ul className="mt-6 border-t border-line">
              {excludes.map((item) => (
                <li
                  key={item}
                  className="border-b border-line py-4 text-body text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Callout tone="warning" className="mt-12" title="Season not open yet">
          <p>
            The exact package, the operator and the cash alternative value are
            confirmed and published before a season opens. Nothing is announced
            before it is contracted. Full terms will sit at{" "}
            <Link href="/legal/competition-rules">competition rules</Link>.
          </p>
        </Callout>
      </Section>

      <Section className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="Points"
              heading="How you climb the board"
              lead="Points come from the plan the person you referred buys, never from the plan you bought. A Starter member and a Studio member earn the same points for the same referral."
            />
            <div className="mt-9">
              <ButtonLink href="/signup" size="lg" arrow>
                Get your referral link
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-7">
            <dl className="border-t border-line">
              {pointsFormula.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-5"
                >
                  <dt className="text-body">{row.label}</dt>
                  <dd className="text-h4 tabular">{row.points} points</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[58ch] text-small text-muted">
              A referral still subscribed after 90 days earns you half those
              points again. Approved tasks earn one point each, capped at a
              fifth of your season total.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          align="center"
          eyebrow="Questions"
          heading="About this prize"
          className="mx-auto"
        />
        <div className="mt-12">
          <Faq items={umrahFaqs} />
        </div>
      </Section>
    </>
  );
}
