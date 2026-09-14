import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProcessCommissions } from "@/components/admin/process-commissions";
import { Card, DataTable, Empty, PageTitle, StatTile, Status } from "@/components/app/ui";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { route } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Commissions" };

const STATUSES = ["pending", "review", "available", "paid", "reversed", "void"] as const;
type CommissionStatus = (typeof STATUSES)[number];

type ProfileSummary = { id: string; full_name: string; username: string };
type PaymentSummary = {
  gross_minor: number;
  provider: string;
  paid_at: string;
  plans: { name: string } | null;
};

function formatPakistanDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
    timeZoneName: "short",
  }).format(new Date(value));
}

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/commissions");
  if (!user.roles.some((role) => ["finance", "admin", "owner"].includes(role))) {
    redirect("/admin");
  }

  const { q = "", status = "" } = await searchParams;
  const selectedStatus = STATUSES.includes(status as CommissionStatus)
    ? (status as CommissionStatus)
    : "";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commissions")
    .select(
      "id, earner_id, source_user_id, payment_id, depth, amount_minor, rate_bps, status, clears_at, cleared_at, created_at, reversed_reason, earner:profiles!commissions_earner_id_fkey(id, full_name, username), source:profiles!commissions_source_user_id_fkey(id, full_name, username), payment:payments!commissions_payment_id_fkey(gross_minor, provider, paid_at, plans(name))",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  const search = q.trim().toLowerCase();
  const rows = (data ?? []).filter((commission) => {
    if (selectedStatus && commission.status !== selectedStatus) return false;
    if (!search) return true;
    const earner = commission.earner as unknown as ProfileSummary | null;
    const source = commission.source as unknown as ProfileSummary | null;
    return [earner?.full_name, earner?.username, source?.full_name, source?.username]
      .some((value) => value?.toLowerCase().includes(search));
  });
  const now = new Date().getTime();
  const allRows = data ?? [];
  const amountFor = (state: CommissionStatus) => allRows
    .filter((commission) => commission.status === state)
    .reduce((sum, commission) => sum + commission.amount_minor, 0);
  const dueRows = allRows.filter(
    (commission) => commission.status === "pending" && new Date(commission.clears_at).getTime() <= now,
  );
  const dueAmount = dueRows.reduce((sum, commission) => sum + commission.amount_minor, 0);
  const automationConfigured = Boolean(process.env.CRON_SECRET);

  return (
    <>
      <PageTitle
        title="Commissions"
        lead="Trace every referral earning from the verified payment to the member wallet. Only commissions past their hold date can be released."
      >
        <ProcessCommissions />
      </PageTitle>

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pending hold"
          value={formatMoney(amountFor("pending"))}
          sub="Waiting for the refund protection period"
        />
        <StatTile
          label="Due now"
          value={formatMoney(dueAmount)}
          sub={`${dueRows.length} commission entries ready to process`}
          tone={dueRows.length ? "lime" : "light"}
        />
        <StatTile
          label="Available"
          value={formatMoney(amountFor("available"))}
          sub="Already added to member wallets"
          tone="ink"
        />
        <StatTile
          label="Paid out"
          value={formatMoney(amountFor("paid"))}
          sub="Completed withdrawal records"
        />
      </div>

      <Card className="mt-8">
        <h2 className="text-h4">How money moves</h2>
        <ol className="mt-5 grid gap-px md:grid-cols-3">
          {[
            ["01", "Payment verified", "The member’s first approved plan payment creates commission for the eligible referrer automatically."],
            ["02", "Three-day hold", "The amount stays pending while the 24-hour refund window and fraud checks complete."],
            ["03", "Wallet credit", "The clearing job posts one auditable commission entry to the earner’s wallet. It must never be added by hand as a duplicate."],
          ].map(([number, title, body]) => (
            <li key={number} className="border border-line bg-bg p-4">
              <p className="text-micro font-medium text-violet">{number}</p>
              <p className="mt-3 text-small font-medium">{title}</p>
              <p className="mt-1 text-micro text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface p-4">
          <div>
            <p className="text-small font-medium">Automatic clearing</p>
            <p className="mt-1 text-micro text-muted">The daily release window starts at 1:00 AM Pakistan time. The button above safely processes due entries on demand.</p>
          </div>
          <span className={automationConfigured ? "text-small font-medium text-positive" : "text-small font-medium text-warning"}>
            {automationConfigured ? "Secure schedule configured" : "CRON_SECRET needs configuration"}
          </span>
        </div>
      </Card>

      <Card className="mt-8">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="commission-q" className="block text-micro font-medium uppercase tracking-[0.08em] text-muted">Member search</label>
            <input id="commission-q" name="q" defaultValue={q} placeholder="Earner or referred member" className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small" />
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="commission-status" className="block text-micro font-medium uppercase tracking-[0.08em] text-muted">Status</label>
            <select id="commission-status" name="status" defaultValue={selectedStatus} className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small sm:w-auto">
              <option value="">Any status</option>
              {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button type="submit" className="h-11 w-full rounded-sm bg-ink px-5 text-small font-medium text-white sm:w-auto">Filter</button>
        </form>
      </Card>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-h4">Commission ledger</h2>
            <p className="mt-1 text-micro text-muted">Latest 500 records. Amounts are stored in PKR paisa and displayed as rupees.</p>
          </div>
          <Link href="/admin/referrals" className="text-small text-violet underline-offset-4 hover:underline">Open referral chain</Link>
        </div>
        {error ? (
          <p role="alert" className="rounded-sm border border-critical/30 bg-surface p-4 text-small text-critical">Commission records could not be loaded. Refresh before making a financial decision.</p>
        ) : (
          <DataTable
            rows={rows}
            keyOf={(commission) => commission.id}
            empty={<Empty title="No commissions match" body="Change the filters, or wait for the first verified referral payment." />}
            columns={[
              {
                key: "earner",
                header: "Earner",
                render: (commission) => {
                  const earner = commission.earner as unknown as ProfileSummary | null;
                  return earner ? <span><Link href={route(`/admin/members/${earner.id}`)} className="block font-medium underline-offset-4 hover:underline">{earner.full_name}</Link><span className="text-micro text-muted">@{earner.username}</span></span> : "Unknown";
                },
              },
              {
                key: "source",
                header: "Joined member",
                render: (commission) => {
                  const source = commission.source as unknown as ProfileSummary | null;
                  return source ? <span><Link href={route(`/admin/members/${source.id}`)} className="block font-medium underline-offset-4 hover:underline">{source.full_name}</Link><span className="text-micro text-muted">@{source.username}</span></span> : "Unknown";
                },
              },
              {
                key: "payment",
                header: "Verified payment",
                render: (commission) => {
                  const payment = commission.payment as unknown as PaymentSummary | null;
                  return payment ? <span><span className="block font-medium">{formatMoney(payment.gross_minor)}</span><span className="text-micro text-muted">{payment.plans?.name ?? "Plan"} · {payment.provider}</span></span> : "Unknown";
                },
              },
              { key: "level", header: "Level", render: (commission) => `Level ${commission.depth}` },
              { key: "rate", header: "Rate", render: (commission) => `${(commission.rate_bps / 100).toFixed(0)}%` },
              { key: "created", header: "Created", render: (commission) => formatDate(commission.created_at) },
              {
                key: "release",
                header: "Wallet release",
                render: (commission) => commission.cleared_at
                  ? formatPakistanDateTime(commission.cleared_at)
                  : <span className={new Date(commission.clears_at).getTime() <= now ? "font-medium text-positive" : "text-muted"}>{new Date(commission.clears_at).getTime() <= now ? "Due now" : formatPakistanDateTime(commission.clears_at)}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (commission) => <span className="flex flex-col items-start gap-1"><Status status={commission.status} />{commission.reversed_reason ? <span className="text-micro text-critical">{commission.reversed_reason}</span> : null}</span>,
              },
              { key: "amount", header: "Commission", align: "end", render: (commission) => formatMoney(commission.amount_minor) },
            ]}
          />
        )}
      </div>
    </>
  );
}
