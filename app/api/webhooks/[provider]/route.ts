import { NextResponse } from "next/server";

// Easypaisa Bank QR payments require human verification. No webhook may activate
// an account, even if an old provider secret remains in the environment.
export async function POST() {
  return NextResponse.json(
    { error: "Automated payment providers are disabled. Payments require Easypaisa Bank receipt verification." },
    { status: 410 },
  );
}
