"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Bell, Check, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { route } from "@/lib/routes";

export type BellNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

/* --------------------------------------------------------------------------
   The alert tone.

   Synthesised with the Web Audio API rather than shipped as an mp3: two short
   notes, about 40ms of sound, no file to download and nothing to 404. It is
   also easy to keep quiet, which matters more than the sound itself.

   Browsers block audio until the person has interacted with the page, so the
   first play may be refused. That is correct behaviour and is swallowed
   silently: a notification that arrives without a sound is fine, an unhandled
   rejection in the console is not.
   -------------------------------------------------------------------------- */

const MUTE_KEY = "aw_notify_muted";

function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/* The mute flag lives in localStorage, which is external mutable state, so it
   is read through useSyncExternalStore rather than an effect that calls
   setState. That also keeps the server snapshot honest: the server cannot see
   localStorage, so it renders unmuted and the browser corrects it before
   paint. */
const muteListeners = new Set<() => void>();

function subscribeMute(onChange: () => void) {
  muteListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    muteListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setMutedPref(next: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // Preference not persisted. Harmless.
  }
  for (const l of muteListeners) l();
}

async function chime() {
  if (isMuted()) return;

  // Someone who asked the OS for less motion generally wants less of
  // everything attention-grabbing.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    if (ctx.state === "suspended") await ctx.resume();

    const now = ctx.currentTime;
    // Two notes a fifth apart. Short, quiet, and not a system alert sound.
    for (const [at, freq] of [
      [0, 880],
      [0.09, 1318.5],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.06, now + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.18);
    }

    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // Autoplay policy, no audio device, or a locked context. Not worth a word.
  }
}

/* -------------------------------------------------------------------------- */

export function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: BellNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellNotification[]>(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [busy, setBusy] = useState(false);
  const muted = useSyncExternalStore(subscribeMute, isMuted, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Ids we have already announced, so a refetch does not re-chime for the
  // same notification.
  const seen = useRef<Set<string>>(new Set(initialItems.map((n) => n.id)));

  const load = useCallback(async (announce: boolean) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, href, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (!data) return;

    const fresh = (data as BellNotification[]).filter((n) => !seen.current.has(n.id));
    for (const n of data as BellNotification[]) seen.current.add(n.id);

    setItems(data as BellNotification[]);
    setUnread((data as BellNotification[]).filter((n) => !n.read_at).length);

    if (announce && fresh.some((n) => !n.read_at)) void chime();
  }, []);

  // Realtime where it works, polling as the floor. A member waiting on a
  // payment confirmation should not have to refresh to find out.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => void load(true),
        )
        .subscribe();
    });

    const poll = window.setInterval(() => void load(true), 60_000);

    return () => {
      window.clearInterval(poll);
      if (channel) void createClient().removeChannel(channel);
    };
  }, [load]);

  // Escape closes, click outside closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function markAllRead() {
    if (unread === 0) return;
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      await load(false);
    }
    setBusy(false);
  }

  function toggleMute() {
    const next = !muted;
    setMutedPref(next);
    // Unmuting plays the tone once, so you hear what you just switched on.
    if (!next) void chime();
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load(false);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid size-11 place-items-center rounded-sm text-muted transition-colors duration-200 hover:text-ink"
      >
        <Bell size={19} strokeWidth={1.25} />
        {unread > 0 ? (
          <span className="absolute end-2 top-2 grid min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-medium text-white tabular">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
        <span className="sr-only">
          {unread > 0 ? `${unread} unread notifications` : "Notifications"}
        </span>
      </button>

      {/* Announced politely so a screen reader hears new arrivals without
          having the current focus stolen. */}
      <span aria-live="polite" className="sr-only">
        {unread > 0 ? `${unread} unread notifications` : ""}
      </span>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-line bg-surface shadow-overlay"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-h4">Notifications</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                aria-pressed={muted}
                className="rounded-xs px-2 py-1 text-micro text-muted transition-colors duration-200 hover:text-ink"
              >
                {muted ? "Sound off" : "Sound on"}
              </button>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-micro font-medium text-violet transition-opacity duration-200 hover:opacity-70 disabled:opacity-40"
                >
                  {busy ? (
                    <LoaderCircle size={12} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <Check size={12} strokeWidth={1.5} />
                  )}
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <ul className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <p className="text-small text-muted">Nothing yet</p>
                <p className="mt-1 text-micro text-muted">
                  Payments, task reviews and commission land here.
                </p>
              </li>
            ) : (
              items.map((n) => {
                const inner = (
                  <>
                    <span className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          n.read_at ? "bg-line" : "bg-lime",
                        )}
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-small",
                            n.read_at ? "text-muted" : "font-medium text-ink",
                          )}
                        >
                          {n.title}
                        </span>
                        {n.body ? (
                          <span className="mt-0.5 block text-micro text-muted">
                            {n.body}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-micro text-muted tabular">
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(n.created_at))}
                        </span>
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={n.id} className="border-b border-line last:border-b-0">
                    {n.href ? (
                      <Link
                        href={route(n.href)}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 transition-colors duration-200 hover:bg-bg"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{inner}</div>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-line px-4 py-2.5">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-micro font-medium text-violet underline-offset-2 hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
