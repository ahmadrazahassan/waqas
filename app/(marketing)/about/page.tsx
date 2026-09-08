import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Artwork } from "@/components/ui/artwork";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { offices, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Assignwork is a UK company running a referral led work platform. Here is what we are building and the rules we hold ourselves to.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Every number we publish is real",
    body: "No invented member counts, no rounded up payout totals, no screenshots of a top earner presented as typical. If we do not have the data yet, the section does not ship. You will notice several places on this site where that is exactly what happened.",
  },
  {
    title: "Commission comes out of real revenue",
    body: "We pay a share of what members actually pay us for a service they actually receive, after processing fees and VAT. Not a joining fee, not a recruitment bonus. That distinction is what separates a referral programme from a pyramid scheme, and it is written into the database rather than the terms page.",
  },
  {
    title: "You cannot buy your way up",
    body: "Ranks come from completed work and review scores. Leaderboard points come from what the person you referred bought, not what you bought. There is no plan that lets you skip the work.",
  },
  {
    title: "Nothing is decided by chance",
    body: "No draws, no lotteries, no spin to win. Prizes go to the top of a published points table and the archived board stays online so any result can be checked after the fact.",
  },
  {
    title: "The awkward answers go on the page",
    body: "Most members earn very little at first, some earn nothing, and referral commission gets reversed when someone refunds. All of that is on the pricing and referrals pages rather than buried in clause 14.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHeader
        artwork="business-discussion-photo"
        eyebrow="About"
        heading="A UK company building something that has to stay legitimate"
        lead="Referral programmes have a reputation, most of it earned. We are building one anyway, because paying people properly for bringing good members in is reasonable. The difference is in the constraints we accepted before writing any code."
      />

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="max-w-[68ch]">
          <h2 className="text-h2">Why this exists</h2>
          <p className="mt-6 text-lead text-muted">
            Good freelancers spend half their week looking for work instead of
            doing it, and the people who bring capable members onto a platform
            almost never see anything for it.
          </p>
          <p className="mt-5 text-body text-muted">
            Assignwork posts paid tasks every weekday so members can claim work
            rather than chase it, and pays commission to whoever introduced
            them, three levels deep. Tasks fund the platform. Referrals are how
            most members eventually earn the rest. Both halves need the other to
            work, which is why commission eligibility requires recent completed
            work rather than recruitment alone.
          </p>
        </div>
        <Artwork name="business-strategy" />
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          eyebrow="Principles"
          heading="The constraints we accepted first"
          lead="These are not values on a wall. Each one is enforced somewhere in the product, and the spec says where."
        />

        <ol className="mt-12 border-t border-line">
          {principles.map((principle, i) => (
            <li
              key={principle.title}
              className="grid gap-3 border-b border-line py-8 lg:grid-cols-12 lg:gap-8"
            >
              <span className="text-micro text-muted tabular lg:col-span-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-h4 lg:col-span-4">{principle.title}</h3>
              <p className="max-w-[62ch] text-body text-muted lg:col-span-7">
                {principle.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Where we are" heading="Offices" />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:max-w-2xl">
          {offices.map((office) => (
            <address key={office.city} className="not-italic">
              <p className="text-h4">{office.city}</p>
              {office.lines.map((line) => (
                <p key={line} className="text-body text-muted">
                  {line}
                </p>
              ))}
              <p className="text-body text-muted tabular">{office.phone}</p>
            </address>
          ))}
        </div>

        <Callout tone="info" className="mt-12" title="Company details">
          <p>
            {site.legalName} is being incorporated in England and Wales.
            Registration number, registered office and VAT number will be
            published here and in the footer before the platform takes its first
            payment.
          </p>
        </Callout>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/careers" size="lg" arrow>
            Work with us
          </ButtonLink>
          <ButtonLink href="/contact" variant="tertiary" size="lg">
            Get in touch
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
