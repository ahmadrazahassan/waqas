import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";
import { ArcField } from "@/components/marketing/illustrations";
import { DIRECT_COMMISSION_RATE, plans } from "@/lib/site";
import { commissionPerReferral, referralsToBreakEven } from "@/lib/commission";
import { formatMoney } from "@/lib/utils";

/**
 * Two panel auth layout. Ink on the left carrying the one thing worth saying
 * at this moment, form on the right. Same colour blocking as the split panel
 * on the home page, so signing in does not feel like a different product.
 *
 * Below 1024 the ink panel is dropped entirely rather than stacked. On a phone
 * it would push the form below the fold, and someone who clicked "Log in" came
 * to log in, not to read.
 */
export function AuthShell({
  aside,
  children,
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: the pitch. Desktop only. */}
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col">
        <ArcField
          className="absolute inset-0 h-full w-full text-white/10"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Wordmark tone="white" />
          <div className="max-w-[42ch]">{aside}</div>
          <p className="text-micro text-white/60">
            Assignwork Ltd, England and Wales
          </p>
        </div>
      </aside>

      {/* Right: the form. */}
      <div className="flex flex-col">
        <header className="border-b border-line lg:border-b-0">
          <div className="flex h-18 items-center justify-between px-5 md:px-8 lg:px-10">
            <span className="lg:hidden">
              <Wordmark />
            </span>
            <Link
              href="/"
              className="ms-auto inline-flex items-center gap-2 text-small font-medium text-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
              Back to the site
            </Link>
          </div>
        </header>

        <main
          id="main"
          className="flex flex-1 items-center justify-center px-5 py-12 md:px-8 lg:px-10 lg:py-16"
        >
          <div className="w-full max-w-[420px]">{children}</div>
        </main>

        <footer className="px-5 pb-8 md:px-8 lg:px-10">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/legal/terms"
              className="text-micro text-muted underline-offset-4 hover:underline"
            >
              Terms of use
            </Link>
            <Link
              href="/legal/privacy"
              className="text-micro text-muted underline-offset-4 hover:underline"
            >
              Privacy policy
            </Link>
            <Link
              href="/legal/income-disclosure"
              className="text-micro text-muted underline-offset-4 hover:underline"
            >
              Income disclosure
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** The signup pitch: the actual numbers, not adjectives. */
export function SignupAside({ referralCode }: { referralCode?: string }) {
  const starter = plans[0]!;
  const perReferral = commissionPerReferral(starter);
  const breakEven = referralsToBreakEven(starter);

  return (
    <div>
      {referralCode ? (
        <p className="mb-8 inline-block rounded-xs bg-lime px-2 py-1 text-eyebrow uppercase text-ink">
          Invited by {referralCode}
        </p>
      ) : null}

      <h2 className="text-h2 text-white">
        {DIRECT_COMMISSION_RATE}% of everyone you bring in
      </h2>
      <p className="mt-5 text-lead text-white/70">
        The same rate on every plan. It does not go up because you spent more,
        and it does not quietly go down later.
      </p>

      <dl className="mt-10 border-t border-line-dark">
        <div className="flex items-baseline justify-between gap-4 border-b border-line-dark py-4">
          <dt className="text-small text-white/70">
            One Starter referral pays you
          </dt>
          <dd className="text-h4 text-lime tabular">
            {formatMoney(perReferral)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-line-dark py-4">
          <dt className="text-small text-white/70">Every month they stay</dt>
          <dd className="text-h4 tabular">Yes</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-line-dark py-4">
          <dt className="text-small text-white/70">Referrals to cover the fee</dt>
          <dd className="text-h4 tabular">{breakEven}</dd>
        </div>
      </dl>

      <p className="mt-6 text-small text-white/60">
        Assuming they join on the same plan and keep paying, which not everyone
        does. The income disclosure has the real figures.
      </p>
    </div>
  );
}

/** The login pitch: quieter. They already decided. */
export function LoginAside() {
  return (
    <div>
      <h2 className="text-h2 text-white">Welcome back</h2>
      <p className="mt-5 text-lead text-white/70">
        Your wallet, your network and the current standings are all where you
        left them.
      </p>

      <ul className="mt-10 space-y-4 border-t border-line-dark pt-8">
        {[
          "Claim tasks that match your rank",
          "Watch pending commission clear",
          "See who joined under your link this month",
        ].map((item) => (
          <li key={item} className="flex gap-3 text-small text-white/70">
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 bg-lime" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
