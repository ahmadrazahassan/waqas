import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader, Badge } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { prizeTables, prizeTerms, tracks } from "@/lib/prizes";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import { Flag } from "@/components/ui/flag";
import { TRACK_FLAG } from "@/lib/countries";
import { PrizeGallery } from "@/components/marketing/prize-gallery";
import { Artwork } from "@/components/ui/artwork";

export const metadata: Metadata = {
  title: "Prizes",
  description:
    "What each season awards, on every track. Prizes go to the top of a published points table, decided on performance rather than chance.",
  alternates: { canonical: "/prizes" },
};

export default function PrizesPage() {
  return (
    <>
      <PageHeader
        artwork="prize-achievement"
        eyebrow="Prizes"
        heading="What each season puts on the table"
        lead="Three tracks run in parallel and each awards its own prizes. Every one goes to the top of a published points table. Nothing here is decided by chance."
      >
        <ButtonLink href="/leaderboard" variant="tertiary" size="lg" arrow>
          See how points are earned
        </ButtonLink>
      </PageHeader>

      <Section>
        <SectionHeader eyebrow="Explore" heading="Journeys worth looking forward to" />
        <PrizeGallery />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Northern Pakistan" heading="Beyond the familiar"
          lead="A glimpse of the landscapes of Hunza and Skardu. These destinations are inspiration, with confirmed routes published in the season itinerary." />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <figure><Artwork name="hunza-valley" alt="Generated landscape inspired by the Hunza Valley and Karakoram mountains" /><figcaption className="mt-4 text-h4">Hunza Valley</figcaption></figure>
          <figure><Artwork name="skardu-lake" alt="Generated landscape inspired by Upper Kachura Lake in Skardu" /><figcaption className="mt-4 text-h4">Skardu</figcaption></figure>
        </div>
      </Section>

      <AnnouncementBand />

      {tracks.map((track) => (
        <Section key={track.value} className="border-t border-line">
          <div className="mb-6 flex items-center gap-3">
            <Flag code={TRACK_FLAG[track.value]} size={36} />
            <span className="text-micro uppercase tracking-[0.08em] text-muted">
              {track.label}
            </span>
          </div>

          <SectionHeader
            heading={
              track.value === "pk"
                ? "Pakistan track"
                : `${track.label} track`
            }
            lead={track.blurb}
          />

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <caption className="sr-only">
                Quarterly prize table for the {track.label} track
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-24 py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                    Position
                  </th>
                  <th scope="col" className="py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                    Prize
                  </th>
                  <th scope="col" className="w-40 py-4 text-start text-micro uppercase tracking-[0.08em] text-muted">
                    Cash alternative
                  </th>
                </tr>
              </thead>
              <tbody>
                {prizeTables[track.value].map((row) => (
                  <tr key={row.positions} className="border-b border-line">
                    <th scope="row" className="py-5 text-start text-small font-medium tabular">
                      {row.positions}
                    </th>
                    <td className="py-5 pe-6 text-small">{row.prize}</td>
                    <td className="py-5 text-small text-muted">
                      {row.cashAlternative ? "Yes" : "Not applicable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {track.value === "pk" ? (
            <div className="mt-8">
              <ButtonLink href="/prizes/umrah" size="lg" arrow>
                About the Umrah package
              </ButtonLink>
            </div>
          ) : null}
        </Section>
      ))}

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Terms" heading="How prizes are actually handled" />
        <ul className="mt-10 max-w-[76ch] border-t border-line">
          {prizeTerms.map((term) => (
            <li key={term} className="border-b border-line py-5 text-body text-muted">
              {term}
            </li>
          ))}
        </ul>

        <Callout tone="warning" className="mt-10" title="Prize values are not published yet">
          <p>
            No season has opened, and we will not announce a prize before it is
            costed and a supplier is contracted. When a season opens, the exact
            package, what it includes, what it does not, and the cash
            alternative value all appear here first. Full rules will sit at{" "}
            <Link href="/legal/competition-rules">competition rules</Link>.
          </p>
        </Callout>

        <div className="mt-10">
          <Badge tone="ink">Decided on points, never on chance</Badge>
        </div>
      </Section>
    </>
  );
}
