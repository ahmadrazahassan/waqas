/* ==========================================================================
   COUNTRIES

   One list, used by the signup selector, the leaderboard tracks, the admin
   member table and every country chip. Adding a country here and dropping the
   matching SVG into public/flags is the whole job.

   `track` maps a country onto the leaderboard board it competes on, so the
   mapping lives next to the country rather than being re-derived in three
   different components.
   ========================================================================== */

export type Track = "pk" | "uk" | "global";

export type Country = {
  code: string;
  name: string;
  /** Present when there is a flag SVG in public/flags. */
  hasFlag: boolean;
  track: Track;
};

export const COUNTRIES: Country[] = [
  { code: "PK", name: "Pakistan", hasFlag: true, track: "pk" },
  { code: "GB", name: "United Kingdom", hasFlag: true, track: "uk" },
  { code: "AE", name: "United Arab Emirates", hasFlag: true, track: "global" },
  { code: "SA", name: "Saudi Arabia", hasFlag: true, track: "global" },
  { code: "US", name: "United States", hasFlag: true, track: "global" },
  { code: "CA", name: "Canada", hasFlag: true, track: "global" },
  { code: "OT", name: "Somewhere else", hasFlag: false, track: "global" },
];

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return byCode.get(code.toUpperCase());
}

export function countryName(code: string | null | undefined): string {
  return getCountry(code)?.name ?? code ?? "Unknown";
}

/** Which leaderboard board a member competes on. */
export function trackFor(code: string | null | undefined): Track {
  return getCountry(code)?.track ?? "global";
}

export const TRACK_LABELS: Record<Track, string> = {
  pk: "Pakistan",
  uk: "United Kingdom",
  global: "Global",
};

/** The flag shown against a whole track. Global has no single country. */
export const TRACK_FLAG: Record<Track, string | null> = {
  pk: "PK",
  uk: "GB",
  global: null,
};
