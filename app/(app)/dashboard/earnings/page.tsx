import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, StatTile, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { PayoutForm } from "@/components/app/payout-form";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: ledger }, { data: commissions }, { data: payouts }, { data: membership }] =
    await Promise.all([
      supabase
        .from("wallet_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
        .limit(100),
      supabase
        .from("commissions")
        .select("amount_minor, status")
        .eq("earner_id", user.id),
      supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false }),
      supabase
        .from("memberships")
        .select("plans(name, payout_threshold_minor)")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle(),
    ]);

  const balance = ledger?.[0]?.balance_after_minor ?? 0;
  const pending = (commissions ?? [])
    .filter((c) => c.status === "pending" || c.status === "review")
    .reduce((s, c) => s + c.amount_minor, 0);
  const lifetime = (ledger ?? [])
    .filter((e) => e.amount_minor > 0)
    .reduce((s, e) => s + e.amount_minor, 0);

  const plan = (membership as { plans?: { name: string; payout_threshold_minor: number } } | null)?.plans;
  const threshold = plan?.payout_threshold_minor ?? 300_000;
  const inFlight = (payouts ?? [])
    .filter((p) => ["requested", "approved", "processing"].includes(p.status))
    .reduce((s, p) => s + p.amount_minor, 0);

  return (
    <>
      <PageTitle
        title="Earnings"
        lead="Task payments land the moment a reviewer approves. Commission is held for three days, then it is yours to withdraw."
      />

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Available balance" value={formatMoney(balance)} tone="ink" sub="Ready to withdraw" />
        <StatTile label="Pending commission" value={formatMoney(pending)} sub="Not yet cleared" />
        <StatTile label="Lifetime earned" value={formatMoney(lifetime)} sub="Everything credited to you" />
        <StatTile
          label="Payout threshold"
          value={formatMoney(threshold)}
          sub={plan ? `${plan.name} plan` : "No active plan"}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card>
            <h2 className="text-h4">Withdraw</h2>
            <PayoutForm
              balance={balance}
              threshold={threshold}
              inFlight={inFlight}
              kycStatus={user.profile.kyc_status}
            />
          </Card>
        </div>

        <div className="xl:col-span-7">
          <h2 className="text-h4">Payout history</h2>
          <div className="mt-4">
            <DataTable
              rows={payouts ?? []}
              keyOf={(p) => p.id}
              empty={
                <Empty
                  title="No payouts yet"
                  body="When you request one it appears here with its status until the money lands."
                />
              }
              columns={[
                { key: "date", header: "Requested", render: (p) => formatDate(p.requested_at) },
                { key: "method", header: "Method", render: (p) => p.method.replace("_", " ") },
                { key: "status", header: "Status", render: (p) => <Status status={p.status} /> },
                {
                  key: "amount",
                  header: "Amount",
                  align: "end",
                  render: (p) => formatMoney(p.amount_minor),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-h4">Wallet ledger</h2>
        <p className="mt-2 max-w-[70ch] text-small text-muted">
          Append only. Nothing here is ever edited or deleted, so the balance
          can always be explained by scrolling rather than guessing.
        </p>
        <div className="mt-5">
          <DataTable
            rows={ledger ?? []}
            keyOf={(e) => String(e.id)}
            empty={
              <Empty
                title="Nothing in the ledger yet"
                body="Your first task payment or referral commission will open this."
              />
            }
            columns={[
              { key: "date", header: "Date", render: (e) => formatDate(e.created_at) },
              {
                key: "what",
                header: "What",
                render: (e) => (
                  <span>
                    <span className="block">{e.memo ?? e.entry_type}</span>
                    <span className="block text-micro text-muted">
                      {e.entry_type.replace("_", " ")}
                    </span>
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "end",
                render: (e) => (
                  <span className={e.amount_minor >= 0 ? "text-positive" : "text-critical"}>
                    {e.amount_minor >= 0 ? "+" : ""}
                    {formatMoney(e.amount_minor)}
                  </span>
                ),
              },
              {
                key: "balance",
                header: "Balance",
                align: "end",
                render: (e) => formatMoney(e.balance_after_minor),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
