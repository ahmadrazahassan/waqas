import test from "node:test";
import assert from "node:assert/strict";
import { reviewClock, reviewDeadline, REVIEW_WINDOW_MS, proofMime, ownsPaymentProof, hasPaidAccess, paymentQr, usesPaymentProofBucket } from "../lib/billing.ts";

test("payment QRs match exact PKR plan amounts", () => {
  assert.equal(paymentQr(500000), "/images/payments/easypaisa-5000.png");
  assert.equal(paymentQr(800000), "/images/payments/easypaisa-8000.png");
  assert.equal(paymentQr(1000000), "/images/payments/easypaisa-10000.png");
  for (const amount of [0, 5000, 8000, 10000, 500001, NaN]) assert.equal(paymentQr(amount), null);
  assert.equal(paymentQr(500000, "USD"), null);
  assert.equal(usesPaymentProofBucket("jazzcash"), true);
  assert.equal(usesPaymentProofBucket("easypaisa"), true);
  assert.equal(usesPaymentProofBucket("card"), false);
});

const start = "2026-09-09T10:00:00.000Z";
const now = Date.parse(start);
test("review deadline is exactly six hours after persisted submission", () => {
  assert.equal(reviewDeadline(start), now + REVIEW_WINDOW_MS);
  assert.deepEqual(reviewClock(start, now), { valid: true, overdue: false, hours: "06", minutes: "00", seconds: "00" });
});
test("reload uses original submission, not a new six hour window", () => {
  assert.deepEqual(reviewClock(start, now + 9010000), { valid: true, overdue: false, hours: "03", minutes: "29", seconds: "50" });
});
test("deadline clamps at zero without auto activation", () => {
  for (const elapsed of [REVIEW_WINDOW_MS, REVIEW_WINDOW_MS + 86400000]) {
    assert.deepEqual(reviewClock(start, now + elapsed), { valid: true, overdue: true, hours: "00", minutes: "00", seconds: "00" });
    assert.equal(hasPaidAccess("pending", null, now + elapsed), false);
  }
});
test("invalid and future dates never produce NaN or more than six hours", () => {
  assert.equal(reviewClock("invalid", now).valid, false);
  assert.equal(reviewClock(start, now - 300000).hours, "06");
});
test("only recognised image signatures are accepted", () => {
  assert.equal(proofMime(Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0])), "image/png");
  assert.equal(proofMime(Uint8Array.from([255,216,255,224,0,0,0,0,0,0,0,0])), "image/jpeg");
  assert.equal(proofMime(new TextEncoder().encode("RIFF0000WEBP")), "image/webp");
  for (const text of ["%PDF receipt", "<svg>fake screenshot</svg>", "<script>alert(1)</script>", "short"]) assert.equal(proofMime(new TextEncoder().encode(text)), null);
});
test("proof paths cannot cross member folders or use traversal", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const file = "22222222-2222-4222-8222-222222222222.png";
  assert.equal(ownsPaymentProof(id, `${id}/${file}`), true);
  for (const path of [`someone-else/${file}`, `${id}/../${file}`, `${id}/${file}/extra`, `${id}/${file}.svg`]) assert.equal(ownsPaymentProof(id, path), false);
});
test("access requires an active profile and unrevoked, unexpired paid membership", () => {
  const member = { status: "active", expires_at: null, revoked_at: null };
  assert.equal(hasPaidAccess("active", member, now), true);
  for (const status of ["pending", "restricted", "suspended", "closed"]) assert.equal(hasPaidAccess(status, member, now), false);
  for (const status of ["trialing", "past_due", "cancelled"]) assert.equal(hasPaidAccess("active", { ...member, status }, now), false);
  assert.equal(hasPaidAccess("active", { ...member, revoked_at: start }, now), false);
  assert.equal(hasPaidAccess("active", { ...member, expires_at: start }, now), false);
});
