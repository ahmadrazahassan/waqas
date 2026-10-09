export const dynamic = "force-dynamic";

// Liveness only: no database queries, secrets, user data or infrastructure details.
export function GET() {
  return Response.json({ status: "ok" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
