import { timingSafeEqual } from "node:crypto";
import { clearMatureCommissions } from "@/lib/commission-clearing";

export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await clearMatureCommissions();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[commission-cron] clearing failed", error);
    return Response.json({ ok: false, error: "Commission clearing failed" }, { status: 500 });
  }
}
