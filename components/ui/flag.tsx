import { getCountry, countryName, TRACK_FLAG, TRACK_LABELS, type Track } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * Country flag.
 *
 * Flags are the one place full colour enters an otherwise monochrome system,
 * so they are kept small, fixed at 4:3, and given a hairline border. Without
 * the border the white band on the Pakistan flag and the white in the UK,
 * US and Canadian flags bleed straight into a white card and the shape falls
 * apart.
 *
 * Plain <img> rather than next/image on purpose: these are tiny local SVGs,
 * the optimiser cannot rasterise SVG anyway, and routing them through it would
 * add a request each to return identical bytes.
 */
export function Flag({
  code,
  size = 16,
  className,
  decorative = true,
}: {
  code: string | null | undefined;
  size?: number;
  className?: string;
  /** Set false when the flag is the only thing identifying the country. */
  decorative?: boolean;
}) {
  const country = getCountry(code);
  const height = Math.round((size / 4) * 3);

  // Unknown code, or a country we have no SVG for, gets a line drawn globe so
  // it still reads as "a place" rather than a broken image.
  if (!country?.hasFlag) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xs border border-line bg-surface text-muted",
          className,
        )}
        style={{ width: size, height }}
      >
        <svg
          viewBox="0 0 24 24"
          width={Math.round(size * 0.7)}
          height={Math.round(size * 0.7)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden={decorative ? "true" : undefined}
          role={decorative ? undefined : "img"}
        >
          {!decorative ? <title>{countryName(code)}</title> : null}
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
        </svg>
      </span>
    );
  }

  return (
    /* Tiny local SVGs. next/image cannot rasterise SVG, so routing these
       through the optimiser adds a request each to return identical bytes.
       Width and height are set explicitly, so each flag reserves its own
       space and contributes nothing to CLS. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country.code.toLowerCase()}.svg`}
      alt={decorative ? "" : country.name}
      aria-hidden={decorative ? "true" : undefined}
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn(
        "inline-block shrink-0 rounded-xs border border-line object-cover",
        className,
      )}
      style={{ width: size, height }}
    />
  );
}

/**
 * Flag plus country name. The default way a country appears anywhere in the
 * product, because a flag alone is not readable for everyone.
 */
export function CountryChip({
  code,
  size = "md",
  showName = true,
  className,
}: {
  code: string | null | undefined;
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
}) {
  const name = countryName(code);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xs",
        size === "sm" ? "text-micro" : "text-small",
        className,
      )}
    >
      <Flag code={code} size={size === "sm" ? 16 : 20} decorative={showName} />
      {showName ? <span>{name}</span> : <span className="sr-only">{name}</span>}
    </span>
  );
}

/**
 * A leaderboard track. Global covers everywhere else, so it has no single
 * flag and falls back to the globe.
 */
export function TrackChip({
  track,
  size = "md",
  className,
}: {
  track: Track;
  size?: "sm" | "md";
  className?: string;
}) {
  const code = TRACK_FLAG[track];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        size === "sm" ? "text-micro" : "text-small",
        className,
      )}
    >
      <Flag code={code} size={size === "sm" ? 16 : 20} />
      <span>{TRACK_LABELS[track]}</span>
    </span>
  );
}
