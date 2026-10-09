import { test } from "node:test";
import assert from "node:assert/strict";
import { runCommissionSchedule } from "../lib/cloudflare-schedule.mjs";

test("scheduled clearing requires a secret before making any request", async () => {
  await assert.rejects(runCommissionSchedule({}), /secret is missing/);
});

test("scheduled clearing uses the internal binding and authenticates the existing endpoint", async () => {
  let request;
  const env = {
    CRON_SECRET: "test-only-secret",
    NEXT_PUBLIC_SITE_URL: "https://example.test",
    WORKER_SELF_REFERENCE: { fetch: async (input) => {
      request = input;
      return Response.json({ ok: true, cleared: 0 });
    } },
  };
  await runCommissionSchedule(env);
  assert.equal(request.url, "https://example.test/api/cron/commissions");
  assert.equal(request.headers.get("authorization"), "Bearer test-only-secret");
  assert.equal(request.method, "GET");
});

test("HTTP and application errors fail the cron invocation instead of reporting success", async () => {
  for (const response of [new Response("internal details", { status: 500 }), Response.json({ ok: false })]) {
    await assert.rejects(runCommissionSchedule({
      CRON_SECRET: "test-only-secret",
      WORKER_SELF_REFERENCE: { fetch: async () => response },
    }), /Commission cron/);
  }
});
