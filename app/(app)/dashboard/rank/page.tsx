import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePaidAccess } from "@/lib/payment-access";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, Progress } from "@/components/app/ui";
import { AnnouncementBand } from "@/components/marketing/announcement-bar";
import { memberAnnouncements } from "@/lib/announcements";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Rank" };

export default async function RankPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await requirePaidAccess(user);

  const supabase = await createClient();

  // Levels are earned on direct paid referrals alone now, so that is the only
  // figure this page needs.
  const [{ data: ranks }, { count: directs }] = await Promise.all([
    supabase.from("ranks").select("*").order("id"),
    supabase
      .from("referral_edges")
      .select("*", { count: "exact", head: true })
      .eq("ancestor_id", user.id)
      .eq("depth", 1),
  ]);

  const current = (ranks ?? []).find((r) => r.id === user.profile.rank_id);
  const next = (ranks ?? []).find((r) => r.id === user.profile.rank_id + 1);

  return (
    <>
      <PageTitle
        title="Level"
        lead="Levels are earned on the people you bring in who actually paid. They are never bought, and they can go down as well as up."
      />

      <AnnouncementBand
        items={memberAnnouncements}
        speed={46}
        className="mb-8 rounded-md"
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card>
            <p className="text-micro uppercase tracking-[0.08em] text-muted">
              Current level
            </p>
            <p className="mt-4 text-display leading-none">{current?.name}</p>
            <p className="mt-4 text-small text-muted">{current?.unlocks}</p>
          </Card>

          {next ? (
            <Card className="mt-6">
              <p className="text-h4">What {next.name} needs</p>
              <div className="mt-5">
                <Progress
                  label="Direct referrals who have paid"
                  value={Math.min(directs ?? 0, next.direct_referrals)}
                  max={next.direct_referrals}
                />
              </div>

              {next.monthly_reward_minor ? (
                <div className="mt-6 rounded-sm bg-lime p-4 text-ink">
                  <p className="text-micro uppercase tracking-[0.08em]">
                    Waiting for you at {next.name}
                  </p>
                  <p className="mt-2 text-h2 tabular">
                    {formatMoney(next.monthly_reward_minor)}
                  </p>
                  <p className="mt-1 text-small">
                    a month, paid into your wallet on the 1st, for as long as
                    you hold the level.
                  </p>
                  <p className="mt-3 text-micro">
                    {Math.max(0, next.direct_referrals - (directs ?? 0))} more
                    paid referrals to go.
                  </p>
                </div>
              ) : null}

              <p className="mt-5 text-micro text-muted">
                Only referrals who actually paid for an account count. An unpaid
                signup does not move you up.
              </p>
            </Card>
          ) : (
            <Card className="mt-6">
              <p className="text-h4">You are at the top level</p>
              <p className="mt-2 text-small text-muted">
                There is nothing above Level 6. Hold your referral count to stay
                here and keep the monthly reward coming.
              </p>
            </Card>
          )}
        </div>

        <div className="xl:col-span-7">
          <h2 className="text-h4">Every level</h2>
          <ol className="mt-4 border-t border-line">
            {(ranks ?? []).map((rank) => {
              const isCurrent = rank.id === user.profile.rank_id;
              const reached = rank.id <= user.profile.rank_id;
              return (
                <li
                  key={rank.id}
                  className={cn(
                    "flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line py-4",
                    isCurrent && "bg-lime px-3",
                  )}
                >
                  <span className="w-8 text-micro text-muted tabular">
                    {String(rank.id).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "text-small font-medium",
                      !reached && !isCurrent && "text-muted",
                    )}
                  >
                    {rank.name}
                  </span>
                  <span className="text-micro text-muted tabular">
                    {rank.direct_referrals === 0
                      ? "No referrals needed"
                      : `${rank.direct_referrals} paid referrals`}
                  </span>
                  {rank.monthly_reward_minor ? (
                    <span className="rounded-xs bg-ink px-2 py-0.5 text-micro font-medium text-lime tabular">
                      {formatMoney(rank.monthly_reward_minor)}/mo
                    </span>
                  ) : null}
                  <span className="ms-auto text-micro tabular">
                    {(rank.multiplier_bps / 10000).toFixed(2)}x
                  </span>
                  <span className="w-full text-micro text-muted">
                    {rank.unlocks}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-micro text-muted">
            The multiplier applies to referral levels 2 and 3. Level 1 is a flat
            40% for everyone, at every level. The monthly reward is paid while
            you hold the level and stops if you drop below it.
          </p>
        </div>
      </div>
    </>
  );
}
