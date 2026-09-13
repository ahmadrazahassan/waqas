"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { updateProfile, type ActionState } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { DIAL_CODES, formatPhone } from "@/lib/phone";

export function ProfileForm({
  fullName,
  displayName,
  headline,
  leaderboardOptin,
  phone,
  countryCode,
}: {
  fullName: string;
  displayName: string | null;
  headline: string | null;
  leaderboardOptin: boolean;
  phone: string | null;
  countryCode: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={action} className="mt-5 space-y-5">
      <div>
        <label
          htmlFor="full_name"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3.5 text-small"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Mobile number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={formatPhone(phone)}
          placeholder={countryCode === "PK" ? "0300 1234567" : "+44 7700 900123"}
          aria-invalid={!phone || undefined}
          className={
            "mt-2 h-12 w-full rounded-sm border bg-surface px-3.5 text-small tabular " +
            (phone ? "border-line" : "border-warning")
          }
        />
        <p className="mt-2 text-micro text-muted">
          {phone
            ? "Used for payment checks and account support. Only staff can see it."
            : `Add a mobile number${DIAL_CODES[countryCode] ? ` (+${DIAL_CODES[countryCode]})` : ""}. We need it to verify payments and payouts.`}
        </p>
      </div>

      <div>
        <label
          htmlFor="display_name"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={displayName ?? ""}
          placeholder="How you appear to your network and on the board"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3.5 text-small"
        />
        <p className="mt-2 text-micro text-muted">
          Leave it blank and we use your username.
        </p>
      </div>

      <div>
        <label
          htmlFor="headline"
          className="block text-micro font-medium uppercase tracking-[0.08em] text-muted"
        >
          Headline
        </label>
        <input
          id="headline"
          name="headline"
          defaultValue={headline ?? ""}
          placeholder="One line about the work you do"
          className="mt-2 h-12 w-full rounded-sm border border-line bg-surface px-3.5 text-small"
        />
      </div>

      <div className="flex items-start gap-3 rounded-sm border border-line bg-bg p-4">
        <input
          id="leaderboard_optin"
          name="leaderboard_optin"
          type="checkbox"
          defaultChecked={leaderboardOptin}
          className="mt-0.5 size-4 accent-violet"
        />
        <label htmlFor="leaderboard_optin" className="text-small">
          Show my name on the public leaderboard
          <span className="mt-1 block text-micro text-muted">
            Opting out does not affect your points, your position or any prize
            you win. You appear as a member number instead.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending} arrow={!pending}>
          {pending ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" />
              Saving
            </>
          ) : (
            "Save changes"
          )}
        </Button>
        {state.error ? (
          <p role="alert" className="text-small text-critical">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p role="status" className="text-small text-positive">
            {state.ok}
          </p>
        ) : null}
      </div>
    </form>
  );
}
