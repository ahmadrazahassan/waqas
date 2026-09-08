import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell, LoginAside } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Assignwork account.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell aside={<LoginAside />}>
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
