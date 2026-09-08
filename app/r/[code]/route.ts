import { NextResponse, type NextRequest } from "next/server";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_LAST_COOKIE,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  isValidCodeShape,
  normaliseCode,
} from "@/lib/referral/code";

/**
 * Referral capture. https://assignwork.co.uk/r/AW7K4Q2M
 *
 * Attribution model, from section 7.3 of the spec:
 *   - First touch wins, for 90 days. aw_ref is written only if absent.
 *   - aw_ref_last records last touch for analytics and never pays.
 *   - aw_visitor ties clicks to a later signup without a third party.
 *
 * Deep links are supported so a member sharing a campaign page can send people
 * straight to it: /r/AW7K4Q2M?to=/prizes/umrah. Only same origin paths are
 * honoured, so this cannot be used as an open redirect.
 *
 * PHASE 3 TODO: look the code up in `referral_codes`, reject codes belonging
 * to suspended members, insert a `referral_clicks` row with a hashed IP and
 * user agent, and upsert `referral_attributions`. Rate limit by hashed IP at
 * 30 requests a minute. None of that can happen before Supabase is wired up,
 * so for now this validates shape and sets the cookies.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  // Next 16: params is a Promise.
  const { code: rawCode } = await params;
  const code = normaliseCode(rawCode);

  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  // Never follow an absolute URL from a query string. Same origin paths only.
  const destination =
    to && to.startsWith("/") && !to.startsWith("//") ? to : "/";

  const target = new URL(destination, url.origin);

  if (!isValidCodeShape(code)) {
    // Unknown shape: send them to the site, set nothing, credit nobody.
    return NextResponse.redirect(target, { status: 307 });
  }

  target.searchParams.set("ref", code);
  const response = NextResponse.redirect(target, { status: 307 });

  const secure = url.protocol === "https:";
  const base = {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  } as const;

  // First touch wins: only write aw_ref if it is not already set.
  if (!request.cookies.get(REFERRAL_COOKIE)) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      ...base,
      maxAge: REFERRAL_COOKIE_MAX_AGE,
    });
  }

  // Last touch, for analytics only. This one always overwrites.
  response.cookies.set(REFERRAL_LAST_COOKIE, code, {
    ...base,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });

  if (!request.cookies.get(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      ...base,
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }

  return response;
}
