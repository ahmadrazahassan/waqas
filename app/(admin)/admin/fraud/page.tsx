import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatTile, Empty, DataTable } from "@/components/app/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Fraud" };

const DETECTORS = [
  "Self referral by matching email, hashed phone or payment fingerprint",
  "More than 3 signups from one hashed IP in 24 hours",
  "More than 8 signups from one device fingerprint, ever",
  "Three or more consecutive members in a chain sharing a device",
  "A payment method fingerprint used across more than 2 accounts",
  "A signup converting within 30 seconds of the referral click",
  "A disposable email domain",
  "Repeated cancellations shortly after commission clears",
];

export default async function FraudPage() {
  const supabase = await createClient();

  const { data: signals } = await supabase
    .from("fraud_signals")
    .select("*, profiles(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const open = (signals ?? []).filter((s) => s.state === "open");
  const high = open.filter((s) => s.severity === "high");

  return (
    <>
      <PageTitle
        title="Fraud signals"
        lead="Flagged commission is held for review rather than cancelled, and the member sees an expected resolution date rather than a silent hold."
      />

      <div className="grid gap-px sm:grid-cols-3">
        <StatTile label="Open signals" value={String(open.length)} />
        <StatTile label="High severity" value={String(high.length)} tone={high.length ? "lime" : "light"} />
        <StatTile label="Total recorded" value={String((signals ?? []).length)} />
      </div>

      <div className="mt-8">
        <DataTable
          rows={signals ?? []}
          keyOf={(s) => s.id}
          empty={
            <Empty
              title="No signals"
              body="Nothing has tripped a detector. This table fills itself as members sign up; the detectors are listed below."
            />
          }
          columns={[
            {
              key: "member",
              header: "Member",
              render: (s) => {
                const p = s.profiles as unknown as { username: string } | null;
                return p ? `@${p.username}` : "Unattached";
              },
            },
            { key: "signal", header: "Signal", render: (s) => s.signal },
            { key: "severity", header: "Severity", render: (s) => s.severity },
            { key: "state", header: "State", render: (s) => s.state },
            { key: "when", header: "Raised", render: (s) => formatDate(s.created_at) },
          ]}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-h4">What is being watched</h2>
        <p className="mt-2 max-w-[70ch] text-small text-muted">
          These detectors are specified and the table is wired. The jobs that
          populate it run as scheduled edge functions, which land with the
          payment provider integration.
        </p>
        <ul className="mt-5 border-t border-line">
          {DETECTORS.map((d) => (
            <li key={d} className="border-b border-line py-3 text-small text-muted">
              {d}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
