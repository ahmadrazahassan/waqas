"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { Flag } from "@/components/ui/flag";
import { topAnnouncements, bandAnnouncements, type Announcement } from "@/lib/announcements";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "aw_announce_dismissed";

/* --------------------------------------------------------------------------
   Dismissal is read through useSyncExternalStore rather than an effect.

   An effect would mean rendering the bar, then hiding it a frame later for
   anyone who dismissed it, which is a visible flash on every page load. This
   also keeps the server snapshot explicit: the server cannot see localStorage,
   so it renders the bar, and a returning visitor's browser resolves it before
   paint.
   -------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    // Private mode or blocked storage. Showing the bar is the safe default.
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Nothing to persist. It will show again next visit.
  }
  for (const l of listeners) l();
}

/* -------------------------------------------------------------------------- */
/* Thin bar that sits above the header                                        */
/* -------------------------------------------------------------------------- */

export function AnnouncementBar({
  items = topAnnouncements,
  dismissible = true,
}: {
  items?: Announcement[];
  dismissible?: boolean;
}) {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => false);

  if (dismissed || items.length === 0) return null;

  return (
    <div className="group/marquee relative bg-ink text-white">
      <Marquee speed={45} pauseTone="lime" className="py-2.5">
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span
              className={cn(
                "flex items-center gap-2 px-6 text-micro whitespace-nowrap",
                item.emphasis ? "font-semibold text-lime" : "text-white/80",
              )}
            >
              {item.flag ? <Flag code={item.flag} size={16} /> : null}
              {item.text}
            </span>
            <span aria-hidden="true" className="size-1 rounded-full bg-white/30" />
          </span>
        ))}
      </Marquee>

      {dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          className="absolute end-0 top-0 grid h-full w-9 place-items-center bg-ink text-white/60 transition-colors duration-200 hover:text-white"
        >
          <X size={14} strokeWidth={1.5} />
          <span className="sr-only">Hide announcements</span>
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Big band used as a section break                                            */
/* -------------------------------------------------------------------------- */

export function AnnouncementBand({
  items = bandAnnouncements,
  tone = "lime",
  speed = 38,
  reverse = false,
  className,
}: {
  items?: Announcement[];
  tone?: "lime" | "ink";
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Announcements"
      className={cn(
        "group/marquee relative border-y",
        tone === "lime"
          ? "border-ink bg-lime text-ink"
          : "border-line-dark bg-ink text-white",
        className,
      )}
    >
      <Marquee
        speed={speed}
        reverse={reverse}
        pauseTone={tone === "lime" ? "ink" : "lime"}
        className="py-8 lg:py-10"
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="flex items-center gap-4 px-8 text-h2 whitespace-nowrap lg:px-12">
              {item.flag ? (
                <Flag
                  code={item.flag}
                  size={40}
                  className={tone === "lime" ? "border-ink/30" : "border-white/30"}
                />
              ) : null}
              {item.text}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "size-2.5 rounded-full",
                tone === "lime" ? "bg-ink" : "bg-lime",
              )}
            />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
