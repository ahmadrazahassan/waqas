"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee.
 *
 * The content is rendered twice and the pair translates -50%, which is what
 * makes the loop seamless. The second copy is aria-hidden so a screen reader
 * reads the announcements once.
 *
 * Three ways to stop it, and all three are deliberate rather than polish:
 *   - hovering pauses it, so anyone can stop it to read
 *   - the pause button stops it outright, which WCAG 2.2.2 requires for
 *     anything auto-scrolling past five seconds
 *   - prefers-reduced-motion removes the animation and lets the row scroll by
 *     hand instead, because continuous sideways motion is a genuine problem
 *     for people with vestibular disorders
 */
export function Marquee({
  children,
  speed = 40,
  reverse = false,
  showPause = true,
  className,
  trackClassName,
  pauseTone = "ink",
}: {
  children: React.ReactNode;
  /** Seconds for one full pass. Higher is slower. */
  speed?: number;
  reverse?: boolean;
  showPause?: boolean;
  className?: string;
  trackClassName?: string;
  pauseTone?: "ink" | "lime" | "white";
}) {
  const [paused, setPaused] = useState(false);

  const copy = (
    <div className={cn("flex shrink-0 items-center", trackClassName)}>
      {children}
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="marquee" data-paused={paused}>
        <div
          className="marquee-track"
          style={
            {
              "--marquee-duration": `${speed}s`,
              animationDirection: reverse ? "reverse" : undefined,
            } as React.CSSProperties
          }
        >
          {copy}
          <div className="marquee-copy-duplicate flex shrink-0" aria-hidden="true">
            {copy}
          </div>
        </div>
      </div>

      {showPause ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className={cn(
            "absolute end-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-xs opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover/marquee:opacity-100 hover:opacity-100",
            pauseTone === "ink" && "bg-ink text-white",
            pauseTone === "lime" && "bg-lime text-ink",
            pauseTone === "white" && "bg-white text-ink",
          )}
        >
          {paused ? (
            <Play size={12} strokeWidth={1.5} />
          ) : (
            <Pause size={12} strokeWidth={1.5} />
          )}
          <span className="sr-only">
            {paused ? "Resume the scrolling announcements" : "Pause the scrolling announcements"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
