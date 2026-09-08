"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { primaryNav, secondaryNav } from "@/lib/site";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/marketing/wordmark";
import { cn } from "@/lib/utils";

/**
 * Full width, 72px, sticky, rectangular. Not floating, not a capsule, not a
 * pill. Solid --color-bg with a hairline underneath, on every route.
 *
 * It used to sit transparent over the hero photograph. That was dropped on
 * purpose: a transparent header's legibility depends on whatever sibling
 * happens to be painted behind it, which is fragile and did break. The Hydra
 * reference solves the same problem the same way, with a solid bar over the
 * photo. Solid means the nav reads at 15:1 regardless of the image.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Body scroll lock while the mobile overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Escape closes, and Tab is trapped inside the panel while it is open.
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Click outside closes the More dropdown.
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-sm bg-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 h-18 border-b border-line bg-bg text-ink">
        <div className="container-site flex h-full items-center justify-between gap-6">
          <Wordmark />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-small font-medium transition-opacity duration-200 hover:opacity-60",
                )}
              >
                {item.label}
              </Link>
            ))}

            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-small font-medium transition-opacity duration-200 hover:opacity-60"
              >
                More
                <ChevronDown
                  size={14}
                  strokeWidth={1.25}
                  className={cn(
                    "transition-transform duration-200",
                    moreOpen && "rotate-180",
                  )}
                />
              </button>

              {moreOpen ? (
                <div className="absolute top-full right-0 mt-3 min-w-44 rounded-md border border-line bg-surface p-1 shadow-overlay">
                  {secondaryNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-xs px-3 py-2 text-small text-ink transition-colors duration-200 hover:bg-bg"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="px-3 text-small font-medium underline-offset-4 transition-opacity duration-200 hover:underline hover:opacity-70"
            >
              Log in
            </Link>
            <ButtonLink href="/signup" variant="primary" size="md" arrow>
              Get started
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="-mr-2 grid size-11 place-items-center lg:hidden"
          >
            <Menu size={22} strokeWidth={1.25} />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-100 flex flex-col bg-bg lg:hidden"
        >
          <div className="container-site flex h-18 shrink-0 items-center justify-between border-b border-line">
            <Wordmark />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="-mr-2 grid size-11 place-items-center"
            >
              <X size={22} strokeWidth={1.25} />
            </button>
          </div>

          <nav
            aria-label="Primary mobile"
            className="container-site flex-1 overflow-y-auto py-2"
          >
            {[...primaryNav, ...secondaryNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-line py-5 text-h3 transition-opacity duration-200 hover:opacity-60"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="container-site flex shrink-0 flex-col gap-3 border-t border-line py-6">
            <ButtonLink
              href="/signup"
              variant="primary"
              size="lg"
              arrow
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="tertiary"
              size="lg"
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </>
  );
}
