"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Entrance reveal: opacity 0 to 1 with an 8px rise, fired once at 20%
 * intersection, staggered up to 6 siblings.
 *
 * The animation is never allowed to be load bearing for legibility. Four
 * guarantees, in order of importance:
 *
 *   1. `priority` renders the element visible in the server HTML with no
 *      animation at all. Use it for everything above the fold. That content
 *      does not depend on JavaScript, an observer, or a timer.
 *   2. Anything already in the viewport at mount shows immediately rather
 *      than waiting to be told.
 *   3. A 900ms fallback timer shows the element regardless, in case the
 *      observer never fires (background tabs, embedded webviews, throttling).
 *   4. A <noscript> rule in the root layout makes every .reveal visible when
 *      JavaScript is unavailable.
 *
 * Deliberately no requestAnimationFrame anywhere: rAF does not run in a
 * backgrounded tab, which is how content ends up permanently invisible.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  priority = false,
  className,
}: {
  children: React.ReactNode;
  /** Index in a stagger group, not milliseconds. */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
  /** Above the fold. Renders visible from the server, never animates. */
  priority?: boolean;
  className?: string;
}) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(priority);

  useEffect(() => {
    if (priority || !node || shown) return;

    // Safety net first, so no later branch can skip it. This alone is what
    // makes a missing or broken IntersectionObserver a non-event.
    const fallback = window.setTimeout(() => setShown(true), 900);

    if (typeof IntersectionObserver === "undefined") {
      return () => window.clearTimeout(fallback);
    }

    // An observer reports the initial intersection state as soon as it starts
    // observing, so elements already on screen reveal without a manual
    // measurement. That also keeps every setState out of the effect body.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [node, shown, priority]);

  return (
    <Tag
      ref={setNode}
      className={cn("reveal", className)}
      data-shown={shown}
      style={
        { "--reveal-delay": `${Math.min(delay, 5) * 60}ms` } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
