import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/states";
import { offices, site } from "@/lib/site";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Assignwork team. Support hours are shown in both GMT and PKT.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        artwork="quiet-workspace-photo"
        eyebrow="Contact"
        heading="Talk to someone who works here"
        lead="Support is a small team rather than a queue of scripts. If you ask something we cannot answer yet, we will say so rather than guess."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <div className="lg:col-span-5">
            <h2 className="text-h4">Support hours</h2>
            <dl className="mt-4 border-t border-line">
              <div className="flex justify-between gap-6 border-b border-line py-4">
                <dt className="text-small text-muted">Monday to Friday</dt>
                <dd className="text-small tabular">09:00 to 18:00 GMT</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line py-4">
                <dt className="text-small text-muted">Same hours in PKT</dt>
                <dd className="text-small tabular">14:00 to 23:00 PKT</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line py-4">
                <dt className="text-small text-muted">Email</dt>
                <dd className="text-small">
                  <a
                    href={`mailto:${site.email}`}
                    className="text-violet underline underline-offset-2"
                  >
                    {site.email}
                  </a>
                </dd>
              </div>
            </dl>

            <h2 className="mt-12 text-h4">Offices</h2>
            <div className="mt-4 space-y-6">
              {offices.map((office) => (
                <address key={office.city} className="not-italic">
                  <p className="text-small font-semibold">{office.city}</p>
                  {office.lines.map((line) => (
                    <p key={line} className="text-small text-muted">
                      {line}
                    </p>
                  ))}
                  <p className="text-small text-muted tabular">{office.phone}</p>
                </address>
              ))}
            </div>

            <Callout tone="info" className="mt-10" title="Already a member?">
              <p>
                Raise it from your dashboard instead. A ticket opened there
                arrives with your account attached, so nobody has to ask you to
                confirm who you are first.
              </p>
            </Callout>
          </div>
        </div>
      </Section>
    </>
  );
}
