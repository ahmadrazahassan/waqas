import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

/**
 * Provider agnostic payment webhook.
 *
 * POST /api/webhooks/<provider>
 *
 * Three rules this endpoint exists to enforce:
 *
 *   1. Verify before you trust. The raw body is HMAC checked against a shared
 *      secret with a constant time compare. An unsigned request is refused
 *      outright, never "processed anyway because it looked right".
 *   2. Record before you act. Every event is written to provider_events keyed
 *      on (provider, event_id) BEFORE anything is processed. A redelivery hits
 *      the unique constraint and returns 200 without paying anyone twice.
 *   3. One door. Money only ever moves through record_payment and
 *      refund_payment, exactly as an admin confirming a bank transfer does.
 *      A new provider is a new secret and a new mapping, nothing more.
 *
 * PHASE NOTE: no card provider is contracted yet, so the only configured
 * secret is for whichever PSP is chosen. Until then this returns 501 rather
 * than pretending to be wired.
 */

type NormalisedEvent = {
  id: string;
  type: "payment.succeeded" | "payment.refunded" | "ignored";
  userId?: string;
  planId?: number;
  grossMinor?: number;
  interval?: "month" | "year";
  providerRef?: string;
  reason?: string;
};

/** Per provider secret. Add one env var per rail. */
function secretFor(provider: string): string | undefined {
  const key = `WEBHOOK_SECRET_${provider.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  return process.env[key];
}

function verify(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = signature.replace(/^sha256=/, "");

  // Length must match before timingSafeEqual, which throws on a mismatch.
  if (given.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

/**
 * Map a provider's own shape onto ours. Everything provider specific lives
 * here and nowhere else, which is what keeps the rest of the system from
 * caring who took the money.
 */
function normalise(provider: string, payload: Record<string, unknown>): NormalisedEvent {
  switch (provider) {
    // Example shape. Replace with the real one when a PSP is contracted.
    case "safepay":
    case "payfast": {
      const data = (payload.data ?? {}) as Record<string, unknown>;
      const meta = (data.metadata ?? {}) as Record<string, unknown>;
      const type = String(payload.type ?? "");

      if (type.endsWith("succeeded") || type.endsWith("paid")) {
        return {
          id: String(payload.id ?? ""),
          type: "payment.succeeded",
          userId: String(meta.user_id ?? ""),
          planId: Number(meta.plan_id ?? 0),
          grossMinor: Number(data.amount ?? 0),
          interval: (meta.interval as "month" | "year") ?? "month",
          providerRef: String(data.reference ?? payload.id ?? ""),
        };
      }

      if (type.endsWith("refunded")) {
        return {
          id: String(payload.id ?? ""),
          type: "payment.refunded",
          providerRef: String(data.reference ?? ""),
          reason: String(data.reason ?? "Refunded by the provider"),
        };
      }

      return { id: String(payload.id ?? ""), type: "ignored" };
    }

    default:
      return { id: String(payload.id ?? ""), type: "ignored" };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  // Next 16: params is a Promise.
  const { provider } = await params;

  const secret = secretFor(provider);
  if (!secret) {
    return NextResponse.json(
      {
        error: `No webhook secret configured for "${provider}".`,
        hint: `Set WEBHOOK_SECRET_${provider.toUpperCase()} once that provider is contracted.`,
      },
      { status: 501 },
    );
  }

  if (!hasServiceRole()) {
    // Fail loudly rather than silently dropping a real payment.
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set." },
      { status: 500 },
    );
  }

  // Raw body, not request.json(): the signature is over the exact bytes sent.
  const raw = await request.text();
  const signature =
    request.headers.get("x-signature") ??
    request.headers.get("x-webhook-signature");

  if (!verify(raw, signature, secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body was not JSON" }, { status: 400 });
  }

  const event = normalise(provider, payload);
  if (!event.id) {
    return NextResponse.json({ error: "Event had no id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Record first. The unique index on (provider, event_id) is what makes a
  // redelivery harmless.
  const { error: insertError } = await admin.from("provider_events").insert({
    provider,
    event_id: event.id,
    event_type: event.type,
    payload: payload as never,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // Already seen. Acknowledge so the provider stops retrying.
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }

  try {
    if (event.type === "payment.succeeded") {
      if (!event.userId || !event.planId || !event.grossMinor) {
        throw new Error("Event was missing user, plan or amount");
      }

      await admin.rpc("record_payment", {
        p_user: event.userId,
        p_plan: event.planId,
        p_gross_minor: event.grossMinor,
        p_interval: event.interval ?? "month",
        p_provider: provider,
        p_provider_ref: event.providerRef ?? event.id,
      });
    }

    if (event.type === "payment.refunded" && event.providerRef) {
      const { data: payment } = await admin
        .from("payments")
        .select("id")
        .eq("provider", provider)
        .eq("provider_ref", event.providerRef)
        .maybeSingle();

      if (payment) {
        await admin.rpc("refund_payment", {
          p_payment_id: payment.id,
          p_reason: event.reason ?? "Refunded",
        });
      }
    }

    await admin
      .from("provider_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", provider)
      .eq("event_id", event.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Keep the event row with the error on it so a human can replay it.
    await admin
      .from("provider_events")
      .update({ error: (e as Error).message })
      .eq("provider", provider)
      .eq("event_id", event.id);

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
