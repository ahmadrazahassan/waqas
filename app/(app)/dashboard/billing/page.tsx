import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { DeclareForm } from "@/components/app/declare-form";
import { rails, bankDetails } from "@/lib/billing";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: plans }, { data: membership }, { data: declarations }, { data: payments }] =
    await Promise.all([
      supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      supabase
        .from("memberships")
        .select("*, plans(name, price_minor)")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .maybeSingle(),
      supabase
        .from("payment_declarations")
        .select("*, plans(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("payments")
        .select("*, plans(name)")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(20),
    ]);

  const plan = (membership as { plans?: { name: string } } | null)?.plans;
  const waiting = (declarations ?? []).find((d) => d.status === "submitted");

  return (
    <>
      <PageTitle
        title="Billing"
        lead={
          plan
            ? `You are on ${plan.name}. Paid once, and there is nothing further to pay.`
            : "One payment opens your account. There is no monthly fee and no renewal."
        }
      />

      {!bankDetails.isReal ? (
        <div className="mb-6 rounded-md border border-line border-s-2 border-s-warning bg-surface p-5">
          <p className="text-h4">Bank details are not set yet</p>
          <p className="mt-2 max-w-[70ch] text-small text-muted">
            The account shown below is a placeholder. Nobody should transfer
            money to it. Replace it in <code>lib/billing.ts</code> with the real
            company account once that is open, and flip <code>isReal</code>.
          </p>
        </div>
      ) : null}

      {waiting ? (
        <Card className="mb-6 border-s-2 border-s-info">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-h4">We are checking your transfer</p>
              <p className="mt-2 max-w-[62ch] text-small text-muted">
                You declared {formatMoney(waiting.amount_minor)} with reference{" "}
                <span className="tabular">{waiting.reference}</span> on{" "}
                {formatDate(waiting.created_at)}. Nothing switches on until we
                have matched it against the bank, usually within one working day.
              </p>
            </div>
            <Status status="requested" />
          </div>
        </Card>
      ) : null}

      {/* Rails */}
      <div className="grid gap-px sm:grid-cols-2">
        {rails.map((rail) => (
          <Card
            key={rail.id}
            className={rail.available ? "" : "opacity-60"}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-h4">{rail.name}</h2>
              <span className="text-micro uppercase tracking-[0.08em] text-muted">
                {rail.available ? rail.clearing : "Not live"}
              </span>
            </div>
            <p className="mt-3 text-small text-muted">{rail.body}</p>
          </Card>
        ))}
      </div>

      {!waiting ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <Card>
              <h2 className="text-h4">Where to send it</h2>
              <dl className="mt-4 border-t border-line">
                {[
                  ["Account name", bankDetails.accountName],
                  ["Bank", bankDetails.bank],
                  ["Account number", bankDetails.accountNumber],
                  ["IBAN", bankDetails.iban],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <dt className="text-small text-muted">{k}</dt>
                    <dd className="text-small tabular">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-micro text-muted">
                Transfer from an account in your own name. A transfer from
                someone else&apos;s account is one of the things our fraud
                checks flag, and it will slow your confirmation down.
              </p>
            </Card>
          </div>

          <div className="xl:col-span-7">
            <Card>
              <h2 className="text-h4">Tell us you have paid</h2>
              <DeclareForm plans={plans ?? []} />
            </Card>
          </div>
        </div>
      ) : null}

      {/* History */}
      <div className="mt-10">
        <h2 className="text-h4">Payment history</h2>
        <div className="mt-4">
          <DataTable
            rows={payments ?? []}
            keyOf={(p) => p.id}
            empty={
              <Empty
                title="No payments yet"
                body="Your confirmed transfer appears here, along with what it opened."
              />
            }
            columns={[
              { key: "date", header: "Paid", render: (p) => formatDate(p.paid_at) },
              {
                key: "plan",
                header: "Plan",
                render: (p) => (p.plans as unknown as { name: string } | null)?.name ?? "",
              },
              {
                key: "first",
                header: "Type",
                render: (p) =>
                  p.is_first_payment ? "Opened your account" : "Upgrade",
              },
              { key: "status", header: "Status", render: (p) => <Status status={p.status} /> },
              {
                key: "amount",
                header: "Amount",
                align: "end",
                render: (p) => formatMoney(p.gross_minor),
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-h4">Declarations</h2>
        <div className="mt-4">
          <DataTable
            rows={declarations ?? []}
            keyOf={(d) => d.id}
            empty={
              <Empty title="Nothing declared" body="Transfers you tell us about show up here." />
            }
            columns={[
              { key: "date", header: "Declared", render: (d) => formatDate(d.created_at) },
              {
                key: "plan",
                header: "Plan",
                render: (d) => (d.plans as unknown as { name: string } | null)?.name ?? "",
              },
              {
                key: "ref",
                header: "Reference",
                render: (d) => <span className="tabular">{d.reference}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (d) => (
                  <span className="flex flex-col items-start gap-1">
                    <Status
                      status={
                        d.status === "submitted"
                          ? "requested"
                          : d.status === "confirmed"
                            ? "approved"
                            : d.status
                      }
                    />
                    {d.reject_reason ? (
                      <span className="text-micro text-critical">{d.reject_reason}</span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                align: "end",
                render: (d) => formatMoney(d.amount_minor),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
