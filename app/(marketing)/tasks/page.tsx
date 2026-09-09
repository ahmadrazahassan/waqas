import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeader, Badge } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { TaskLibrary } from "@/components/marketing/task-library";

export const metadata: Metadata = {
  title: "Tasks",
  description:
    "Paid tasks posted every weekday. Writing, research, editing, data work, transcription and translation. Payment and deadline are shown before you claim.",
  alternates: { canonical: "/tasks" },
};

const categories = [
  {
    name: "Writing",
    body: "Articles, product descriptions, email sequences and landing page copy for business clients.",
  },
  {
    name: "Research summaries",
    body: "Reading a set of sources and producing a structured brief. Referenced, not invented.",
  },
  {
    name: "Editing and proofreading",
    body: "Line editing and proofreading against a style guide. Tracked changes, with a note on what you altered.",
  },
  {
    name: "Data entry and cleaning",
    body: "Structuring messy spreadsheets, deduplicating records, categorising and tagging.",
  },
  {
    name: "Transcription",
    body: "Audio and video to text, timestamped, with speaker labels where the brief asks for them.",
  },
  {
    name: "Translation and localisation",
    body: "English to Urdu and back, plus other pairs when a client needs them.",
  },
] as const;

export default function TasksPage() {
  return (
    <>
      <PageHeader
        artwork="focused-work-photo"
        eyebrow="Tasks"
        heading="Paid work, posted every weekday"
        lead="Every task shows the payment, the deadline and the minimum rank before you claim it. You will never find out what a piece pays after you have done it."
      >
        <Badge tone="ink">Posted by Assignwork, not by third party clients</Badge>
      </PageHeader>

      <Section>
        <SectionHeader eyebrow="Task library" heading="Know the work before you start" lead="Explore 19 complete briefs: original practice assignments, content writing and authorised ad feedback. These previews are awaiting publication. Claimable work and final PKR rewards appear in your dashboard." />
        <TaskLibrary />
      </Section>

      <Section className="border-t border-line">
        <SectionHeader
          eyebrow="Categories"
          heading="The kinds of work we post"
          lead="Commercial work for businesses and publishers, plus clearly labelled tutoring that produces guidance rather than submittable coursework."
        />

        <div className="mt-12 grid gap-px sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="rounded-md border border-transparent bg-surface-alt p-7 transition-colors duration-200 hover:border-ink"
            >
              <h3 className="text-h4">{category.name}</h3>
              <p className="mt-3 text-small text-muted">{category.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line">
        <Callout title="What we will not post">
          <p>
            We do not post academic work for a student to submit as their own,
            and we never will. In England, providing or arranging that is a
            criminal offence under the Skills and Post-16 Education Act 2022,
            and advertising it is too. Any task flagged as coursework for
            submission is blocked from publication at the database level, so it
            cannot go live even by mistake. Tutoring tasks are labelled as such
            and produce guidance, feedback and worked explanations, never a
            finished piece for someone to hand in.
          </p>
        </Callout>
      </Section>
    </>
  );
}
