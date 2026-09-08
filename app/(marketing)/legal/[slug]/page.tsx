import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { getLegalDoc, legalDocs, legalReviewed, lastUpdated } from "@/lib/legal";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ slug: doc.slug }));
}

// Next 16: params is a Promise and must be awaited.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.summary,
    alternates: { canonical: `/legal/${doc.slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <>
      <PageHeader eyebrow="Legal" heading={doc.title} lead={doc.summary} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Contents */}
          <nav aria-label="Contents" className="lg:col-span-3">
            <p className="text-micro uppercase tracking-[0.08em] text-muted">
              On this page
            </p>
            <ol className="mt-4 space-y-2 lg:sticky lg:top-28">
              {doc.sections.map((section, i) => (
                <li key={section.heading}>
                  <a
                    href={`#s${i}`}
                    className="text-small text-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-micro text-muted">
              Last updated {formatDate(lastUpdated)}
            </p>
          </nav>

          <div className="lg:col-span-9">
            {!legalReviewed ? (
              <Callout
                tone="warning"
                className="mb-10"
                title="Draft, not yet reviewed by a solicitor"
              >
                <p>
                  This document records the commitments the product actually
                  enforces, and it is written to be readable rather than
                  defensive. It has not been through legal review and must be
                  before Assignwork takes a payment. Do not rely on it as a
                  final agreement.
                </p>
              </Callout>
            ) : null}

            {doc.sections.map((section, i) => (
              <section key={section.heading} id={`s${i}`} className="scroll-mt-28 mb-10">
                <h2 className="text-h3">{section.heading}</h2>
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="mt-4 max-w-[68ch] text-body text-muted">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <p className="text-micro uppercase tracking-[0.08em] text-muted">
          Other documents
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {legalDocs
            .filter((d) => d.slug !== doc.slug)
            .map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  className="text-small font-medium underline-offset-4 hover:underline"
                >
                  {d.title}
                </Link>
              </li>
            ))}
        </ul>
      </Section>
    </>
  );
}
