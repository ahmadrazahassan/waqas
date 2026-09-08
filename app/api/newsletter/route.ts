import { NextResponse, type NextRequest } from "next/server";

/**
 * Footer newsletter form target.
 *
 * PHASE 13 TODO: write to a `subscribers` table and send a double opt in
 * confirmation through Resend. Under UK GDPR a marketing list needs explicit
 * consent, so the confirmation email is not optional.
 *
 * Until then this validates the address and redirects back with a status, so
 * the form degrades honestly rather than appearing to subscribe someone to a
 * list that does not exist.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const target = new URL("/", request.url);
  target.hash = valid ? "newsletter-pending" : "newsletter-invalid";

  return NextResponse.redirect(target, { status: 303 });
}
