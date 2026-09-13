import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { formatDate, formatMoney } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";
import { route } from "@/lib/routes";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Members" };

type Member = {
  id: string;
  full_name: string;
  username: string;
  country_code: string;
  status: string;
  kyc_status: string;
  commission_eligible: boolean;
  referral_code: string;
  phone_e164: string | null;
  created_at: string;
  ranks: { name: string } | null;
  balance_minor: number;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, username, country_code, status, kyc_status, commission_eligible, referral_code, phone_e164, created_at, ranks(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // PostgREST filter syntax treats commas, brackets and wildcards as
  // operators, so they are stripped before the term goes into or().
  const term = q.replace(/[,()*%"]/g, " ").trim();
  if (term) {
    const filters = [`full_name.ilike.%${term}%`, `username.ilike.%${term}%`];
    // 0300 1234567 is stored as +923001234567, so match on the digits after
    // any trunk zero.
    const digits = term.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length >= 4) filters.push(`phone_e164.ilike.%${digits}%`);
    query = query.or(filters.join(","));
  }
  if (status) query = query.eq("status", status as "active");

  const { data: members } = await query;
  const memberIds = (members ?? []).map((member) => member.id);
  const { data: walletRows } = memberIds.length
    ? await supabase
        .from("wallet_entries")
        .select("user_id, balance_after_minor")
        .in("user_id", memberIds)
        .order("id", { ascending: false })
    : { data: [] as { user_id: string; balance_after_minor: number }[] };
  const balanceByMember = new Map<string, number>();
  for (const row of walletRows ?? []) {
    if (!balanceByMember.has(row.user_id)) balanceByMember.set(row.user_id, row.balance_after_minor);
  }
  const memberRows = (members ?? []).map((member) => ({
    ...member,
    balance_minor: balanceByMember.get(member.id) ?? 0,
  }));

  return (
    <>
      <PageTitle
        title="Members"
        lead="Every account, newest first. Search by name, username or mobile number."
      />

      <div className="mb-6 grid gap-px sm:grid-cols-3">
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Showing</p><p className="mt-3 text-h3 tabular">{memberRows.length}</p><p className="mt-1 text-small text-muted">members in this view</p></div>
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Active</p><p className="mt-3 text-h3 tabular">{memberRows.filter((m) => m.status === "active").length}</p><p className="mt-1 text-small text-muted">access currently open</p></div>
        <div className="rounded-md border border-line bg-surface p-5"><p className="text-micro uppercase tracking-widest text-muted">Needs attention</p><p className="mt-3 text-h3 tabular">{memberRows.filter((m) => ["restricted", "suspended"].includes(m.status) || m.kyc_status === "pending").length}</p><p className="mt-1 text-small text-muted">restricted, suspended or KYC pending</p></div>
      </div>

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label
              htmlFor="q"
              className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
            >
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Name, username or mobile"
              className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="status"
              className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="mt-2 h-11 w-full rounded-sm border border-line bg-surface px-3 text-small sm:w-auto"
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="restricted">Restricted</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-11 w-full rounded-sm border border-ink bg-ink px-5 text-small font-medium text-white sm:w-auto"
          >
            Filter
          </button>
        </form>
      </Card>

      <DataTable<Member>
        rows={memberRows as unknown as Member[]}
        keyOf={(m) => m.id}
        empty={
          <Empty
            title="No members match"
            body="Nothing is seeded here. The first real signup will appear once someone registers."
          />
        }
        columns={[
          {
            key: "name",
            header: "Member",
            render: (m) => (
              <span>
                <Link href={route(`/admin/members/${m.id}`)} className="block font-medium underline-offset-4 hover:underline">{m.full_name}</Link>
                <span className="block text-micro text-muted">@{m.username}</span>
                {m.phone_e164 ? (
                  <a href={`tel:${m.phone_e164}`} className="block text-micro text-muted tabular hover:text-ink">
                    {formatPhone(m.phone_e164)}
                  </a>
                ) : (
                  <span className="block text-micro text-warning">No mobile</span>
                )}
              </span>
            ),
          },
          {
                key: "country",
                header: "Country",
                render: (m) => <CountryChip code={m.country_code} size="sm" />,
              },
          { key: "rank", header: "Rank", render: (m) => m.ranks?.name ?? "Associate" },
          {
            key: "code",
            header: "Referral code",
            render: (m) => <span className="tabular">{m.referral_code}</span>,
          },
          {
            key: "eligible",
            header: "Commission",
            render: (m) =>
              m.commission_eligible ? (
                <span className="text-positive">Eligible</span>
              ) : (
                <span className="text-muted">Paused</span>
              ),
          },
          {
            key: "balance",
            header: "Wallet",
            align: "end",
            render: (m) => <span className="tabular">{formatMoney(m.balance_minor)}</span>,
          },
          { key: "kyc", header: "KYC", render: (m) => <Status status={m.kyc_status} /> },
          { key: "joined", header: "Joined", render: (m) => formatDate(m.created_at) },
          {
            key: "status",
            header: "Status",
            render: (m) => <Status status={m.status} />,
          },
          {
            key: "actions",
            header: "Actions",
            align: "end",
            render: (m) => (
              <Link
                href={route(`/admin/members/${m.id}`)}
                className="inline-flex h-9 items-center rounded-control border border-line px-3 text-micro font-medium hover:border-ink hover:text-ink"
              >
                Edit member
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
