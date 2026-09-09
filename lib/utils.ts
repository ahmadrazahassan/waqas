import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* --------------------------------------------------------------------------
   tailwind-merge has no idea what is in our @theme block, so it falls back to
   its built-in Tailwind scale. That gets two things badly wrong:

     - `text-small` is not a font size it recognises, so it classifies it as a
       text COLOUR. Merging "text-white ... text-small" then drops text-white
       as a conflict, and the element silently inherits ink. That is how the
       hero's secondary button rendered as an empty box on a black background.
     - `text-ink` and friends are similarly mistaken for font sizes.

   Registering both scales here fixes every component at once. Any token added
   to @theme must be added here too.
   -------------------------------------------------------------------------- */

const FONT_SIZES = [
  "eyebrow",
  "micro",
  "small",
  "body",
  "lead",
  "h4",
  "h3",
  "h2",
  "h1",
  "display",
] as const;

const COLORS = [
  "lime",
  "lime-press",
  "violet",
  "violet-soft",
  "violet-press",
  "bg",
  "surface",
  "surface-alt",
  "ink",
  "ink-soft",
  "muted",
  "line",
  "line-dark",
  "positive",
  "warning",
  "critical",
  "info",
  "depth-1",
  "depth-2",
  "depth-3",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
      "text-color": [{ text: [...COLORS] }],
      "bg-color": [{ bg: [...COLORS] }],
      "border-color": [{ border: [...COLORS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Money is always an integer of minor units. Never a float, never a `number`
 * carried through more than one operation. This formats for display only.
 *
 * PKR is the platform's base currency. It renders as "Rs 5,000" with no
 * decimals, because paisa are not used in practice and Intl's default
 * "PKR 5,000.00" reads like an accounting export rather than a price.
 */
export function formatMoney(
  minor: number,
  currency: "PKR" | "GBP" | "USD" | "EUR" = "PKR",
  opts: { showFraction?: boolean } = {},
) {
  if (currency === "PKR") {
    return `Rs ${new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: 0,
    }).format(Math.round(minor / 100))}`;
  }

  const showFraction = opts.showFraction ?? minor % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: showFraction ? 2 : 0,
  }).format(minor / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

/** UK format throughout: 26 August 2026. */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
