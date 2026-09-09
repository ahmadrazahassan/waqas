"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * A live deadline countdown.
 *
 * The wall clock is an external mutable source, so this reads it through
 * useSyncExternalStore rather than an effect that calls setState. That is the
 * primitive React provides for exactly this, and it gives a clean server
 * snapshot so there is no hydration mismatch.
 *
 * It ticks every second and is bucketed to the second, so repeated reads
 * inside one render pass agree with each other. A deadline that only moves
 * when the page happens to re-render is worse than useless to someone
 * deciding whether they still have time to finish.
 */

const listeners = new Set<() => void>();
let timer: number | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  // One interval for every countdown on the page rather than one each. A
  // dashboard with a dozen deadlines should not run a dozen timers.
  if (timer === null) {
    timer = window.setInterval(() => {
      for (const l of listeners) l();
    }, 1000);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

const clientSnapshot = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => null;

const pad = (n: number) => String(n).padStart(2, "0");

export function TimeLeft({
  dueAt,
  className,
  compact = false,
}: {
  dueAt: string;
  className?: string;
  /** Drops the "left" suffix, for tight table cells. */
  compact?: boolean;
}) {
  const second = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const due = new Date(dueAt);

  // Server render: show the absolute deadline. It is correct without a clock
  // and it is what the client replaces on hydration.
  if (second === null) {
    return (
      <span className={cn("text-micro text-muted", className)}>
        Due{" "}
        {new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(due)}
      </span>
    );
  }

  const ms = due.getTime() - second * 1000;

  if (ms <= 0) {
    return (
      <span className={cn("text-micro font-medium text-critical tabular", className)}>
        Past the deadline
      </span>
    );
  }

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  // Under a day, every second matters. Over a day, seconds are noise.
  const clock =
    days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const urgent = total < 3600;
  const soon = total < 86400;

  return (
    <span
      className={cn(
        "text-micro tabular",
        urgent
          ? "font-semibold text-critical"
          : soon
            ? "font-medium text-warning"
            : "text-muted",
        className,
      )}
      // A screen reader should not hear a value that changes every second.
      aria-label={`Deadline ${new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(due)}`}
    >
      <span aria-hidden="true">
        {clock}
        {compact ? null : " left"}
      </span>
    </span>
  );
}
