"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * A deadline countdown.
 *
 * The wall clock is an external mutable source, so this reads it through
 * useSyncExternalStore rather than an effect that calls setState. That is the
 * primitive React provides for exactly this, and it also gives a clean server
 * snapshot so there is no hydration mismatch.
 *
 * The snapshot is bucketed to the minute so it stays stable within a render
 * pass. The server renders the absolute deadline, then the client takes over
 * and ticks. A deadline that only updates when the page happens to re-render
 * is worse than useless to someone deciding whether they still have time.
 */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

/** Bucketed to the minute, so repeated calls inside one render agree. */
const clientSnapshot = () => Math.floor(Date.now() / 60_000);
const serverSnapshot = () => null;

export function TimeLeft({
  dueAt,
  className,
}: {
  dueAt: string;
  className?: string;
}) {
  const minute = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const due = new Date(dueAt);

  if (minute === null) {
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

  const ms = due.getTime() - minute * 60_000;
  const overdue = ms <= 0;
  const totalHours = Math.floor(Math.abs(ms) / 3_600_000);
  const days = Math.floor(totalHours / 24);

  const label = overdue
    ? "Past the deadline"
    : days >= 1
      ? `${days} ${days === 1 ? "day" : "days"} left`
      : totalHours >= 1
        ? `${totalHours} ${totalHours === 1 ? "hour" : "hours"} left`
        : `${Math.max(1, Math.floor(Math.abs(ms) / 60_000))} minutes left`;

  return (
    <span
      className={cn(
        "text-micro tabular",
        overdue
          ? "text-critical"
          : totalHours < 24
            ? "text-warning"
            : "text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}
