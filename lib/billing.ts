/** The only incoming payment method. Withdrawals are separate. */
export const jazzCash = {
  id: "jazzcash",
  name: "JazzCash",
  recipient: "Muhammad Waqas",
  accountLabel: "9104",
  qrPath: "/images/payments/jazzcash-qr.png",
  proofBucket: "payment-proofs",
  maxProofBytes: 5 * 1024 * 1024,
} as const;

export const REVIEW_WINDOW_MS = 6 * 60 * 60 * 1000;

export function reviewDeadline(submittedAt: string): number {
  return new Date(submittedAt).getTime() + REVIEW_WINDOW_MS;
}

export function reviewClock(submittedAt: string, now: number) {
  const deadline = reviewDeadline(submittedAt);
  const valid = Number.isFinite(deadline) && Number.isFinite(now);
  const seconds = valid ? Math.min(21600, Math.max(0, Math.ceil((deadline - now) / 1000))) : 0;
  return {
    valid,
    overdue: valid && now >= deadline,
    hours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    seconds: String(seconds % 60).padStart(2, "0"),
  };
}

export function proofMime(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length < 12) return null;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export function ownsPaymentProof(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`) && /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(path);
}

export function hasPaidAccess(profileStatus: string, membership: { status: string; expires_at: string | null; revoked_at: string | null } | null, now: number) {
  return profileStatus === "active" && membership?.status === "active" && !membership.revoked_at &&
    (!membership.expires_at || new Date(membership.expires_at).getTime() > now);
}
