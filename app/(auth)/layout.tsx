/**
 * The auth routes own their chrome through AuthShell, which needs to know
 * whether it is rendering the signup or the login pitch. This layout is a
 * passthrough so the shell can span the full viewport without a wrapper
 * constraining it.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
