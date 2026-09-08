import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AppShell, type NavItem } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const supabase = await createClient();

  const [{ count: unread }, { count: activeTasks }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase
      .from("task_claims")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "revision"]),
  ]);

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "overview" },
    { href: "/dashboard/referrals", label: "Referrals", icon: "referrals" },
    { href: "/dashboard/tasks", label: "Tasks", icon: "tasks", badge: activeTasks ?? 0 },
    { href: "/dashboard/earnings", label: "Earnings", icon: "earnings" },
    { href: "/dashboard/billing", label: "Billing", icon: "billing" },
    { href: "/dashboard/leaderboard", label: "Board", icon: "leaderboard" },
    { href: "/dashboard/rank", label: "Rank", icon: "rank" },
    { href: "/dashboard/notifications", label: "Notifications", icon: "notifications" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ];

  const rank = (user.profile as { ranks?: { name?: string } }).ranks;

  return (
    <AppShell
      nav={nav}
      unread={unread ?? 0}
      user={{
        name: user.profile.full_name,
        username: user.profile.username,
        rank: rank?.name ?? "Associate",
        avatarUrl: user.profile.avatar_url,
      }}
    >
      {children}
    </AppShell>
  );
}
