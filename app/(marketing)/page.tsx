import type { Metadata } from "next";
import {
  faqs,
  hero,
  heroProof,
  imageBand,
  leaderboardTeaser,
  referralSteps,
  services,
  splitStats,
  statement,
  statsAreReal,
} from "@/lib/content";
import { ButtonLink } from "@/components/ui/button";
import {
  Container,
  DevPlaceholder,
  Eyebrow,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import { Media } from "@/components/ui/media";
import { Artwork } from "@/components/ui/artwork";
import { PrizeGallery } from "@/components/marketing/prize-gallery";
import { Reveal } from "@/components/ui/reveal";
import { ServiceCard } from "@/components/marketing/service-card";
import { Faq } from "@/components/marketing/faq";
import { RankRail } from "@/components/marketing/rank-rail";
import { LevelRewardBanner } from "@/components/marketing/level-reward-banner";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import {
  ArcField,
} from "@/components/marketing/illustrations";

export const metadata: Metadata = {
  title: "Paid tasks and three level referral commission",
  description: hero.lead,
  alternates: { canonical: "/" },
};

const illustrations = {
  tasks: <Artwork name="paid-tasks" />,
  referrals: <Artwork name="referral-network" />,
  ranks: <Artwork name="rank-progress" />,
  prizes: <Artwork name="prize-achievement" />,
} as const;

export default function HomePage() {
  return (
    <>
      {/* ---- 1. Hero ------------------------------------------------------ */}
      <Media
        src={hero.image}
        preload
        className="flex min-h-[82dvh] flex-col justify-end"
        position="center 40%"
      >
        <Container className="flex flex-1 flex-col justify-center pt-20 pb-14 text-center">
          <Reveal priority className="flex flex-col items-center">
            {/* ch resolves against this element's own font size, so the measure
                has to live on the heading, never on a wrapper div. */}
            <h1 className="max-w-[22ch] text-display text-white">
              {hero.heading}
            </h1>
          </Reveal>

          <Reveal priority delay={1} className="mt-7 flex flex-col items-center">
            <p className="max-w-[58ch] text-lead text-white/90">{hero.lead}</p>
          </Reveal>

          <Reveal
            priority
            delay={2}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <ButtonLink href={hero.primaryCta.href} size="lg" arrow>
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={hero.secondaryCta.href}
              variant="inverse"
              size="lg"
            >
              {hero.secondaryCta.label}
            </ButtonLink>
          </Reveal>
        </Container>

        <Container className="pb-12">
          <DevPlaceholder active={!statsAreReal} label="real numbers required">
            <dl className="grid grid-cols-1 gap-6 border-t border-white/20 pt-6 sm:grid-cols-3">
              {heroProof.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline gap-3 sm:flex-col sm:gap-1"
                >
                  <dd className="text-h4 text-white tabular">{stat.value}</dd>
                  <dt className="text-micro uppercase tracking-[0.08em] text-white/60">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </DevPlaceholder>
        </Container>
      </Media>

      {/* Editorial introduction */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Reveal className="max-w-[720px]">
          <Eyebrow>{statement.eyebrow}</Eyebrow>
          <p className="mt-6 text-h2">{statement.body}</p>
          <div className="mt-10">
            <ButtonLink
              href={statement.cta.href}
              variant="secondary"
              size="lg"
              arrow
            >
              {statement.cta.label}
            </ButtonLink>
          </div>
        </Reveal>
        <Artwork name="business-discussion-photo" />
        </div>
      </Section>

      {/* ---- 3. How the referral works ------------------------------------
          Third on the page, because it is the product. */}
      <Section bleed className="bg-ink">
        <Container className="py-18 lg:py-28 xl:py-40">
          <SectionHeader
            tone="dark"
            eyebrow="Referral programme"
            heading="40% on everyone you bring in, three levels deep"
            lead="You take 40% of what someone pays for their account, whatever plan you are on. Then smaller shares on the people they bring, and one level beyond that. It stops at three. There is no fourth tier we have not told you about."
          />

          <ol className="mt-16 grid gap-px lg:grid-cols-3">
            {referralSteps.map((step, i) => (
              <Reveal
                as="li"
                key={step.depth}
                delay={i}
                className="border-s border-line-dark ps-8 lg:border-s-0 lg:border-t lg:ps-0 lg:pt-10 lg:pe-10"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-micro uppercase tracking-[0.08em] text-white/60 tabular">
                    Level {step.depth}
                  </span>
                </div>
                <p className="mt-6 text-display leading-none text-lime tabular">
                  {step.rate}
                </p>
                <h3 className="mt-6 text-h4 text-white">{step.title}</h3>
                <p className="mt-3 max-w-[38ch] text-small text-white/60">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </ol>

          <p className="mt-14 max-w-[68ch] text-small text-white/60">
            Level 1 is 40% on every plan. Levels 2 and 3 are shown at the Pro
            rate and vary a little by plan. Commission is calculated on what we
            keep after payment processing, not on the sticker price, and it is
            held for three days before it becomes yours to withdraw.
          </p>
        </Container>
      </Section>

      {/* ---- 4. What we do ------------------------------------------------ */}
      <Section>
        <SectionHeader eyebrow="Our services" heading="What we do" />

        <div className="mt-12 grid gap-px sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, i) => (
            <Reveal key={service.key} delay={i}>
              <ServiceCard
                title={service.title}
                body={service.body}
                illustration={illustrations[service.key]}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <AnnouncementBand />

      {/* ---- 5. Split panel ----------------------------------------------- */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden bg-lime">
          <ArcField className="absolute inset-0 h-full w-full text-ink/25" />
          <div className="relative flex h-full flex-col justify-end p-8 lg:p-14">
            <Eyebrow className="self-start border border-ink bg-transparent">
              Where the money comes from
            </Eyebrow>
            <p className="mt-6 max-w-[30ch] text-h3 text-ink">
              Tasks fund the platform. Referrals are how most members earn the
              rest.
            </p>
          </div>
        </div>

        <DevPlaceholder active={!statsAreReal} label="real numbers required">
          <div className="grid h-full min-h-[420px] grid-cols-1 bg-ink sm:grid-cols-2">
            {splitStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-end border-line-dark p-8 not-first:border-t sm:not-first:border-t-0 sm:not-first:border-s lg:p-14"
              >
                <p className="text-display leading-none text-lime tabular">
                  {stat.value}
                </p>
                <p className="mt-5 max-w-[24ch] text-micro uppercase tracking-[0.08em] text-white/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </DevPlaceholder>
      </section>

      {/* ---- 6. Leaderboard ----------------------------------------------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow={leaderboardTeaser.eyebrow}
              heading={leaderboardTeaser.heading}
              lead={leaderboardTeaser.body}
            />
            <div className="mt-9">
              <ButtonLink href="/leaderboard" variant="tertiary" size="lg" arrow>
                See the current standings
              </ButtonLink>
            </div>
          </div>

          <Reveal className="lg:col-span-7">
            <dl className="border-t border-line">
              {leaderboardTeaser.formula.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-5"
                >
                  <dt className="text-body">{row.label}</dt>
                  <dd className="text-h4 tabular">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[58ch] text-small text-muted">
              {leaderboardTeaser.note}
            </p>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Prizes" heading="A little further from the everyday"
          lead="Explore the travel and equipment planned for upcoming seasons. Full prize details will be confirmed before a season opens." />
        <PrizeGallery compact />
        <div className="mt-8"><ButtonLink href="/prizes" variant="tertiary" arrow>Explore the prizes</ButtonLink></div>
      </Section>

      {/* ---- 7. Image band ------------------------------------------------ */}
      <Media
        src={imageBand.image}
        className="flex min-h-[520px] items-center"
        position="center 35%"
      >
        <Container className="py-20 text-center">
          <Reveal priority className="flex flex-col items-center">
            <h2 className="max-w-[24ch] text-h1 text-white">
              {imageBand.heading}
            </h2>
            <div className="mt-9">
              <ButtonLink
                href={imageBand.cta.href}
                variant="inverse"
                size="lg"
                arrow
              >
                {imageBand.cta.label}
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </Media>

      {/* ---- 8. Ranks ------------------------------------------------------ */}
      <Section id="ranks">
        <SectionHeader
          eyebrow="Progression"
          heading="Six levels, earned on who you bring in"
          lead="Levels cannot be bought. Each one is earned on direct referrals who actually paid for their account. Reach the top two and we pay you every month on top of your commission."
        />
        <div className="mt-12">
          <RankRail />
        </div>
      </Section>

      <LevelRewardBanner />

      {/* ---- 9. FAQ -------------------------------------------------------- */}
      <Section className="border-t border-line">
        <SectionHeader
          align="center"
          eyebrow="Questions"
          heading="The things people actually ask"
          className="mx-auto"
        />
        <div className="mt-12">
          <Faq items={faqs} />
        </div>
      </Section>

      {/*
        Two sections from the spec are deliberately absent until their data
        exists, rather than being filled with invented content:

          - "Tasks open right now" renders live rows from the database. It
            does not render at all when the pool is empty.
          - The guides teaser needs published guides.

        Both arrive with phases 7 and 13.
      */}
    </>
  );
}
