import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { markAllRead } from "@/app/(app)/dashboard/actions";
import { PageTitle, Card, Empty } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { route } from "@/lib/routes";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <>
      <PageTitle
        title="Notifications"
        lead={unread > 0 ? `${unread} unread` : "You are up to date."}
      >
        {unread > 0 ? (
          <form action={markAllRead}>
            <Button type="submit" variant="tertiary">
              Mark all read
            </Button>
          </form>
        ) : null}
      </PageTitle>

      {(items ?? []).length === 0 ? (
        <Empty
          title="Nothing yet"
          body="Commission, rank changes and review decisions all land here as they happen."
        />
      ) : (
        <div className="space-y-2">
          {(items ?? []).map((n) => {
            const inner = (
              <Card
                className={
                  n.read_at
                    ? "border-line"
                    : "border-ink border-s-2 border-s-lime"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-small font-medium">{n.title}</p>
                    {n.body ? (
                      <p className="mt-1 text-small text-muted">{n.body}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-micro text-muted">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </Card>
            );

            return n.href ? (
              <Link key={n.id} href={route(n.href)} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
