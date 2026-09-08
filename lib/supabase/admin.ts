import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service role client. BYPASSES RLS ENTIRELY.
 *
 * This is the only key that can call award_commissions, post_wallet_entry,
 * clear_commissions and the rest of the money surface, because those functions
 * are granted to service_role alone.
 *
 * Rules for using it:
 *   - Server only. `server-only` above makes importing it from a client
 *     component a build error rather than a leak.
 *   - Never behind a route a member can reach. Webhooks and cron only.
 *   - Never pass a user supplied id straight into a query on this client
 *     without checking who the caller is first.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Copy it from the Supabase " +
        "dashboard under Project Settings, API, service_role, into .env.local. " +
        "It must never be prefixed NEXT_PUBLIC_.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** True when the service role key is configured, for honest UI states. */
export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
