import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // proxy.ts already redirects, but that is UX. This is the check that counts
  // on the server, and RLS in Postgres is the one that counts underneath it.
  if (!user) redirect("/login?next=/admin");
  if (!user.isStaff) redirect("/dashboard");

  return (
    <AdminShell
      user={{
        name: user.profile.full_name,
        roles: user.roles,
      }}
    >
      {children}
    </AdminShell>
  );
}
