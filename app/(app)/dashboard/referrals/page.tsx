import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePaidAccess } from "@/lib/payment-access";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, StatTile, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { ReferralLink } from "@/components/app/referral-link";
import { ReferralTree, type TreeNode } from "@/components/app/referral-tree";
import { formatMoney, formatDate } from "@/lib/utils";
import { site, DIRECT_COMMISSION_RATE } from "@/lib/site";

export const metadata: Metadata = { title: "Referrals" };

type Commission = {
  id: string;
  depth: number;
  amount_minor: number;
  rate_bps: number;
  status: string;
  clears_at: string;
  created_at: string;
  reversed_reason: string | null;
  profiles: { username: string; display_name: string | null } | null;
};

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await requirePaidAccess(user);

  const supabase = await createClient();
  const h = await headers();
  const origin =
    h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : site.url);

  // A Server Component renders once per request, so reading the clock here is
  // correct. The purity rule cannot tell server from client, hence the escape.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: downline }, { data: commissions }, { data: monthCommissions }] =
    await Promise.all([
      supabase
        .from("my_downline")
        .select("*")
        .eq("ancestor_id", user.id)
        .lte("depth", 3)
        .order("depth", { ascending: true })
        .order("joined_at", { ascending: true }),
      supabase
        .from("commissions")
        .select(
          "id, depth, amount_minor, rate_bps, status, clears_at, created_at, reversed_reason, profiles!commissions_source_user_id_fkey(username, display_name)",
        )
        .eq("earner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("commissions")
        .select("amount_minor, status")
        .eq("earner_id", user.id)
        .gte("created_at", since),
    ]);

  const rows = downline ?? [];
  const directs = rows.filter((r) => r.depth === 1);
  const activeInNetwork = rows.filter((r) => r.status === "active").length;

  const lifetime = (commissions ?? [])
    .filter((c) => c.status !== "reversed" && c.status !== "void")
    .reduce((s, c) => s + c.amount_minor, 0);
  const last30 = (monthCommissions ?? [])
    .filter((c) => c.status !== "reversed" && c.status !== "void")
    .reduce((s, c) => s + c.amount_minor, 0);

  // Build the tree from the flat closure rows. Depth 1 nodes hang off the
  // root; deeper nodes are grouped under the depth 1 ancestor we can resolve
  // through the edges we are allowed to read.
  const nodes: TreeNode[] = rows.map((r) => ({
    id: r.member_id as string,
    name: (r.display_name as string) ?? (r.username as string),
    depth: r.depth as number,
    rank: r.rank_name as string,
    status: r.status as string,
    joinedAt: r.joined_at as string,
    country: r.country_code as string,
  }));

  return (
    <>
      <PageTitle
        title="Your network"
        lead={`${DIRECT_COMMISSION_RATE}% of everyone you bring in, paid once on their first payment, plus smaller shares two and three levels down.`}
      />

      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Network size" value={String(rows.length)} sub="Across three levels" />
        <StatTile label="Active members" value={String(activeInNetwork)} sub="Currently paying" />
        <StatTile
          label="Lifetime commission"
          value={formatMoney(lifetime)}
          tone="ink"
          sub="Excluding reversals"
        />
        <StatTile
          label="Last 30 days"
          value={formatMoney(last30)}
          sub="Commission earned"
        />
      </div>

      <div className="mt-8">
        <Card>
          <ReferralLink code={user.profile.referral_code} origin={origin} />
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-h4">Your chain</h2>
        <p className="mt-2 max-w-[70ch] text-small text-muted">
          Everyone below you, three levels deep. You can see a member&apos;s
          display name, rank, when they joined and whether they are paying. You
          cannot see their email, phone or what they earn, and they cannot see
          yours.
        </p>
        <div className="mt-5">
          <ReferralTree
            rootName={user.profile.display_name ?? user.profile.username}
            rootRank={
              (user.profile as { ranks?: { name?: string } }).ranks?.name ?? "Associate"
            }
            nodes={nodes}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-h4">Commission ledger</h2>
        <p className="mt-2 text-small text-muted">
          Every row, including the reversals. Nothing is deleted from here.
        </p>
        <div className="mt-5">
          <DataTable<Commission>
            rows={(commissions ?? []) as unknown as Commission[]}
            keyOf={(c) => c.id}
            empty={
              <Empty
                title="No commission yet"
                body="When someone joins through your link and makes their first payment, 40% of what we keep lands here as pending."
              />
            }
            columns={[
              {
                key: "member",
                header: "From",
                render: (c) => (
                  <span className="font-medium">
                    {c.profiles?.display_name ?? c.profiles?.username ?? "A member"}
                  </span>
                ),
              },
              {
                key: "depth",
                header: "Level",
                render: (c) => `Level ${c.depth}`,
              },
              {
                key: "rate",
                header: "Rate",
                render: (c) => `${(c.rate_bps / 100).toFixed(c.rate_bps % 100 ? 2 : 0)}%`,
              },
              {
                key: "date",
                header: "Earned",
                render: (c) => formatDate(c.created_at),
              },
              {
                key: "status",
                header: "Status",
                render: (c) => (
                  <span className="flex flex-col items-start gap-1">
                    <Status status={c.status} />
                    {c.status === "pending" ? (
                      <span className="text-micro text-muted">
                        clears {formatDate(c.clears_at)}
                      </span>
                    ) : null}
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

      <div className="mt-10">
        <h2 className="text-h4">Direct referrals</h2>
        <div className="mt-5">
          <DataTable
            rows={directs}
            keyOf={(r) => r.member_id as string}
            empty={
              <Empty
                title="Nobody yet"
                body="Share your link above. WhatsApp is usually where this works best."
              />
            }
            columns={[
              {
                key: "name",
                header: "Member",
                render: (r) => (
                  <span className="font-medium">
                    {(r.display_name as string) ?? (r.username as string)}
                  </span>
                ),
              },
              { key: "rank", header: "Rank", render: (r) => r.rank_name as string },
              {
                key: "joined",
                header: "Joined",
                render: (r) => formatDate(r.joined_at as string),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <Status status={r.status as string} />,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
