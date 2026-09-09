import "server-only";
import { createClient, type CurrentUser } from "@/lib/supabase/server";
import { hasPaidAccess } from "@/lib/billing";
import { redirect } from "next/navigation";

export async function memberHasAccess(user: CurrentUser) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memberships")
    .select("status, expires_at, revoked_at").eq("user_id", user.id)
    .eq("status", "active").maybeSingle();
  return !error && hasPaidAccess(user.profile.status, data, Date.now());
}

export async function requirePaidAccess(user: CurrentUser) {
  if (!(await memberHasAccess(user))) redirect("/dashboard/billing");
}
