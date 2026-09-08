/**
 * Thin isometric line drawings, in the manner of the Hydra reference.
 * One stroke weight, no fill, no colour, 96px grid, currentColor.
 *
 * These are deliberately geometric rather than pictorial. If commissioned
 * artwork lands later, drop the SVGs into /public/illustrations and swap the
 * component body. The API stays the same.
 */

type Props = { size?: number; className?: string };

function Iso({ size = 96, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Paid tasks: a stack of briefs waiting to be claimed. */
export function TasksIllustration(props: Props) {
  return (
    <Iso {...props}>
      <path d="M48 9 L70 20 L48 31 L26 20 Z" />
      <path d="M48 33 L70 44 L48 55 L26 44 Z" />
      <path d="M48 57 L70 68 L48 79 L26 68 Z" />
      <path d="M26 20 L26 22" />
      <path d="M70 20 L70 22" />
      <path d="M26 44 L26 46" />
      <path d="M70 44 L70 46" />
    </Iso>
  );
}

/** Referral commission: one node, then two, then four. Three levels, no more. */
export function ReferralIllustration(props: Props) {
  return (
    <Iso {...props}>
      <path d="M48 13.5 L56 18 L48 22.5 L40 18 Z" />
      <path d="M28 39.5 L36 44 L28 48.5 L20 44 Z" />
      <path d="M68 39.5 L76 44 L68 48.5 L60 44 Z" />
      <path d="M16 66.5 L22 70 L16 73.5 L10 70 Z" />
      <path d="M40 66.5 L46 70 L40 73.5 L34 70 Z" />
      <path d="M56 66.5 L62 70 L56 73.5 L50 70 Z" />
      <path d="M80 66.5 L86 70 L80 73.5 L74 70 Z" />
      <path d="M48 22.5 L28 39.5" />
      <path d="M48 22.5 L68 39.5" />
      <path d="M28 48.5 L16 66.5" />
      <path d="M28 48.5 L40 66.5" />
      <path d="M68 48.5 L56 66.5" />
      <path d="M68 48.5 L80 66.5" />
    </Iso>
  );
}

/** Level progression: six levels, earned, never bought. */
export function RankIllustration(props: Props) {
  return (
    <Iso {...props}>
      <path d="M22 46 L34 53 L22 60 L10 53 Z" />
      <path d="M10 53 L22 60 L22 70 L10 63 Z" />
      <path d="M34 53 L22 60 L22 70 L34 63 Z" />

      <path d="M48 36 L60 43 L48 50 L36 43 Z" />
      <path d="M36 43 L48 50 L48 70 L36 63 Z" />
      <path d="M60 43 L48 50 L48 70 L60 63 Z" />

      <path d="M74 26 L86 33 L74 40 L62 33 Z" />
      <path d="M62 33 L74 40 L74 70 L62 63 Z" />
      <path d="M86 33 L74 40 L74 70 L86 63 Z" />
    </Iso>
  );
}

/** Leaderboard prizes: a podium, decided on published points. */
export function PrizeIllustration(props: Props) {
  return (
    <Iso {...props}>
      <path d="M48 12 L55 16 L48 20 L41 16 Z" />
      <path d="M48 20 L48 27" />

      <path d="M22 40 L34 47 L22 54 L10 47 Z" />
      <path d="M10 47 L22 54 L22 70 L10 63 Z" />
      <path d="M34 47 L22 54 L22 70 L34 63 Z" />

      <path d="M48 28 L60 35 L48 42 L36 35 Z" />
      <path d="M36 35 L48 42 L48 70 L36 63 Z" />
      <path d="M60 35 L48 42 L48 70 L60 63 Z" />

      <path d="M74 44 L86 51 L74 58 L62 51 Z" />
      <path d="M62 51 L74 58 L74 70 L62 63 Z" />
      <path d="M86 51 L74 58 L74 70 L86 63 Z" />
    </Iso>
  );
}

/**
 * The concentric arc graphic for the lime half of the split panel.
 * Thin ink strokes, no fill, radiating from the lower left corner.
 */
export function ArcField({ className }: { className?: string }) {
  const radii = [40, 78, 116, 154, 192, 230, 268, 306, 344];
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMinYMax slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
      className={className}
    >
      {radii.map((r) => (
        <path key={r} d={`M ${r} 400 A ${r} ${r} 0 0 0 0 ${400 - r}`} />
      ))}
    </svg>
  );
}
