import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark is a 2px ink rule over the name, echoing the hairline language used
 * everywhere else. No logo glyph, no icon, no gradient.
 */
export function Wordmark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "white";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-baseline gap-2 text-h4 tracking-[-0.03em] transition-opacity duration-200 hover:opacity-70",
        tone === "white" ? "text-white" : "text-ink",
        className,
      )}
      aria-label="Assignwork, home"
    >
      <span
        aria-hidden="true"
        className={cn(
          "block h-2.5 w-2.5 rounded-xs",
          tone === "white" ? "bg-lime" : "bg-lime",
        )}
      />
      <span className="font-semibold">assignwork</span>
    </Link>
  );
}
