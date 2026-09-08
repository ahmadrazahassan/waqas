import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader, Badge } from "@/components/ui/primitives";
import { Callout, EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { Flag } from "@/components/ui/flag";
import { TRACK_FLAG } from "@/lib/countries";
import {
  liveSeason,
  pointsFormula,
  pointsRules,
  tracks,
} from "@/lib/prizes";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Referrals earn points on a published formula. The standings are public throughout the season and stay online afterwards. No draw, no luck, no random element.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader
        artwork="leaderboard"
        eyebrow="Leaderboard"
        heading="A published table, not a prize draw"
        lead="Every referral earns points on a formula anyone can read. The standings are public while the season runs and stay online after it closes, so a win can always be checked afterwards."
      >
        <Badge tone="ink">No random element anywhere in this</Badge>
      </PageHeader>

      {/* Standings */}
      <Section>
        <SectionHeader eyebrow="Standings" heading="Current season" />

        <div className="mt-12">
          {liveSeason ? null : (
            <EmptyState
              heading="No season is running yet"
              body="The first season opens when the platform launches. When it does, the full standings appear here and update every five minutes, with a timestamp so you can see how fresh they are. We would rather show you nothing than a table of invented names."
              action={{ label: "See how points are earned", href: "/prizes" }}
            />
          )}
        </div>

        <div className="mt-12 grid gap-px sm:grid-cols-3">
          {tracks.map((track) => (
            <div
              key={track.value}
              className="rounded-md border border-line bg-surface p-7"
            >
              <div className="flex items-center gap-3">
                <Flag code={TRACK_FLAG[track.value]} size={28} />
                <h3 className="text-h4">{track.label}</h3>
              </div>
              <p className="mt-3 text-small text-muted">{track.blurb}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-[70ch] text-small text-muted">
          Three tracks run in parallel, each with its own board and its own
          prizes. Eligibility follows your verified country of residence. A
          quarterly season carries the headline prizes and a monthly board runs
          inside it, so a member who joins in week six still has something
          reachable rather than a table they cannot catch.
        </p>
      </Section>

      {/* Points */}
      <Section className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="Points"
              heading="The whole formula, in public"
              lead="This is published before a season opens and cannot be changed once the first point is earned. Changing it would mean closing the season and opening a new one."
            />
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

            <div className="mt-10 space-y-7">
              {pointsRules.map((rule) => (
                <div key={rule.title}>
                  <h3 className="text-h4">{rule.title}</h3>
                  <p className="mt-2 max-w-[62ch] text-small text-muted">
                    {rule.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* How a season ends */}
      <Section bleed className="bg-ink">
        <div className="container-site py-18 lg:py-28 xl:py-40">
          <SectionHeader
            tone="dark"
            eyebrow="Settlement"
            heading="How a season actually ends"
          />

          <ol className="mt-14 grid gap-px lg:grid-cols-4">
            {[
              {
                n: "01",
                t: "The board locks",
                b: "At the closing date, no further points attach to that season.",
              },
              {
                n: "02",
                t: "Seven day settlement",
                b: "Refunds, chargebacks and fraud reviews remove points. Paying a prize on a referral that charges back a week later is money we never get back.",
              },
              {
                n: "03",
                t: "Final standings",
                b: "Ties break on whoever reached the total first. Deterministic, checkable, no randomness.",
              },
              {
                n: "04",
                t: "Published permanently",
                b: "The archived board stays online with final positions, points and the rules in force at the time.",
              },
            ].map((s) => (
              <li key={s.n} className="border-t border-line-dark pt-7 lg:pe-8">
                <span className="text-micro text-white/60 tabular">{s.n}</span>
                <h3 className="mt-4 text-h4 text-white">{s.t}</h3>
                <p className="mt-3 text-small text-white/60">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Callout title="Why we do not run a prize draw">
          <p>
            A draw would mean paying out on luck, and under the Gambling Act
            2005 a draw you pay to enter is a lottery that needs a licence.
            Awarding prizes on published performance avoids that entirely and,
            more importantly, means the people who did the most work win. If you
            ever see a random element appear on this page, something has gone
            wrong.
          </p>
        </Callout>

        <div className="mt-10">
          <ButtonLink href="/prizes" size="lg" arrow>
            See what is on the table
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
