/* ==========================================================================
   PHONE NUMBERS

   Stored once, in E.164 (+923001234567), in profiles.phone_e164. Members type
   numbers the way they say them, so this accepts the local forms too:

     Pakistan   0300 1234567 · 300-1234567 · 92 300 1234567 · +92 300 1234567
     elsewhere  the national number, or anything starting with + or 00

   No imports, so node's test runner can load this file directly.
   ========================================================================== */

/** International dialling codes for the countries offered at signup. */
export const DIAL_CODES: Record<string, string> = {
  PK: "92",
  GB: "44",
  AE: "971",
  SA: "966",
  US: "1",
  CA: "1",
};

export type PhoneResult = { ok: true; e164: string } | { ok: false; error: string };

const E164 = /^\+[1-9]\d{7,14}$/;

export function normalisePhone(raw: string, countryCode: string): PhoneResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Enter your mobile number." };
  if (/[^\d\s()+.-]/.test(input)) {
    return { ok: false, error: "Use digits only, for example 0300 1234567." };
  }

  let digits = input.replace(/[^\d+]/g, "");
  const dial = DIAL_CODES[countryCode.toUpperCase()];

  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;

  if (!digits.startsWith("+")) {
    if (!dial) {
      return {
        ok: false,
        error: "Include your country code, starting with +.",
      };
    }
    if (digits.startsWith("0")) {
      // Trunk prefix: 0300 1234567 is +92 300 1234567.
      digits = `+${dial}${digits.slice(1)}`;
    } else if (digits.startsWith(dial) && digits.length - dial.length >= 9) {
      digits = `+${digits}`;
    } else {
      digits = `+${dial}${digits}`;
    }
  }

  if (digits.indexOf("+", 1) !== -1 || !E164.test(digits)) {
    return { ok: false, error: "That number does not look right. Check it and try again." };
  }

  // Pakistani accounts are paid through mobile wallets, so the number has to
  // be a mobile: +92 3XX XXXXXXX.
  if (digits.startsWith("+92") && !/^\+923\d{9}$/.test(digits)) {
    return {
      ok: false,
      error: "Use a Pakistani mobile number, for example 0300 1234567.",
    };
  }

  return { ok: true, e164: digits };
}

/** Readable form for screens. Falls back to the stored value untouched. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const pk = /^\+92(3\d{2})(\d{7})$/.exec(e164);
  if (pk) return `+92 ${pk[1]} ${pk[2]}`;
  const gb = /^\+44(7\d{3})(\d{6})$/.exec(e164);
  if (gb) return `+44 ${gb[1]} ${gb[2]}`;
  const nanp = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (nanp) return `+1 ${nanp[1]} ${nanp[2]} ${nanp[3]}`;
  for (const code of ["971", "966"]) {
    if (e164.startsWith(`+${code}`)) return `+${code} ${e164.slice(code.length + 1)}`;
  }
  return e164;
}
