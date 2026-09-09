# Assignwork

UK referral-led work platform. Members complete paid tasks and earn commission
on the members they introduce, three levels deep.

The full specification is in [`docs/ASSIGNWORK-BUILD-PROMPT.md`](docs/ASSIGNWORK-BUILD-PROMPT.md).
Read section 3 before touching any styling and section 13 before writing any copy.

## Running it

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.
Payment tests: `npm test` (Node 22.6+; verified with Node 24).

## JazzCash payment setup

Incoming payments now use only the supplied JazzCash QR, a required screenshot,
a persistent six-hour review countdown and finance approval. Apply the included
Supabase migration before enabling payment collection. The migration has not
been applied to the live project from this workspace.

See [setup, security and acceptance checks](docs/JAZZCASH-PAYMENTS.md).

## Where things are

```
app/(marketing)/     Public site. Route group, so (marketing)/page.tsx serves /
app/globals.css      The entire design system. Tokens live here, nowhere else.
components/ui/       Primitives: Button, Section, Eyebrow, Badge, Media, Reveal
components/marketing/ Page-level pieces: header, footer, CTA band, cards
lib/site.ts          Navigation, plans, ranks. Structured data.
lib/content.ts       Home page copy, and the placeholder statistics block.
docs/                The build specification.
```

## Two things that will bite you

**The Tailwind palette is deliberately wiped.** `app/globals.css` sets
`--color-*: initial` and `--radius-*: initial`, so `bg-blue-500` and
`rounded-2xl` do not compile. That is the point: the design system cannot drift
by accident. If you need a value that is not in the token block, it belongs in
that file after a design decision, not inline in a component.

**Lime is a fill, never text.** `#d4f717` on `#f1f1f1` is about 1.2:1 contrast,
which is invisible. Text on lime is always `--color-ink`. Use `--color-violet`
when you need a coloured text accent.

## Placeholder data

`lib/content.ts` exports `statsAreReal = false`. Every figure in that block is
invented for layout review and is wrapped in a `DevPlaceholder` that draws a
dashed outline in development. Replace the numbers with real data and flip the
flag before this goes anywhere near a customer.

Two home page sections are deliberately absent until their data exists rather
than being filled with invented content: "Tasks open right now" and the guides
teaser. They arrive with phases 7 and 13.

## Running the money

Everything that moves money goes through one Postgres function and is granted
to `service_role` alone. Nothing on the money surface is reachable from the
browser, which the Supabase advisor will confirm.

    record_payment()      opens the subscription, awards the ONE TIME 40% up
                          the chain and the leaderboard points, in one
                          transaction. Manually verified JazzCash receipts
                          reach it through confirm_declaration(). Automated
                          payment webhooks are disabled.
    award_commissions()   level 1 is a flat 40%, paid only on a first payment.
                          Renewals return 0. Rank multiplies levels 2 and 3.
    clear_commissions()   hourly, pending -> available, writes the wallet entry
    refund_payment()      reverses commission and removes the points
    post_wallet_entry()   the only way a balance ever changes

Six pg_cron jobs run inside Postgres, so there is no external scheduler to keep
alive: clearing, claim expiry, leaderboard refresh, nightly ranks and
eligibility, retention points, and season advancement. `select * from cron.job`.

### Verified end to end

A three level chain was built with real payments and torn down again:

  - first payment      A earned level 1 at 40%, Rs 3,040 on a Rs 8,000 plan
  - renewal            nobody earned anything, which is what one time means
  - depth 2            unlocked only once A held two direct active referrals
  - clearing           balances moved to available and hit the wallet
  - refund             a signed reversal row, original entries untouched

## Build status

Phases 0 and 1 are done: foundation, design system, and the full public site.
26 routes build, all prerendered except the three that genuinely need a request.

`typedRoutes` is **on**, so a broken internal link fails the build.

Next is phase 2, auth and profiles against Supabase. The pieces waiting for a
backend are marked in the code and say so in the UI rather than faking success:
the contact form, the login and signup forms, `/api/newsletter`, and the
database lookup inside `app/r/[code]/route.ts`.

## Five bugs worth not reintroducing

**`ch` units belong on the text element.** `max-w-[20ch]` on a wrapper div
resolves against that div's 16px font size, not the 96px heading inside it. The
hero h1 spent a while trapped in a 160px column, one word per line.

**tailwind-merge must know the custom scale.** It has no view of the `@theme`
block, so it read `text-small` as a text *colour* and stripped the `text-white`
in front of it, rendering a button's label in ink on a black hero.
`lib/utils.ts` registers both scales; anything added to `@theme` goes there too.

**Animation is never load bearing for legibility.** `Reveal` has four
guarantees, listed in the component. Above-the-fold content uses `priority` and
renders visible from the server with no JS involved.

**Every `security definer` function is exposed at `/rest/v1/rpc/<name>`.** They
were callable by `anon`, so anyone could have POSTed to `post_wallet_entry` and
credited themselves. Revoking from `anon` is not enough either: Postgres grants
EXECUTE to `PUBLIC` and `anon` inherits it. Revoke from `PUBLIC`, grant
narrowly, and set `alter default privileges` so new functions start locked.

**Basis points times paisa overflows int4.** `800000 * 9500` is 7.6e9 against a
2.1e9 ceiling, so every payment above roughly 2,260 PKR raised "integer out of
range". Money arithmetic goes through `numeric` and returns to integer at the
end.

**A guarded function cannot be called from cron.** `post_wallet_entry` read the
balance through the auth-guarded `wallet_balance`, which raises when
`auth.uid()` is null. Under pg_cron there is no session, so `clear_commissions`
failed on every run and no commission would ever have reached a wallet. User
facing guards and internal reads are now separate.

Contrast is checked with a canvas-based audit against the *composited*
background, because Tailwind v4 emits `oklab()` and naive `rgb()` parsing gives
nonsense. Two real failures came out of it: `--color-muted` had to darken to
`#5f5f5f` to clear 4.5:1 on `#e7e7e7` cards, and white text on ink now bottoms
out at 60% opacity.

## Stack

Next.js 16.3.3 (Turbopack, `proxy.ts` not `middleware.ts`, async `cookies()` and
`params`), React 19.2.8, TypeScript 5.9.3 strict, Tailwind CSS 4.3.3. Node 20.9+.
