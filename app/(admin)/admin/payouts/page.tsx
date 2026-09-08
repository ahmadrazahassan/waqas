import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { PageTitle, StatTile, Card, Status, Empty } from "@/components/app/ui";
import { PayoutDecision } from "@/components/admin/payout-decision";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const supabase = await createClient();

  const { data: payouts } = await supabase
    .from("payout_requests")
    .select("*, profiles(full_name, username, kyc_status)")
    .order("requested_at", { ascending: false })
    .limit(100);

  const queue = (payouts ?? []).filter((p) =>
    ["requested", "approved", "processing"].includes(p.status),
  );
  const queueValue = queue.reduce((s, p) => s + p.amount_minor, 0);
  const paidTotal = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_minor, 0);

  return (
    <>
      <PageTitle
        title="Payouts"
        lead="Marking one paid writes a negative wallet entry through the same ledger door as everything else. It cannot be undone by editing, only by a reversing entry."
      />

      {!hasServiceRole() ? (
        <div className="mb-6 rounded-md border border-line border-s-2 border-s-warning bg-surface p-5">
          <p className="text-h4">Payouts cannot move yet</p>
          <p className="mt-2 max-w-[70ch] text-small text-muted">
            <code>SUPABASE_SERVICE_ROLE_KEY</code> is not set in{" "}
            <code>.env.local</code>. Approving or paying a request writes to the
            wallet ledger, and that is granted to the service role alone.
            Everything else on this page works read only.
          </p>
        </div>
      ) : null}

      <div className="grid gap-px sm:grid-cols-3">
        <StatTile label="In the queue" value={String(queue.length)} sub="Awaiting a decision" />
        <StatTile label="Queue value" value={formatMoney(queueValue)} tone="ink" />
        <StatTile label="Paid to date" value={formatMoney(paidTotal)} />
      </div>

      <div className="mt-8 space-y-4">
        {(payouts ?? []).length === 0 ? (
          <Empty
            title="No payout requests"
            body="Members can request a withdrawal once their balance clears their plan threshold."
          />
        ) : (
          (payouts ?? []).map((p) => {
            const member = p.profiles as unknown as {
              full_name: string;
              username: string;
              kyc_status: string;
            } | null;
            const pending = ["requested", "approved", "processing"].includes(p.status);

            return (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-h4 tabular">{formatMoney(p.amount_minor)}</p>
                    <p className="mt-1 text-small text-muted">
                      {member?.full_name} (@{member?.username})
                    </p>
                    <p className="mt-1 text-micro text-muted">
                      {p.method.replace("_", " ")} ·{" "}
                      {p.destination_label ?? "no destination given"} · requested{" "}
                      {formatDate(p.requested_at)}
                    </p>
                    {member?.kyc_status !== "verified" ? (
                      <p className="mt-2 text-micro text-warning">
                        KYC is {member?.kyc_status}. Check the lifetime earnings
                        threshold before releasing this.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Status status={p.status} />
                    {pending && hasServiceRole() ? (
                      <PayoutDecision payoutId={p.id} status={p.status} />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
