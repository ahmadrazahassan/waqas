import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Container. 1440px max, gutters 20 / 32 / 40.
   -------------------------------------------------------------------------- */

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("container-site", className)}>{children}</div>;
}

/* --------------------------------------------------------------------------
   Section. 72px mobile, 112px tablet, 160px desktop. Whitespace is the design,
   so resist the urge to trim this when a section looks empty.
   -------------------------------------------------------------------------- */

export function Section({
  className,
  children,
  bleed = false,
  id,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  /** Full bleed sections break the container and set their own padding. */
  bleed?: boolean;
  id?: string;
} & React.ComponentProps<"section">) {
  return (
    <section id={id} className={cn(!bleed && "section-y", className)} {...props}>
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}

/* --------------------------------------------------------------------------
   Eyebrow. 11px, uppercase, 0.14em tracking, lime fill, ink text.
   Sits 24px above its heading. Every major marketing section has one.
   -------------------------------------------------------------------------- */

export function Eyebrow({
  children,
  tone = "lime",
  className,
}: {
  children: React.ReactNode;
  /** `outline` is for dark panels where a lime block would shout. */
  tone?: "lime" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-xs px-2 py-1 text-eyebrow uppercase",
        tone === "lime"
          ? "bg-lime text-ink"
          : "border border-line-dark text-white/70",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Section header. Eyebrow, then heading, then optional lead.
   -------------------------------------------------------------------------- */

export function SectionHeader({
  eyebrow,
  heading,
  lead,
  align = "start",
  tone = "light",
  className,
  children,
}: {
  eyebrow?: string;
  heading: React.ReactNode;
  lead?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow tone={tone === "dark" ? "outline" : "lime"}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        className={cn(
          "text-h2 max-w-[24ch]",
          eyebrow && "mt-6",
          tone === "dark" ? "text-white" : "text-ink",
          align === "center" && "max-w-[28ch]",
        )}
      >
        {heading}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-5 max-w-[58ch] text-lead",
            tone === "dark" ? "text-white/70" : "text-muted",
          )}
        >
          {lead}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Rank badge. Rectangular, 22px, tonal ink scale. Not eight colours.
   -------------------------------------------------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "lime" | "ink" | "outline" | "positive";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-alt text-ink",
    lime: "bg-lime text-ink",
    ink: "bg-ink text-white",
    outline: "border border-line text-muted",
    positive: "bg-positive/10 text-positive",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-xs px-2 text-micro uppercase tracking-[0.06em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Development marker for invented figures.

   Section 13: every number in shipped copy is real or the section does not
   ship. This draws a dashed outline around placeholder data in development
   only, so nobody forgets what still needs replacing. It renders nothing in
   production, which is exactly why `statsAreReal` must be flipped before then.
   -------------------------------------------------------------------------- */

export function DevPlaceholder({
  children,
  label = "placeholder",
  active,
}: {
  children: React.ReactNode;
  label?: string;
  active: boolean;
}) {
  if (!active || process.env.NODE_ENV === "production") return <>{children}</>;

  return (
    <div className="relative outline-1 outline-offset-4 outline-dashed outline-critical/40">
      <span className="pointer-events-none absolute top-0 right-0 z-10 rounded-xs bg-critical px-1.5 py-0.5 text-[9px] font-medium tracking-[0.08em] text-white uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Status dot. Colour is never the only carrier of meaning, so this is always
   rendered next to text.
   -------------------------------------------------------------------------- */

export function Dot({ tone = "positive" }: { tone?: "positive" | "muted" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-1.5 rounded-full",
        tone === "positive" ? "bg-positive" : "bg-muted",
      )}
    />
  );
}
