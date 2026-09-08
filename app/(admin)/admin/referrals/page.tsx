import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatTile, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Referral explorer" };

export default async function AdminReferralsPage() {
  const supabase = await createClient();

  const [{ data: commissions }, { data: rules }, { count: edges }] = await Promise.all([
    supabase
      .from("commissions")
      .select(
        "id, depth, amount_minor, rate_bps, status, created_at, clears_at, reversed_reason, earner:profiles!commissions_earner_id_fkey(username), source:profiles!commissions_source_user_id_fkey(username)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("commission_rules")
      .select("*, plans(name)")
      .is("effective_to", null)
      .order("plan_id")
      .order("depth"),
    supabase.from("referral_edges").select("*", { count: "exact", head: true }),
  ]);

  const total = (commissions ?? [])
    .filter((c) => c.status !== "reversed")
    .reduce((s, c) => s + c.amount_minor, 0);
  const reversed = (commissions ?? [])
    .filter((c) => c.status === "reversed")
    .reduce((s, c) => s + c.amount_minor, 0);

  return (
    <>
      <PageTitle
        title="Referral explorer"
        lead="Every commission traces back to the payment that created it. Nothing here is editable: corrections are reversing entries."
      />

      <div className="grid gap-px sm:grid-cols-3">
        <StatTile label="Chain links" value={String(edges ?? 0)} sub="Ancestor to descendant rows" />
        <StatTile label="Commission awarded" value={formatMoney(total)} tone="ink" sub="Last 100 rows" />
        <StatTile label="Reversed" value={formatMoney(reversed)} sub="Refunds and chargebacks" />
      </div>

      <div className="mt-8">
        <Card>
          <h2 className="text-h4">Live commission rules</h2>
          <p className="mt-2 max-w-[70ch] text-small text-muted">
            Level 1 is a flat 40% on every plan, paid once on the first payment.
            Renewals pay nothing. Changing a rate means inserting a new row with
            an effective date, never editing one of these.
          </p>
          <div className="mt-5">
            <DataTable
              rows={rules ?? []}
              keyOf={(r) => String(r.id)}
              empty={<Empty title="No rules" body="Seed the commission rules first." />}
              columns={[
                {
                  key: "plan",
                  header: "Plan",
                  render: (r) => (r.plans as unknown as { name: string } | null)?.name ?? "",
                },
                { key: "depth", header: "Level", render: (r) => r.depth },
                {
                  key: "rate",
                  header: "Rate",
                  render: (r) => `${(r.rate_bps / 100).toFixed(0)}%`,
                },
                { key: "applies", header: "Applies to", render: (r) => r.applies_to },
                {
                  key: "from",
                  header: "Effective from",
                  render: (r) => formatDate(r.effective_from),
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-h4">Commission ledger</h2>
        <div className="mt-4">
          <DataTable
            rows={commissions ?? []}
            keyOf={(c) => c.id}
            empty={
              <Empty
                title="No commission yet"
                body="The first paid signup through a referral link creates a row here."
              />
            }
            columns={[
              {
                key: "earner",
                header: "Earner",
                render: (c) =>
                  (c.earner as unknown as { username: string } | null)?.username ?? "",
              },
              {
                key: "source",
                header: "From",
                render: (c) =>
                  (c.source as unknown as { username: string } | null)?.username ?? "",
              },
              { key: "depth", header: "Level", render: (c) => c.depth },
              {
                key: "rate",
                header: "Rate",
                render: (c) => `${(c.rate_bps / 100).toFixed(2)}%`,
              },
              { key: "created", header: "Awarded", render: (c) => formatDate(c.created_at) },
              {
                key: "status",
                header: "Status",
                render: (c) => (
                  <span className="flex flex-col items-start gap-1">
                    <Status status={c.status} />
                    {c.reversed_reason ? (
                      <span className="text-micro text-critical">
                        {c.reversed_reason}
                      </span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "end",
                render: (c) => formatMoney(c.amount_minor),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
