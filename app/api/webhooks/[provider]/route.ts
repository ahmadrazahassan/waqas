import { NextResponse } from "next/server";

// JazzCash QR payments require human verification. No webhook may activate
// an account, even if an old provider secret remains in the environment.
export async function POST() {
  return NextResponse.json(
    { error: "Automated payment providers are disabled. Payments require JazzCash receipt verification." },
    { status: 410 },
  );
}
