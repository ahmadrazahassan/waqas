import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Assignwork is a small UK team. Open roles appear here when we have them, and not before.",
  alternates: { canonical: "/careers" },
};

const howWeWork = [
  {
    title: "Small team, wide scope",
    body: "Everyone here touches product decisions, not just their own lane. If that sounds exhausting rather than appealing, this is not the right place.",
  },
  {
    title: "Remote across UK and Pakistan",
    body: "Core overlap hours are 14:00 to 18:00 GMT so both ends of the team get a real working day rather than one side always taking the late call.",
  },
  {
    title: "We write things down",
    body: "Decisions live in written specs with the reasoning attached, so the answer to why is something built this way is a document rather than a person's memory.",
  },
] as const;

export default function CareersPage() {
  return (
    <>
      <PageHeader
        artwork="earning-outlook"
        eyebrow="Careers"
        heading="No open roles right now"
        lead="We would rather say that plainly than keep a page of aspirational listings for jobs that do not exist. When we are hiring, the roles appear here with the salary band written on them."
      />

      <Section>
        <EmptyState
          heading="Nothing open at the moment"
          body="If you think you should be working here anyway, tell us what you would do in your first three months and why. That reads better than a CV, and it goes to a person rather than a filter."
          action={{ label: "Get in touch", href: "/contact" }}
        />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader eyebrow="How we work" heading="What it is like here" />
        <div className="mt-12 grid gap-px sm:grid-cols-3">
          {howWeWork.map((item) => (
            <div
              key={item.title}
              className="rounded-md border border-transparent bg-surface-alt p-7"
            >
              <h3 className="text-h4">{item.title}</h3>
              <p className="mt-3 text-small text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
