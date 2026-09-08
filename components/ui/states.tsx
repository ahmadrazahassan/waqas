import type Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Keeps typedRoutes checking hrefs that pass through this component. */
type Href<T extends string> = React.ComponentProps<typeof Link<T>>["href"];

/**
 * One line heading, one line of explanation, one action. No illustration,
 * no mascot. An honest empty state beats invented content.
 */
export function EmptyState<T extends string>({
  heading,
  body,
  action,
  className,
}: {
  heading: string;
  body: string;
  action?: { label: string; href: Href<T> };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-md border border-line bg-surface p-8 lg:p-12",
        className,
      )}
    >
      <h3 className="text-h4">{heading}</h3>
      <p className="mt-3 max-w-[56ch] text-body text-muted">{body}</p>
      {action ? (
        <div className="mt-7">
          <ButtonLink href={action.href} variant="tertiary" arrow>
            {action.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A bordered aside for the things we would rather people read than skim past:
 * the income disclosure pointer, the VAT line, the legal review notice.
 * Tone carries a left border rather than a coloured background, so it stays
 * quiet on the page.
 */
export function Callout({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: "neutral" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "border-s-ink",
    warning: "border-s-warning",
    info: "border-s-violet",
  } as const;

  return (
    <aside
      className={cn(
        "border border-line border-s-2 bg-surface p-6",
        tones[tone],
        className,
      )}
    >
      {title ? <p className="text-h4">{title}</p> : null}
      <div
        className={cn(
          "max-w-[68ch] text-small text-muted [&_a]:text-violet [&_a]:underline [&_a]:underline-offset-2",
          title && "mt-2",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
