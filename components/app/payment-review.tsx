"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reviewClock } from "@/lib/billing";

export function PaymentReview({ submittedAt, serverNow, reference, planName }: {
  submittedAt: string; serverNow: number; reference?: string | null; planName?: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(serverNow);
  const [refreshing, startTransition] = useTransition();
  useEffect(() => {
    // Server time plus elapsed time avoids trusting the member's device clock.
    const started = performance.now();
    const clock = setInterval(() => setNow(serverNow + performance.now() - started), 1000);
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const poll = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(clock); clearInterval(poll);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [serverNow, router]);
  const time = reviewClock(submittedAt, now);
  const delayed = time.overdue || !time.valid;
  return (
    <section aria-label="Payment review status" className="mb-6 flex flex-wrap items-center gap-4 rounded-panel border border-violet/15 bg-violet-soft p-4 sm:px-5">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-violet">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <h2 className="text-small font-semibold">{delayed ? "Payment review is taking longer" : "Payment under review"}</h2>
        <p className="mt-1 text-micro text-muted">{delayed ? "Still pending. Please don’t pay again." : "Access unlocks after admin approval."}</p>
        {planName && <p className="mt-1 text-micro text-muted">{planName}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-control border border-violet/10 bg-surface px-4 py-2 text-center">
          <div role="timer" aria-live="off" aria-label={`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds remaining`} className="text-[24px] leading-tight font-semibold tracking-tight text-violet tabular-nums">{time.hours}:{time.minutes}:{time.seconds}</div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{delayed ? "Awaiting review" : "Review estimate"}</p>
        </div>
        <div className="flex flex-col items-start">
          <button type="button" disabled={refreshing} onClick={() => startTransition(() => router.refresh())} className="min-h-9 text-micro font-medium text-violet disabled:opacity-50">{refreshing ? "Checking…" : "Refresh status"}</button>
          <Link href={delayed ? "/contact" : "/dashboard/billing"} title={reference ? `Payment reference ${reference}` : undefined} className="min-h-8 text-micro text-muted underline underline-offset-4">{delayed ? "Get help" : "View payment"}</Link>
        </div>
      </div>
    </section>
  );
}
