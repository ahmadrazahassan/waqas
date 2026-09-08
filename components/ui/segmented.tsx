"use client";

import { cn } from "@/lib/utils";

/**
 * Rectangular segmented control. Explicitly not a pill, not a toggle switch.
 * Used for the pricing interval, the leaderboard track, and anywhere else a
 * small set of mutually exclusive options needs choosing.
 *
 * Implemented as a radiogroup so arrow keys work and screen readers announce
 * the selection, rather than as a row of buttons.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + dir + options.length) % options.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-sm border border-line bg-surface p-1",
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xs px-4 py-2 text-small font-medium transition-colors duration-200 ease-[var(--ease-state)]",
              selected
                ? "bg-ink text-white"
                : "text-muted hover:text-ink",
            )}
          >
            {option.label}
            {option.hint ? (
              <span
                className={cn(
                  "ms-2 text-micro",
                  selected ? "text-lime" : "text-muted",
                )}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
