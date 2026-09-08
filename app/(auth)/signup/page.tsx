import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell, SignupAside } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Join Assignwork. One payment from 5,000 PKR, and 40% on everyone you bring in.",
  robots: { index: false, follow: true },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; confirm?: string }>;
}) {
  // Next 16: both of these are Promises and must be awaited.
  const [{ ref, confirm }, jar] = await Promise.all([searchParams, cookies()]);

  // First touch wins. The cookie set by /r/[code] takes precedence over a
  // query param appended later, which is the whole point of the attribution
  // model in the spec.
  const referralCode = jar.get("aw_ref")?.value ?? ref;

  if (confirm) {
    return (
      <AuthShell aside={<SignupAside referralCode={referralCode} />}>
        <div>
          <p className="inline-block rounded-xs bg-lime px-2 py-1 text-eyebrow uppercase text-ink">
            Account created
          </p>
          <h1 className="mt-5 text-h2">Confirm your email</h1>
          <p className="mt-4 text-body text-muted">
            We have sent a confirmation link to the address you signed up with.
            Open it and you will be logged straight in. It usually arrives
            within a minute, and it is worth checking your spam folder.
          </p>
          <p className="mt-4 text-small text-muted">
            Your account exists already, so nothing is lost if you close this
            page. Come back and log in once you have confirmed.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex h-12 items-center rounded-sm border border-line px-5 text-small font-medium transition-colors duration-200 hover:border-ink"
          >
            Go to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={<SignupAside referralCode={referralCode} />}>
      <AuthForm mode="signup" referralCode={referralCode} />
    </AuthShell>
  );
}
