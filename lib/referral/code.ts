/* ==========================================================================
   REFERRAL CODES

   Crockford base32: no I, L, O or U, so a code cannot be misread off a screen,
   misheard over the phone, or turned into a word nobody wants printed on a
   share card. Eight characters gives 32^8, about 1.1 x 10^12 combinations.
   ========================================================================== */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

/** Vanity codes (rank 4 and above) must not collide with our own routes. */
const RESERVED = new Set([
  "admin",
  "api",
  "assignwork",
  "blog",
  "careers",
  "contact",
  "dashboard",
  "guides",
  "help",
  "leaderboard",
  "legal",
  "login",
  "logout",
  "pricing",
  "prizes",
  "referrals",
  "settings",
  "signup",
  "support",
  "tasks",
]);

export function generateReferralCode(
  random: () => number = Math.random,
): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return out;
}

/** Shape check only. Whether a code exists is a database question. */
export function isValidCodeShape(code: string): boolean {
  const value = code.trim();
  if (value.length === CODE_LENGTH) {
    return [...value.toUpperCase()].every((c) => ALPHABET.includes(c));
  }
  // Vanity code
  return /^[a-z0-9-]{4,16}$/.test(value.toLowerCase());
}

export function isReservedCode(code: string): boolean {
  return RESERVED.has(code.trim().toLowerCase());
}

export function normaliseCode(code: string): string {
  const value = code.trim();
  return value.length === CODE_LENGTH ? value.toUpperCase() : value.toLowerCase();
}

export const REFERRAL_COOKIE = "aw_ref";
export const REFERRAL_LAST_COOKIE = "aw_ref_last";
export const VISITOR_COOKIE = "aw_visitor";

/** First touch wins, for 90 days. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;
