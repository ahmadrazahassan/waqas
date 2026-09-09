import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { DeclareForm } from "@/components/app/declare-form";
import Image from "next/image";
import Link from "next/link";
import { jazzCash, hasPaidAccess } from "@/lib/billing";
import { PaymentReview } from "@/components/app/payment-review";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: selectedPlan } = await searchParams;
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
        .eq("status", "active")
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

  const bucket = hasServiceRole() ? await createAdminClient().storage.getBucket(jazzCash.proofBucket) : null;
  const ready = !!bucket?.data && !bucket.data.public && !bucket.error && !!plans?.length;
  const active = hasPaidAccess(user.profile.status, membership, new Date().getTime());
  const canPay = ["pending", "active"].includes(user.profile.status) && !membership;
  const plan = (membership as { plans?: { name: string } } | null)?.plans;
  const waiting = (declarations ?? []).find((d) => d.status === "submitted");

  return (
    <>
      <PageTitle
        title="Plans & payments"
        lead={
          active && plan
            ? `You are on ${plan.name}. Paid once, and there is nothing further to pay.`
            : "One payment opens your account. There is no monthly fee and no renewal."
        }
      />

      {active ? (
        <Card className="mb-6 border-s-4 border-s-lime">
          <p className="text-micro uppercase tracking-widest text-muted">Payment verified</p>
          <h2 className="mt-2 text-h3">Your account is active.</h2>
          <p className="mt-2 text-small text-muted">Your {plan?.name} access is ready. There is no monthly payment.</p>
          <Link href="/dashboard/tasks" className="mt-4 inline-flex min-h-11 items-center rounded-sm bg-lime px-5 text-small font-medium">Explore your tasks</Link>
        </Card>
      ) : null}

      {waiting ? <PaymentReview key={waiting.id} submittedAt={waiting.created_at} serverNow={new Date().getTime()} reference={waiting.reference} planName={(waiting.plans as { name: string } | null)?.name} /> : null}

      {!waiting && !active && declarations?.[0]?.status === "rejected" ? (
        <Card className="mb-6 border-s-4 border-s-critical">
          <h2 className="text-h4">Your payment needs attention</h2>
          <p className="mt-2 text-small">{declarations[0].reject_reason ?? "Please check your receipt and transaction ID."}</p>
          <p className="mt-2 text-small text-muted">If you already paid, correct your submission below. Do not send a second payment unless support confirms it is necessary.</p>
        </Card>
      ) : null}

      {!waiting && canPay ? (
        ready ? <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-5">
            <p className="text-micro uppercase tracking-widest text-muted">01 / Pay with JazzCash</p>
            <h2 className="mt-3 text-h3">One QR. One payment.</h2>
            <p className="mt-3 text-small text-muted">Choose your plan, scan this code in your payment app and confirm the recipient before sending.</p>
            <a href={jazzCash.qrPath} target="_blank" rel="noopener noreferrer" className="mt-5 block rounded-sm border border-line bg-white p-3" aria-label="Open the original JazzCash QR at full size">
              <Image src={jazzCash.qrPath} alt="JazzCash payment QR for Muhammad Waqas, account label 9104" width={727} height={1200} unoptimized className="mx-auto h-auto w-full max-w-[300px]" />
            </a>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-small font-medium">{jazzCash.recipient}</p><p className="text-micro text-muted">Account label {jazzCash.accountLabel}</p></div>
              <a href={jazzCash.qrPath} download="Assignwork-JazzCash-QR.png" className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-small">Save QR</a>
            </div>
            <p className="mt-4 text-micro text-muted">On the same phone? Save the QR and use your payment app’s image scanner if supported. JazzCash QR is our only payment method.</p>
          </Card>
          <Card className="xl:col-span-7">
            <p className="text-micro uppercase tracking-widest text-muted">02 / Submit your receipt</p>
            <h2 className="mt-3 text-h3">Let us verify your payment.</h2>
            <DeclareForm plans={plans ?? []} selectedPlan={selectedPlan} />
          </Card>
        </div> : <Card className="mb-6 border-s-4 border-s-warning">
          <h2 className="text-h4">Payments are temporarily unavailable</h2>
          <p className="mt-2 text-small text-muted">Secure receipt review is being configured. Please do not send a payment yet. Contact support if you have already paid.</p>
          <Link href="/contact" className="mt-4 inline-block text-small underline">Contact support</Link>
        </Card>
      ) : !waiting && !active ? <Card>
        <h2 className="text-h4">Contact support about your access</h2>
        <p className="mt-2 text-small text-muted">Your account needs a manual check. Please do not pay again.</p>
        <Link href="/contact" className="mt-4 inline-block text-small underline">Contact support</Link>
      </Card> : null}

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
