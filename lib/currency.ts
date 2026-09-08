/* ==========================================================================
   CURRENCY

   PKR is the BASE currency, not a conversion. Plan prices are defined natively
   in paisa in lib/site.ts, so 5,000 PKR is exactly 5,000 PKR with no rounding
   artefact from a rate that moved overnight.

   The other currencies exist so a member outside Pakistan can see roughly what
   a plan costs. They are indicative and the UI says so wherever one is shown.

   ⚠ PLACEHOLDER RATES. These are hardcoded and will drift within days. Before
   launch, replace `ratesFromPkr` with a value fetched daily from a rate
   provider, cached, and stamped with the time it was pulled. A stale rate
   still misleads even with the word "indicative" next to it.
   ========================================================================== */

export const ratesArePlaceholder = true;

export const currencies = [
  { code: "PKR", label: "PKR", symbol: "Rs" },
  { code: "GBP", label: "GBP", symbol: "£" },
  { code: "USD", label: "USD", symbol: "$" },
  { code: "EUR", label: "EUR", symbol: "€" },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

export const BASE_CURRENCY: CurrencyCode = "PKR";

/** How much 1 PKR is worth in each currency. */
export const ratesFromPkr: Record<CurrencyCode, number> = {
  PKR: 1,
  GBP: 1 / 377,
  USD: 1 / 281,
  EUR: 1 / 328,
};

/**
 * Takes paisa and formats it in the display currency.
 *
 * PKR renders as "Rs 5,000" with no decimals, because paisa are not used in
 * practice and "Rs 5,000.00" reads like a spreadsheet. Converted currencies
 * keep two decimals, since the whole point is showing roughly what it costs.
 */
export function convertAndFormat(minorPkr: number, code: CurrencyCode) {
  const rupees = minorPkr / 100;

  if (code === "PKR") {
    return `Rs ${new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: 0,
    }).format(rupees)}`;
  }

  const value = rupees * ratesFromPkr[code];
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** "about £13.26" style, for a one line aside next to a PKR price. */
export function approximateIn(minorPkr: number, code: CurrencyCode) {
  return `about ${convertAndFormat(minorPkr, code)}`;
}
