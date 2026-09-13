import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { incomingPayment, usesPaymentProofBucket, ownsPaymentProof, proofMime } from "@/lib/billing";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!hasServiceRole()) return new NextResponse(null, { status: 503 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const admin = createAdminClient();
  const { data: declaration } = await admin.from("payment_declarations")
    .select("user_id, proof_path, method").eq("id", id).maybeSingle();
  const finance = user.roles.some(role => ["finance", "admin", "owner"].includes(role)) && user.profile.status === "active";
  if (!declaration || (!finance && declaration.user_id !== user.id)) return new NextResponse(null, { status: 404 });
  if (!declaration.proof_path || (usesPaymentProofBucket(declaration.method) && !ownsPaymentProof(declaration.user_id, declaration.proof_path))) return new NextResponse(null, { status: 404 });
  // Legacy bank receipts remain available to authorised reviewers.
  if (!declaration.proof_path.startsWith(`${declaration.user_id}/`)) return new NextResponse(null, { status: 404 });
  const { data, error } = await admin.storage.from(usesPaymentProofBucket(declaration.method) ? incomingPayment.proofBucket : "submissions").download(declaration.proof_path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  const bytes = await data.arrayBuffer();
  const mime = proofMime(new Uint8Array(bytes));
  if (!mime) return new NextResponse(null, { status: 415 });
  return new NextResponse(bytes, { headers: {
    "Content-Type": mime, "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff", "Content-Disposition": 'inline; filename="payment-receipt"',
    "Content-Security-Policy": "default-src 'none'; sandbox", "Vary": "Cookie",
  } });
}
