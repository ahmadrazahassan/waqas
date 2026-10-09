// Reuses the existing authenticated endpoint and database transaction.
export async function runCommissionSchedule(env) {
  if (!env.CRON_SECRET) throw new Error("Commission cron secret is missing");
  const origin = env.NEXT_PUBLIC_SITE_URL || "https://assignwork.70148590.workers.dev";
  const response = await env.WORKER_SELF_REFERENCE.fetch(new Request(
    new URL("/api/cron/commissions", origin),
    {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      signal: AbortSignal.timeout(60_000),
    },
  ));
  if (!response.ok) throw new Error(`Commission cron failed with status ${response.status}`);
  const result = await response.json();
  if (result.ok !== true) throw new Error("Commission cron returned an unsuccessful result");
  console.log(JSON.stringify({ event: "commission_cron_completed", cleared: result.cleared, notificationWarning: result.notificationWarning }));
}
