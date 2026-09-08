import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, StatTile, Empty, DataTable } from "@/components/app/ui";
import { formatDate } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const track =
    user.profile.country_code === "PK"
      ? "pk"
      : user.profile.country_code === "GB"
        ? "uk"
        : "global";

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("track", track)
    .eq("status", "live")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!season) {
    return (
      <>
        <PageTitle title="Leaderboard" />
        <Empty
          title="No season running for your track"
          body="Seasons run quarterly. When one opens, the standings appear here and update as points are earned."
        />
      </>
    );
  }

  const [{ data: standings }, { data: myPoints }] = await Promise.all([
    supabase
      .from("leaderboard_snapshots")
      .select("*")
      .eq("season_id", season.id)
      .order("position", { ascending: true })
      .limit(100),
    supabase
      .from("leaderboard_points")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", season.id)
      .order("created_at", { ascending: false }),
  ]);

  const mine = (standings ?? []).find((s) => s.user_id === user.id);
  const myTotal = (myPoints ?? []).reduce((s, p) => s + p.points, 0);
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.ends_at).getTime() - nowMs) / 86_400_000),
  );

  return (
    <>
      <PageTitle
        title={`${season.name} standings`}
        lead="Points are earned on a published formula and the top of the table wins. There is no draw and no random element anywhere in this."
      />

      <div className="grid gap-px sm:grid-cols-3">
        <StatTile
          label="Your position"
          value={mine ? `#${mine.position}` : "Unranked"}
          sub={mine ? "Live standing" : "Earn a point to appear"}
          tone="ink"
        />
        <StatTile label="Your points" value={String(myTotal)} sub="This season" />
        <StatTile
          label="Season closes"
          value={`${daysLeft} days`}
          sub={formatDate(season.ends_at)}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-h4">Top 100</h2>
        <div className="mt-4">
          <DataTable
            rows={standings ?? []}
            keyOf={(s) => s.user_id}
            empty={
              <Empty
                title="Nobody on the board yet"
                body="The first referral of the season puts someone here."
              />
            }
            columns={[
              {
                key: "position",
                header: "#",
                render: (s) =>
                  s.position <= 3 ? (
                    <span className="inline-grid h-6 min-w-6 place-items-center rounded-xs bg-lime px-1.5 text-micro font-semibold text-ink tabular">
                      {s.position}
                    </span>
                  ) : (
                    <span className="text-small text-muted tabular">
                      {s.position}
                    </span>
                  ),
              },
              {
                key: "name",
                header: "Member",
                render: (s) => (
                  <span className={s.user_id === user.id ? "font-semibold" : ""}>
                    {s.display_name}
                    {s.user_id === user.id ? " (you)" : ""}
                  </span>
                ),
              },
              { key: "rank", header: "Rank", render: (s) => s.rank_name },
              {
                key: "country",
                header: "Country",
                render: (s) => <CountryChip code={s.country_code} size="sm" />,
              },
              { key: "points", header: "Points", align: "end", render: (s) => s.points },
            ]}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-h4">How you earned your points</h2>
          <div className="mt-4">
            {(myPoints ?? []).length === 0 ? (
              <p className="text-small text-muted">
                Nothing yet this season. Points come from the plan the person
                you referred buys, never from the plan you bought.
              </p>
            ) : (
              <ul className="border-t border-line">
                {(myPoints ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  >
                    <span className="text-small">
                      {p.memo ?? p.reason.replace("_", " ")}
                      <span className="ms-2 text-micro text-muted">
                        {formatDate(p.created_at)}
                      </span>
                    </span>
                    <span
                      className={
                        p.points >= 0
                          ? "text-small text-positive tabular"
                          : "text-small text-critical tabular"
                      }
                    >
                      {p.points >= 0 ? "+" : ""}
                      {p.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-h4">The rules for this season</h2>
          <p className="mt-4 whitespace-pre-line text-small text-muted">
            {season.rules_md}
          </p>
        </Card>
      </div>
    </>
  );
}
