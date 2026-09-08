import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Card, Status, Empty, DataTable } from "@/components/app/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Seasons" };

export default async function SeasonsPage() {
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*, prizes(id, position_from, position_to, title)")
    .order("starts_at", { ascending: false });

  return (
    <>
      <PageTitle
        title="Seasons"
        lead="Prizes go to the top of a published points table. There is no draw, no random selection and no seed anywhere in this system, and there must never be one."
      />

      {(seasons ?? []).length === 0 ? (
        <Empty title="No seasons" body="Create one to open a leaderboard." />
      ) : (
        <div className="space-y-6">
          {(seasons ?? []).map((season) => {
            const prizes = (season.prizes ?? []) as unknown as {
              id: number;
              position_from: number;
              position_to: number;
              title: string;
            }[];

            return (
              <Card key={season.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-h4">
                      {season.name}
                      <span className="ms-3 text-micro uppercase tracking-[0.08em] text-muted">
                        {season.track} track
                      </span>
                    </h2>
                    <p className="mt-1 text-small text-muted">
                      {formatDate(season.starts_at)} to {formatDate(season.ends_at)}
                    </p>
                  </div>
                  <Status status={season.status} />
                </div>

                <details className="mt-5 border-t border-line pt-4">
                  <summary className="cursor-pointer text-small font-medium">
                    Published rules
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-small text-muted">
                    {season.rules_md}
                  </p>
                  <p className="mt-3 text-micro text-warning">
                    Immutable once the first point is earned. Changing the rules
                    means closing this season and opening another.
                  </p>
                </details>

                <div className="mt-5">
                  <DataTable
                    rows={prizes.sort((a, b) => a.position_from - b.position_from)}
                    keyOf={(p) => String(p.id)}
                    empty={<Empty title="No prizes set" body="Add a prize table." />}
                    columns={[
                      {
                        key: "position",
                        header: "Position",
                        render: (p) =>
                          p.position_from === p.position_to
                            ? String(p.position_from)
                            : `${p.position_from} to ${p.position_to}`,
                      },
                      { key: "prize", header: "Prize", render: (p) => p.title },
                    ]}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
