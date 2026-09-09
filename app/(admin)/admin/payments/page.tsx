import type { Metadata } from "next";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { reviewDeadline } from "@/lib/billing";
import { hasServiceRole } from "@/lib/supabase/admin";
import { PageTitle, StatTile, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { DeclarationDecision } from "@/components/admin/declaration-decision";
import { formatMoney, formatDate } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile.status !== "active" || !user.roles.some(r => ["finance", "admin", "owner"].includes(r))) redirect("/admin");
  const supabase = await createClient();

  const [{ data: declarations, count: pendingCount, error: queueError }, { data: payments }, { data: reviewed }] = await Promise.all([
    supabase
      .from("payment_declarations")
      .select("*, profiles(full_name, username, country_code), plans(name)", { count: "exact" })
      .eq("status", "submitted")
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("payments")
      .select("*, profiles(username), plans(name)")
      .order("paid_at", { ascending: false })
      .limit(40),
    supabase.from("payment_declarations").select("id, reference, status, reject_reason, reviewed_at")
      .in("status", ["confirmed", "rejected", "cancelled"]).order("created_at", { ascending: false }).limit(30),
  ]);

  const waiting = (declarations ?? []).filter((d) => d.status === "submitted");
  const waitingValue = waiting.reduce((s, d) => s + d.amount_minor, 0);
  const collected = (payments ?? [])
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.gross_minor, 0);

  return (
    <>
      <PageTitle
        title="Payments"
        lead="Match each receipt against the JazzCash transaction history before activating the account. Approval unlocks the plan and records the payment, commission and leaderboard points together. A screenshot alone is not proof of settled funds."
      />

      {!hasServiceRole() ? (
        <div className="mb-6 rounded-md border border-line border-s-2 border-s-warning bg-surface p-5">
          <p className="text-h4">Confirmations are disabled</p>
          <p className="mt-2 max-w-[70ch] text-small text-muted">
            <code>SUPABASE_SERVICE_ROLE_KEY</code> is not set in{" "}
            <code>.env.local</code>. Confirming writes to the payment, wallet
            and commission tables, which are granted to the service role alone.
            The queue below is readable meanwhile.
          </p>
        </div>
      ) : null}

      <div className="grid gap-px sm:grid-cols-3">
        <StatTile label="Awaiting confirmation" value={String(pendingCount ?? 0)} sub="Oldest requests shown first" />
        <StatTile label="Value in this queue" value={formatMoney(waitingValue)} tone="lime" sub="Oldest 100 requests" />
        <StatTile label="Collected" value={formatMoney(collected)} tone="ink" sub="Last 40 payments" />
      </div>

      <div className="mt-8">
        <h2 className="text-h4">Payment verification queue</h2>
        {queueError ? <p role="alert" className="mt-3 text-small text-critical">The queue could not be loaded. Refresh before making a decision.</p> : null}
        {(pendingCount ?? 0) > 100 ? <p className="mt-3 text-small text-muted">Showing the oldest 100 of {pendingCount} requests. The next requests appear as these are reviewed.</p> : null}
        <div className="mt-4 space-y-4">
          {waiting.length === 0 ? (
            <Empty
              title="Nothing waiting"
              body="Members submit a JazzCash payment screenshot from Plans & payments. New requests appear here for review."
            />
          ) : (
            waiting.map((d) => {
              const member = d.profiles as unknown as {
                full_name: string;
                username: string;
                country_code: string;
              } | null;
              const plan = d.plans as unknown as { name: string } | null;

              return (
                <Card key={d.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-h4 tabular">{formatMoney(d.amount_minor)}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-small text-muted">
                        <span>
                          {member?.full_name} (@{member?.username})
                        </span>
                        <span aria-hidden="true">·</span>
                        <CountryChip code={member?.country_code} size="sm" />
                        <span aria-hidden="true">·</span>
                        <span>{plan?.name}</span>
                      </p>
                      <p className="mt-2 text-small">
                        Reference{" "}
                        <span className="font-medium tabular">{d.reference}</span>
                      </p>
                      <p className="mt-1 text-micro text-muted">
                        Declared {formatDate(d.created_at)}
                        {d.proof_path ? " · screenshot attached" : " · no screenshot"}
                      </p>
                      <p className={`mt-3 text-small font-medium ${reviewDeadline(d.created_at) <= new Date().getTime() ? "text-critical" : "text-muted"}`}>
                        {reviewDeadline(d.created_at) <= new Date().getTime() ? "Review overdue · " : "Review due · "}
                        {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(reviewDeadline(d.created_at))} PKT
                      </p>
                      {d.proof_path ? <a href={`/api/payments/${d.id}/proof`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-fit max-w-full rounded-sm border border-line bg-bg p-3">
                        <Image src={`/api/payments/${d.id}/proof`} alt={`Payment receipt for transaction ${d.reference}`} width={240} height={180} unoptimized className="h-44 w-60 max-w-full object-contain" />
                        <span className="mt-2 block text-small underline underline-offset-4">Open full receipt</span>
                      </a> : <p className="mt-3 text-small text-critical">No screenshot attached. Request a receipt before approval.</p>}
                      {d.note ? (
                        <p className="mt-2 max-w-[62ch] text-small text-muted">
                          <span className="font-medium text-ink">Their note: </span>
                          {d.note}
                        </p>
                      ) : null}
                    </div>

                    {hasServiceRole() ? (
                      <DeclarationDecision declarationId={d.id} />
                    ) : (
                      <Status status="requested" />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-h4">Recent decisions</h2>
        <div className="mt-4"><DataTable rows={reviewed ?? []} keyOf={d => d.id}
          empty={<Empty title="No decisions yet" body="Verified and rejected submissions will appear here." />}
          columns={[
            { key: "ref", header: "Reference", render: d => d.reference ?? "Not provided" },
            { key: "status", header: "Decision", render: d => d.status },
            { key: "reason", header: "Notes", render: d => d.reject_reason ?? "" },
            { key: "date", header: "Reviewed", render: d => d.reviewed_at ? formatDate(d.reviewed_at) : "Not reviewed" },
          ]} /></div>
      </div>
      <div className="mt-10">
        <h2 className="text-h4">Confirmed payments</h2>
        <div className="mt-4">
          <DataTable
            rows={payments ?? []}
            keyOf={(p) => p.id}
            empty={<Empty title="No payments yet" body="Confirmed transfers appear here." />}
            columns={[
              { key: "date", header: "Paid", render: (p) => formatDate(p.paid_at) },
              {
                key: "member",
                header: "Member",
                render: (p) =>
                  `@${(p.profiles as unknown as { username: string } | null)?.username ?? ""}`,
              },
              {
                key: "plan",
                header: "Plan",
                render: (p) => (p.plans as unknown as { name: string } | null)?.name ?? "",
              },
              {
                key: "type",
                header: "Type",
                render: (p) =>
                  p.is_first_payment ? (
                    <span className="text-positive">Opened, commission paid</span>
                  ) : (
                    <span className="text-muted">Upgrade, no commission</span>
                  ),
              },
              { key: "status", header: "Status", render: (p) => <Status status={p.status} /> },
              {
                key: "net",
                header: "Net",
                align: "end",
                render: (p) => formatMoney(p.net_minor),
              },
              {
                key: "gross",
                header: "Gross",
                align: "end",
                render: (p) => formatMoney(p.gross_minor),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
