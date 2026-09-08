import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Callout } from "@/components/ui/states";
import { RankRail } from "@/components/marketing/rank-rail";
import { LevelRewardBanner } from "@/components/marketing/level-reward-banner";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import { Artwork } from "@/components/ui/artwork";

const stageArtwork = ["profile-setup", "paid-tasks", "team-collaboration", "work-review", "payment-transfer", "referral-network"];

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Claim a task, submit it, get reviewed, get paid into your wallet. Then earn commission on the members you introduce. Here is the whole thing end to end.",
  alternates: { canonical: "/how-it-works" },
};

const stages = [
  {
    n: "01",
    title: "Join and pick a plan",
    body: "Plans start at 5,000 PKR, paid once. There is no monthly fee and no renewal. Your plan sets how many tasks you can claim and the two deeper referral levels. The 40% you earn on the people you bring in is the same on every plan. You have 24 hours from confirmation to change your mind and get your money back.",
  },
  {
    n: "02",
    title: "Claim work that matches your level",
    body: "We post tasks every weekday. Writing, research summaries, editing, data cleaning, transcription, translation, image tagging. Each one shows the payment, the deadline and the minimum level before you claim it. Nothing is hidden until after you commit.",
  },
  {
    n: "03",
    title: "Submit it",
    body: "Upload your work through the dashboard. You get a countdown to the deadline and you can submit revisions up to the cutoff. Everything is versioned, so a reviewer can see what changed.",
  },
  {
    n: "04",
    title: "Get reviewed against a published rubric",
    body: "A reviewer scores your submission on criteria you can read before you start. You see the score for every line and the written feedback, not just a pass or fail. If it needs changes you get one revision round.",
  },
  {
    n: "05",
    title: "Get paid into your wallet",
    body: "On approval the payment lands in your wallet immediately. Once you are above your plan's payout threshold you can request it out. Starter is 3,000 PKR, Elite is 1,000 PKR.",
  },
  {
    n: "06",
    title: "Bring people with you",
    body: "Share your referral link. When someone you introduced pays for their account, you take 40% of it, plus smaller shares two and three levels down. It is paid once per member, on the payment that opened their account.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        artwork="team-collaboration"
        eyebrow="How it works"
        heading="Claim work, get reviewed, get paid, bring people with you"
        lead="Six stages, start to finish. No part of this is hidden behind a signup wall, because you should be able to work out whether it suits you before you spend anything."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg" arrow>
            Get started
          </ButtonLink>
          <ButtonLink href="/tasks" variant="tertiary" size="lg">
            Look at open tasks first
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Sticky index */}
          <nav
            aria-label="Stages"
            className="hidden lg:col-span-3 lg:block"
          >
            <ol className="sticky top-28 space-y-3">
              {stages.map((stage) => (
                <li key={stage.n}>
                  <a
                    href={`#stage-${stage.n}`}
                    className="flex gap-3 text-small text-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                  >
                    <span className="tabular">{stage.n}</span>
                    <span>{stage.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <ol className="lg:col-span-9">
            {stages.map((stage, index) => (
              <li
                key={stage.n}
                id={`stage-${stage.n}`}
                className="scroll-mt-28 border-b border-line py-10 first:pt-0"
              >
                <Artwork name={stageArtwork[index] ?? "paid-tasks"} className="mb-8 max-w-[520px]" />
                <span className="text-micro text-muted tabular">{stage.n}</span>
                <h2 className="mt-3 text-h3">{stage.title}</h2>
                <p className="mt-4 max-w-[64ch] text-body text-muted">
                  {stage.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section id="ranks" className="border-t border-line">
        <SectionHeader
          eyebrow="Progression"
          heading="Six levels, earned on who you bring in"
          lead="Levels are not for sale. Each one is earned on direct referrals who actually paid, so an unpaid signup moves nobody up. The top two carry a monthly reward we pay you. Levels can go down as well as up."
        />
        <div className="mt-12">
          <RankRail />
        </div>
      </Section>

      <LevelRewardBanner />

      <AnnouncementBand />

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Getting paid" heading="Where the money comes from" />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Callout title="Task payments">
            <p>
              Paid on approval, straight into your wallet. The amount is fixed
              and shown on the task before you claim it, so there is never a
              negotiation after the work is done.
            </p>
          </Callout>
          <Callout title="Referral commission">
            <p>
              40% on everyone you bring in, flat on every plan. Held for three
              days, then available to withdraw. Levels 2 and 3 sit underneath
              and are multiplied by your level.
            </p>
          </Callout>
          <Callout title="Leaderboard prizes">
            <p>
              Awarded on published points at the end of each season. No draw and
              no random element, so the result is checkable by anyone.
            </p>
          </Callout>
        </div>
      </Section>
    </>
  );
}
