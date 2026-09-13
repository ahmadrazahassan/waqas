import test from "node:test";
import assert from "node:assert/strict";
import { normalisePhone, formatPhone } from "../lib/phone.ts";

const ok = (raw: string, country: string) => {
  const r = normalisePhone(raw, country);
  assert.equal(r.ok, true, `${raw} (${country}) should be accepted`);
  return r.ok ? r.e164 : "";
};

test("Pakistani numbers in every common local form normalise to E.164", () => {
  for (const raw of ["03001234567", "0300 1234567", "0300-1234567", "3001234567", "923001234567", "+92 300 1234567", "0092 300 1234567", "(0300) 123-4567"]) {
    assert.equal(ok(raw, "PK"), "+923001234567");
  }
});

test("Pakistani landlines and short numbers are rejected", () => {
  for (const raw of ["0421234567", "+92421234567", "0300123", "", "0300abc4567", "+92 300 1234567 +1"]) {
    assert.equal(normalisePhone(raw, "PK").ok, false, raw);
  }
});

test("other countries use their own dialling code", () => {
  assert.equal(ok("07700 900123", "GB"), "+447700900123");
  assert.equal(ok("050 123 4567", "AE"), "+971501234567");
  assert.equal(ok("(415) 555-2671", "US"), "+14155552671");
  assert.equal(ok("+923001234567", "GB"), "+923001234567");
});

test("somewhere else must include a country code", () => {
  assert.equal(normalisePhone("01234567890", "OT").ok, false);
  assert.equal(ok("+8613800138000", "OT"), "+8613800138000");
});

test("display formatting", () => {
  assert.equal(formatPhone("+923001234567"), "+92 300 1234567");
  assert.equal(formatPhone("+447700900123"), "+44 7700 900123");
  assert.equal(formatPhone("+14155552671"), "+1 415 555 2671");
  assert.equal(formatPhone(null), "");
});
