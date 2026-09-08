import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader, Badge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";
import { Artwork } from "@/components/ui/artwork";

const trackArtwork = ["profile-setup", "work-review", "referral-network", "rank-progress", "wallet-security"];

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Learning tracks covering the task types we post, how the referral programme works, and how to get paid properly.",
  alternates: { canonical: "/guides" },
};

const tracks = [
  {
    name: "Getting started",
    chapters: 6,
    body: "Setting up your profile, reading a task brief properly, what reviewers actually look for, and clearing your first payout.",
  },
  {
    name: "Doing the work well",
    chapters: 9,
    body: "Writing to a brief, structuring a research summary, editing against a style guide, and the transcription conventions we use.",
  },
  {
    name: "The referral programme",
    chapters: 5,
    body: "How attribution works, what unlocks each level, reading your commission ledger, and why a commission gets reversed.",
  },
  {
    name: "Climbing the ranks",
    chapters: 4,
    body: "What each rank requires, how the review score is calculated, and how the demotion grace period works.",
  },
  {
    name: "Getting paid",
    chapters: 5,
    body: "Payout thresholds, identity verification, self billing invoices, and the PKR corridor including the fees.",
  },
] as const;

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        artwork="learning-guides"
        eyebrow="Guides"
        heading="How to actually do well here"
        lead="Five tracks covering the work itself, the referral programme and getting paid. Written by the people who review submissions, so it reflects what reviewers really mark against."
      />

      <Section>
        <EmptyState
          heading="The first guides publish at launch"
          body="Rather than list empty chapter titles, here is the plan below. Every track will be free to read without an account, because deciding whether this suits you should not require paying first."
          action={{ label: "See how it works instead", href: "/how-it-works" }}
        />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Planned" heading="What the tracks will cover" />

        <ol className="mt-12 border-t border-line">
          {tracks.map((track, i) => (
            <li
              key={track.name}
              className="grid gap-3 border-b border-line py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8"
            >
              <span className="text-micro text-muted tabular lg:col-span-1">
                <Artwork name={trackArtwork[i] ?? "learning-guides"} className="w-28 lg:w-full" />
              </span>
              <h3 className="text-h4 lg:col-span-4">{track.name}</h3>
              <p className="max-w-[60ch] text-small text-muted lg:col-span-6">
                {track.body}
              </p>
              <div className="lg:col-span-1 lg:justify-self-end">
                <Badge tone="outline">{track.chapters} chapters</Badge>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
