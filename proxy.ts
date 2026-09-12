import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jazzCash, paymentsPaused, paymentUnavailableMessage } from "@/lib/billing";

/**
 * Next 16 renamed middleware.ts to proxy.ts, and the exported function to
 * `proxy`. It runs on the Node.js runtime.
 *
 * Two jobs:
 *   1. Refresh the Supabase session so Server Components always see a valid
 *      token. Without this, a member gets logged out mid session.
 *   2. Gate /dashboard and /admin. This is a redirect for good UX, NOT the
 *      security boundary. RLS in Postgres is the boundary; a proxy check can
 *      always be bypassed by calling the API directly.
 */
export async function proxy(request: NextRequest) {
  if (paymentsPaused && request.nextUrl.pathname === jazzCash.qrPath) {
    return new NextResponse(paymentUnavailableMessage, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser, not getSession: this revalidates the token with Supabase rather
  // than trusting a cookie that could have been tampered with.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Staff gate for /admin. Checked again inside every admin page and action.
  if (path.startsWith("/admin") && user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isStaff = (roles ?? []).some((r) =>
      ["reviewer", "support", "finance", "admin", "owner"].includes(r.role),
    );

    if (!isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Already signed in and heading for the auth pages? Send them onward.
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/images/payments/jazzcash-qr.png",
    /*
     * Everything except static assets and image optimisation. The session
     * still needs refreshing on public pages, so this is deliberately broad.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|illustrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
