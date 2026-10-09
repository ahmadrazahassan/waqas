import handler from "./.open-next/worker.js";
import { runCommissionSchedule } from "./lib/cloudflare-schedule.mjs";

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const canonical = new URL(env.NEXT_PUBLIC_SITE_URL || "https://assignwork.uk");
    if (["www.assignwork.uk", "assignwork.70148590.workers.dev"].includes(url.hostname) || (url.hostname === "assignwork.uk" && url.protocol !== "https:")) {
      url.protocol = canonical.protocol;
      url.host = canonical.host;
      return Response.redirect(url.toString(), 308);
    }
    const original = await handler.fetch(request, env, ctx);
    const response = new Response(original.body, original);
    // Next.js Proxy can return before next.config headers run (e.g. auth redirects).
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    const path = new URL(request.url).pathname;
    if (/^\/(dashboard|admin|api|login|signup|r)(\/|$)/.test(path)) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  },
  async scheduled(_controller, env) {
    await runCommissionSchedule(env);
  },
};

export default worker;
