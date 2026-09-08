"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "@/components/ui/flag";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  referralCode,
  next,
}: {
  mode: Mode;
  referralCode?: string;
  next?: string;
}) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isSignup ? signUp : signIn,
    {},
  );

  const ids = { name: useId(), email: useId(), password: useId() };
  const errors = state.fieldErrors ?? {};
  const [country, setCountry] = useState("PK");

  return (
    <div>
      {isSignup && referralCode ? (
        <p className="mb-6 inline-block rounded-xs bg-lime px-2 py-1 text-eyebrow uppercase text-ink lg:hidden">
          Invited by {referralCode}
        </p>
      ) : null}

      <h1 className="text-h2">{isSignup ? "Create your account" : "Log in"}</h1>
      <p className="mt-3 text-body text-muted">
        {isSignup
          ? "One payment from 5,000 PKR. No monthly fee. 24 hours to change your mind."
          : "Welcome back. Enter your details to carry on."}
      </p>

      {state.error ? (
        <p
          role="alert"
          className="mt-6 rounded-sm border border-critical border-s-2 bg-surface p-4 text-small text-critical"
        >
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-8 space-y-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {isSignup ? (
          <>
            <Field
              id={ids.name}
              name="full_name"
              label="Your name"
              autoComplete="name"
              error={errors.full_name}
            />
            <div>
              <label
                htmlFor="country_code"
                className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
              >
                Where you live
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2">
                  <Flag code={country} size={22} />
                </span>
                <select
                  id="country_code"
                  name="country_code"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12 w-full rounded-sm border border-line bg-surface ps-12 pe-3.5 text-small"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-micro text-muted">
                This sets your leaderboard track and cannot be changed without
                verification.
              </p>
            </div>
          </>
        ) : null}

        <Field
          id={ids.email}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
        />

        <PasswordField
          id={ids.password}
          autoComplete={isSignup ? "new-password" : "current-password"}
          hint={isSignup ? "At least 10 characters." : undefined}
          error={errors.password}
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending} arrow={!pending}>
          {pending ? (
            <>
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                className="animate-spin"
                aria-hidden="true"
              />
              {isSignup ? "Creating your account" : "Logging in"}
            </>
          ) : isSignup ? (
            "Create account"
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-small text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet underline underline-offset-2">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-violet underline underline-offset-2">
              Create one
            </Link>
          </>
        )}
      </p>

      {isSignup ? (
        <p className="mt-4 text-small text-muted">
          Creating an account means you accept the{" "}
          <Link href="/legal/terms" className="text-violet underline underline-offset-2">
            terms
          </Link>{" "}
          and the{" "}
          <Link href="/legal/referral-terms" className="text-violet underline underline-offset-2">
            referral terms
          </Link>
          . Before you pay, read the{" "}
          <Link
            href="/legal/income-disclosure"
            className="text-violet underline underline-offset-2"
          >
            income disclosure
          </Link>
          . Most members earn very little at first and some earn nothing.
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const fieldClass = (error?: string) =>
  cn(
    "mt-2 h-12 w-full rounded-sm border bg-surface px-3.5 text-small transition-colors duration-200",
    error ? "border-critical" : "border-line hover:border-muted",
  );

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  inputMode,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass(error)}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-small text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  id,
  autoComplete,
  hint,
  error,
}: {
  id: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
      >
        Password
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(fieldClass(error), "pe-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute end-1 top-2 grid size-10 place-items-center rounded-xs text-muted transition-colors duration-200 hover:text-ink"
        >
          {visible ? (
            <EyeOff size={16} strokeWidth={1.25} />
          ) : (
            <Eye size={16} strokeWidth={1.25} />
          )}
          <span className="sr-only">
            {visible ? "Hide password" : "Show password"}
          </span>
        </button>
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-2 text-micro text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-small text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}
