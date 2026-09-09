"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  ListChecks,
  LogOut,
  Medal,
  Network,
  Receipt,
  Settings,
  ShieldCheck,
  Trophy,
  Wallet,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/marketing/wordmark";
import { cn } from "@/lib/utils";
import { route } from "@/lib/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
};

const ICONS = {
  overview: LayoutGrid,
  referrals: Network,
  tasks: ListChecks,
  earnings: Wallet,
  billing: Receipt,
  rank: Medal,
  leaderboard: Trophy,
  notifications: Bell,
  settings: Settings,
  admin: ShieldCheck,
} as const;

/**
 * Member dashboard chrome.
 *
 * 240px sidebar at 1280 and up, a 64px icon rail between 1024 and 1280, and a
 * five item bottom bar below that. The referral link control lives on the
 * overview rather than three clicks in, because it is the most used control in
 * the product.
 */
export function AppShell({
  nav,
  user,
  unread,
  children,
}: {
  nav: NavItem[];
  user: { name: string; username: string; rank: string; avatarUrl: string | null };
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const primary = nav.slice(0, 5);

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      {/* Sidebar / rail */}
      <aside className="sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-e border-line bg-surface lg:flex lg:w-16 xl:w-60">
        <div className="flex h-18 items-center border-b border-line px-4 xl:px-5">
          <span className="hidden xl:block">
            <Wordmark />
          </span>
          <Image
            src="/brand/assignwork-mark.png"
            alt="Assignwork"
            width={80}
            height={80}
            className="block size-8 object-contain xl:hidden"
          />
        </div>

        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto p-2 xl:p-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={route(item.href)}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 text-small transition-colors duration-200",
                      active
                        ? "bg-ink text-white"
                        : "text-muted hover:bg-bg hover:text-ink",
                    )}
                  >
                    <Icon size={18} strokeWidth={1.25} className="shrink-0" />
                    <span className="hidden xl:block">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "ms-auto hidden rounded-xs px-1.5 text-micro tabular xl:block",
                          active ? "bg-lime text-ink" : "bg-ink text-white",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-2 xl:p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-small text-muted transition-colors duration-200 hover:bg-bg hover:text-ink"
            >
              <LogOut size={18} strokeWidth={1.25} className="shrink-0" />
              <span className="hidden xl:block">Log out</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center gap-3 border-b border-line bg-bg px-5 md:px-8">
          <span className="lg:hidden">
            <Wordmark />
          </span>

          <div className="ms-auto flex items-center gap-2">
            <Link
              href="/dashboard/notifications"
              className="relative grid size-11 place-items-center rounded-sm text-muted transition-colors duration-200 hover:text-ink"
            >
              <Bell size={19} strokeWidth={1.25} />
              {unread > 0 ? (
                <>
                  <span className="absolute end-2 top-2 grid min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-medium text-white tabular">
                    {unread > 9 ? "9+" : unread}
                  </span>
                  <span className="sr-only">{unread} unread notifications</span>
                </>
              ) : (
                <span className="sr-only">Notifications</span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-sm border border-line bg-surface py-1.5 ps-1.5 pe-2.5 transition-colors duration-200 hover:border-ink"
              >
                <span className="grid size-7 place-items-center rounded-full bg-ink text-micro font-medium text-lime uppercase">
                  {user.name.slice(0, 1)}
                </span>
                <span className="hidden text-small font-medium sm:block">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={14} strokeWidth={1.25} className="text-muted" />
              </button>

              {menuOpen ? (
                <div className="absolute end-0 top-full z-50 mt-2 w-56 rounded-md border border-line bg-surface p-1 shadow-overlay">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="text-small font-medium">{user.name}</p>
                    <p className="text-micro text-muted">@{user.username}</p>
                    <p className="mt-1 text-micro text-muted">{user.rank}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xs px-3 py-2 text-small transition-colors duration-200 hover:bg-bg"
                  >
                    Settings
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xs px-3 py-2 text-small transition-colors duration-200 hover:bg-bg"
                  >
                    Back to the site
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-xs px-3 py-2 text-start text-small text-critical transition-colors duration-200 hover:bg-bg"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-5 pt-8 pb-28 md:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Bottom bar, mobile and small tablet */}
      <nav
        aria-label="Dashboard mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface lg:hidden"
      >
        {primary.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={route(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] transition-colors duration-200",
                active ? "text-ink" : "text-muted",
              )}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 1.75 : 1.25} />
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 start-1/2 h-0.5 w-4 -translate-x-1/2 bg-lime"
                  />
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
