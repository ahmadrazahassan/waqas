import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CommissionClearingResult = {
  cleared: number;
  notificationWarning?: string;
};

/**
 * Releases only commissions whose database-controlled hold has expired.
 * clear_commissions owns the financial transaction and writes the wallet
 * ledger entry; this wrapper adds member notifications after a successful run.
 */
export async function clearMatureCommissions(): Promise<CommissionClearingResult> {
  const admin = createAdminClient();
  const startedAt = new Date().toISOString();
  const { data, error } = await admin.rpc("clear_commissions");

  if (error) throw new Error(`Commission clearing failed: ${error.message}`);

  const cleared = Number(data ?? 0);
  if (cleared <= 0) return { cleared: 0 };

  const { data: entries, error: entriesError } = await admin
    .from("wallet_entries")
    .select("user_id, amount_minor")
    .eq("entry_type", "commission")
    .gte("created_at", startedAt);

  if (entriesError) {
    return {
      cleared,
      notificationWarning: "Wallets were updated, but notification recipients could not be loaded.",
    };
  }

  const amountByMember = new Map<string, number>();
  for (const entry of entries ?? []) {
    amountByMember.set(
      entry.user_id,
      (amountByMember.get(entry.user_id) ?? 0) + entry.amount_minor,
    );
  }

  if (amountByMember.size === 0) return { cleared };

  const notifications = Array.from(amountByMember, ([userId, amountMinor]) => ({
    user_id: userId,
    kind: "commission_cleared",
    title: "Commission added to your wallet",
    body: `${new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amountMinor / 100)} is now available in your wallet.`,
    href: "/dashboard/earnings",
  }));

  const { error: notificationError } = await admin
    .from("notifications")
    .insert(notifications);

  return notificationError
    ? {
        cleared,
        notificationWarning: "Wallets were updated, but one or more notifications could not be sent.",
      }
    : { cleared };
}
