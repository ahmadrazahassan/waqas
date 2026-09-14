"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  ClipboardCheck,
  CircleDollarSign,
  CreditCard,
  Gauge,
  ListPlus,
  LogOut,
  Menu,
  Network,
  ShieldAlert,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { route } from "@/lib/routes";

const NAV: Array<{
  href: string;
  label: string;
  Icon: LucideIcon;
  roles?: string[];
}> = [
  { href: "/admin", label: "Overview", Icon: Gauge },
  { href: "/admin/members", label: "Members", Icon: Users },
  { href: "/admin/referrals", label: "Referral explorer", Icon: Network },
  { href: "/admin/commissions", label: "Commissions", Icon: CircleDollarSign, roles: ["finance", "admin", "owner"] },
  { href: "/admin/tasks", label: "Tasks", Icon: ListPlus },
  { href: "/admin/reviews", label: "Task reviews", Icon: ClipboardCheck },
  { href: "/admin/payments", label: "Payment reviews", Icon: CreditCard },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);
  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.some((role) => user.roles.includes(role)),
  );

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = mobileMenuButtonRef.current;
    const focusableSelector = "a[href], button:not([disabled])";
    const focusable = Array.from(
      mobileMenuPanelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    focusable[0]?.focus();

    const handleMenuKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleMenuKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleMenuKeys);
      menuButton?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line-dark bg-ink text-white lg:flex">
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
            {visibleNav.map(({ href, label, Icon }) => {
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

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line-dark bg-ink px-4 text-white lg:hidden">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Assignwork admin overview"
        >
          <Image
            src="/brand/assignwork-mark.png"
            alt=""
            width={80}
            height={80}
            className="size-8 shrink-0 object-contain"
          />
          <span className="truncate text-small font-semibold">Assignwork admin</span>
        </Link>
        <button
          ref={mobileMenuButtonRef}
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-admin-navigation"
          aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
          className="grid size-11 shrink-0 place-items-center rounded-sm border border-line-dark text-white transition-colors hover:bg-ink-soft"
        >
          {mobileMenuOpen ? <X size={21} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}
        </button>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={mobileMenuPanelRef}
            id="mobile-admin-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="relative flex h-full w-[min(22rem,calc(100%-3rem))] flex-col border-e border-line-dark bg-ink text-white shadow-overlay"
          >
            <div className="border-b border-line-dark px-5 py-4">
              <p className="truncate text-small font-medium">{user.name}</p>
              <p className="mt-0.5 truncate text-micro text-lime">{user.roles.join(", ")}</p>
            </div>
            <nav aria-label="Admin mobile" className="min-h-0 flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {visibleNav.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={route(href)}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-sm px-3 py-2.5 text-small transition-colors",
                          active
                            ? "bg-lime font-medium text-ink"
                            : "text-white/75 hover:bg-ink-soft hover:text-white",
                        )}
                      >
                        <Icon size={18} strokeWidth={1.35} className="shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-line-dark p-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center rounded-sm px-3 text-small text-white/75 transition-colors hover:bg-ink-soft hover:text-white"
              >
                Member view
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-small text-white/75 transition-colors hover:bg-ink-soft hover:text-white"
                >
                  <LogOut size={18} strokeWidth={1.35} />
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-5 sm:py-8 md:px-8 lg:flex-1">
        {children}
      </main>
    </div>
  );
}
