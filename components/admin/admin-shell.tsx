"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Banknote,
  ClipboardCheck,
  CreditCard,
  Gauge,
  ListPlus,
  LogOut,
  Network,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { route } from "@/lib/routes";

const NAV = [
  { href: "/admin", label: "Overview", Icon: Gauge },
  { href: "/admin/members", label: "Members", Icon: Users },
  { href: "/admin/referrals", label: "Referral explorer", Icon: Network },
  { href: "/admin/tasks", label: "Tasks", Icon: ListPlus },
  { href: "/admin/reviews", label: "Review queue", Icon: ClipboardCheck },
  { href: "/admin/payments", label: "Payments in", Icon: CreditCard },
  { href: "/admin/payouts", label: "Payouts", Icon: Banknote },
  { href: "/admin/seasons", label: "Seasons", Icon: Trophy },
  { href: "/admin/fraud", label: "Fraud", Icon: ShieldAlert },
];

/**
 * Admin chrome. Deliberately a different object to the member dashboard:
 * ink sidebar rather than white, denser rows, and a standing reminder of which
 * role you are acting as. Nobody should ever be unsure which app they are in.
 */
export function AdminShell({
  user,
  children,
}: {
  user: { name: string; roles: string[] };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      <aside className="sticky top-0 z-40 flex shrink-0 flex-col border-e border-line-dark bg-ink text-white lg:h-dvh lg:w-64">
        <div className="flex h-16 items-center gap-2 border-b border-line-dark px-5">
          <Image
            src="/brand/assignwork-mark.png"
            alt=""
            width={80}
            height={80}
            className="size-8 object-contain"
          />
          <span className="text-small font-semibold">Assignwork admin</span>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
          <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={route(href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 text-small whitespace-nowrap transition-colors duration-200",
                      active
                        ? "bg-lime text-ink"
                        : "text-white/70 hover:bg-ink-soft hover:text-white",
                    )}
                  >
                    <Icon size={17} strokeWidth={1.25} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-line-dark p-3 lg:block">
          <p className="px-3 text-micro text-white/60">Acting as</p>
          <p className="px-3 text-small">{user.name}</p>
          <p className="px-3 text-micro text-lime">{user.roles.join(", ")}</p>

          <Link
            href="/dashboard"
            className="mt-3 block rounded-sm px-3 py-2 text-small text-white/70 transition-colors duration-200 hover:bg-ink-soft hover:text-white"
          >
            Member view
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-small text-white/70 transition-colors duration-200 hover:bg-ink-soft hover:text-white"
            >
              <LogOut size={17} strokeWidth={1.25} />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 px-5 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
