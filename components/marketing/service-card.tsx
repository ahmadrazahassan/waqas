"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Flat card on a flat page. Separation comes from the tonal shift and the 1px
 * gap, never from a shadow. The circular + is the one permitted circle in the
 * layout; on hover the card border goes ink and the + rotates 90 degrees.
 * Nothing lifts, nothing scales, nothing glows.
 */
export function ServiceCard({
  title,
  body,
  illustration,
}: {
  title: string;
  body: string;
  illustration: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div
      className={cn(
        "group relative flex min-h-60 flex-col justify-between rounded-md border bg-surface-alt p-8 transition-colors duration-200 ease-[var(--ease-state)]",
        open ? "border-ink" : "border-transparent hover:border-ink",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="absolute top-6 right-6 z-10 grid size-7 place-items-center rounded-full border border-line bg-surface text-ink transition-transform duration-200 ease-[var(--ease-state)] group-hover:border-ink"
        style={{ transform: open ? "rotate(45deg)" : undefined }}
      >
        <Plus size={14} strokeWidth={1.25} />
        <span className="sr-only">
          {open ? "Hide details for" : "Show details for"} {title}
        </span>
      </button>

      <div className="text-ink">{illustration}</div>

      <div className="mt-8">
        <h3 className="text-h4">{title}</h3>

        <div
          id={id}
          hidden={!open}
          className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-entrance)]"
        >
          <p className="mt-3 max-w-[42ch] text-small text-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}
