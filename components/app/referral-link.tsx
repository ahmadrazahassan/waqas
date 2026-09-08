"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The most used control in the product, so it sits on the overview rather than
 * three clicks in.
 *
 * WhatsApp is the first share option and the default on mobile, because that
 * is how this will actually spread in Pakistan. Templates are editable before
 * sending and we never auto post or ask for a contact list.
 */
export function ReferralLink({
  code,
  origin,
}: {
  code: string;
  origin: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${origin}/r/${code}`;

  const shareText =
    `I am earning on Assignwork, a platform for paid online tasks. ` +
    `You get 40% commission on everyone you bring in. Join here: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked. The input below is selectable as a fallback.
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Assignwork", text: shareText, url });
        return;
      } catch {
        // Cancelled or unsupported, fall through to copy.
      }
    }
    void copy();
  }

  return (
    <div>
      <p className="text-micro uppercase tracking-[0.08em] text-muted">
        Your referral link
      </p>

      <div className="mt-3 flex">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Your referral link"
          className="h-11 w-full min-w-0 rounded-s-sm border border-e-0 border-line bg-bg px-3 text-small tabular"
        />
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-e-sm border px-4 text-small font-medium transition-colors duration-200",
            copied
              ? "border-positive bg-positive text-white"
              : "border-ink bg-ink text-white hover:bg-ink-soft",
          )}
        >
          {copied ? (
            <Check size={15} strokeWidth={1.75} />
          ) : (
            <Copy size={15} strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-10 items-center rounded-sm bg-lime px-4 text-small font-medium text-ink transition-colors duration-200 hover:bg-lime-press"
        >
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex h-10 items-center gap-2 rounded-sm border border-line px-4 text-small font-medium transition-colors duration-200 hover:border-ink"
        >
          <Share2 size={15} strokeWidth={1.25} />
          More ways to share
        </button>
      </div>

      <p className="mt-3 text-micro text-muted">
        You earn 40% once, on the first payment of everyone who joins through
        this link.
      </p>
    </div>
  );
}
