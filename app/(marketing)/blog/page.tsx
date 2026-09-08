import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "What we paid out, what changed on the platform, and what we got wrong. Published monthly.",
  alternates: { canonical: "/blog" },
};

const planned = [
  {
    title: "Monthly payout report",
    body: "How much went out in task payments and commission, how many members earned nothing, and the median. Published whether the numbers flatter us or not.",
  },
  {
    title: "Product changes",
    body: "What shipped, what broke, and what we reverted. Including the reasoning, so members can argue with it.",
  },
  {
    title: "How reviewers score",
    body: "Worked examples of submissions that scored well and badly, with the rubric alongside them and the names removed.",
  },
  {
    title: "Season results",
    body: "Final standings after each season settles, how many points the top of each board took, and what the prize actually cost us.",
  },
] as const;

export default function BlogPage() {
  return (
    <>
      <PageHeader
        artwork="editorial-desk-photo"
        eyebrow="Blog"
        heading="What we paid out and what we changed"
        lead="Monthly, factual, and including the parts that do not flatter us. If a month goes badly it still gets published."
      />

      <Section>
        <EmptyState
          heading="Nothing published yet"
          body="The first post is the launch payout report, which needs a month of real payouts behind it before it means anything. Subscribe from the footer and it will reach you when it lands."
          action={{ label: "Read the guides plan", href: "/guides" }}
        />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="Planned" heading="What gets published here" />
        <ol className="mt-12 border-t border-line">
          {planned.map((item) => (
            <li
              key={item.title}
              className="grid gap-3 border-b border-line py-7 lg:grid-cols-12 lg:gap-8"
            >
              <h3 className="text-h4 lg:col-span-4">{item.title}</h3>
              <p className="max-w-[64ch] text-small text-muted lg:col-span-8">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
