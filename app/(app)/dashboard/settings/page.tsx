import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PageTitle, Card, Status } from "@/components/app/ui";
import { ProfileForm } from "@/components/app/profile-form";
import { formatDate, formatMoney } from "@/lib/utils";
import { CountryChip } from "@/components/ui/flag";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("*, plans(name, price_minor)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  const plan = (membership as { plans?: { name: string; price_minor: number } } | null)?.plans;

  return (
    <>
      <PageTitle
        title="Settings"
        lead="Your profile, your plan and how you appear on the leaderboard."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card>
            <h2 className="text-h4">Profile</h2>
            <ProfileForm
              fullName={user.profile.full_name}
              displayName={user.profile.display_name}
              headline={user.profile.headline}
              leaderboardOptin={user.profile.leaderboard_optin}
              phone={user.profile.phone_e164}
              countryCode={user.profile.country_code}
            />
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card>
            <h2 className="text-h4">Account</h2>
            <dl className="mt-4 border-t border-line">
              <Row label="Email" value={user.email ?? "Not set"} />
              <Row label="Username" value={`@${user.profile.username}`} />
              <Row
                label="Mobile"
                value={user.profile.phone_e164 ? formatPhone(user.profile.phone_e164) : "Not added yet"}
              />
              <Row label="Referral code" value={user.profile.referral_code} />
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <dt className="text-small text-muted">Country</dt>
                <dd>
                  <CountryChip code={user.profile.country_code} />
                </dd>
              </div>
              <Row label="Joined" value={formatDate(user.profile.created_at)} />
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <dt className="text-small text-muted">Status</dt>
                <dd>
                  <Status status={user.profile.status} />
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-micro text-muted">
              Your country sets your leaderboard track and cannot be changed
              without verification. Your referral code is permanent.
            </p>
          </Card>

          <Card>
            <h2 className="text-h4">Plan</h2>
            {plan ? (
              <dl className="mt-4 border-t border-line">
                <Row label="Plan" value={plan.name} />
                <Row label="Paid" value={`${formatMoney(plan.price_minor)} once`} />
                <Row
                  label="Access"
                  value={
                    membership!.expires_at
                      ? `Until ${formatDate(membership!.expires_at)}`
                      : "Does not expire"
                  }
                />
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                  <dt className="text-small text-muted">Status</dt>
                  <dd>
                    <Status status={membership!.status} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-small text-muted">
                No plan yet. The task pool and the referral programme stay
                locked until you buy one, which is a single payment.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-h4">Commission eligibility</h2>
            <p className="mt-3 text-small text-muted">
              {user.profile.commission_eligible
                ? "You are eligible. You have had a task approved in the last 90 days."
                : "Paused. You need at least one approved task in the last 90 days to earn commission. This rule exists because income here cannot come from recruitment alone."}
            </p>
            {user.profile.last_task_approved_at ? (
              <p className="mt-2 text-micro text-muted">
                Last approved task: {formatDate(user.profile.last_task_approved_at)}
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="text-small tabular">{value}</dd>
    </div>
  );
}
