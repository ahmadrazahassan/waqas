import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { PageTitle, StatTile, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { DeclarationDecision } from "@/components/admin/declaration-decision";
import { formatMoney, formatDate } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const [{ data: declarations }, { data: payments }] = await Promise.all([
    supabase
      .from("payment_declarations")
      .select("*, profiles(full_name, username, country_code), plans(name)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("payments")
      .select("*, profiles(username), plans(name)")
      .order("paid_at", { ascending: false })
      .limit(40),
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
        lead="Confirming a bank transfer opens the member's account for good, awards the one time 40% up the chain and awards leaderboard points, all in one transaction. Check it against the statement before you click."
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
        <StatTile label="Awaiting confirmation" value={String(waiting.length)} />
        <StatTile label="Value waiting" value={formatMoney(waitingValue)} tone="lime" />
        <StatTile label="Collected" value={formatMoney(collected)} tone="ink" sub="Last 40 payments" />
      </div>

      <div className="mt-8">
        <h2 className="text-h4">Declared transfers</h2>
        <div className="mt-4 space-y-4">
          {waiting.length === 0 ? (
            <Empty
              title="Nothing waiting"
              body="Members declare a bank transfer from their billing page and it lands here for matching."
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
