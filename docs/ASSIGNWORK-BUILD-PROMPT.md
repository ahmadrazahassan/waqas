# ASSIGNWORK — MASTER BUILD PROMPT

**Version 5** · 7 September 2026

> **How to use this document.** This is the single source of truth for the build. Paste it, or the section you are working on, into your coding agent at the start of every session. Appendix A holds a compressed kernel prompt for re-anchoring a session that has drifted. Nothing here is a suggestion. Where a decision is genuinely open it is marked `DECISION:`. Where a number must be replaced with real data before launch it is marked `PLACEHOLDER:`.

---

## WHAT CHANGED IN VERSION 5

- **The refund window is 24 hours**, not 14 days, running from the moment a payment is confirmed. Stated on the pricing page, the payment form and in the terms.
- **Commission now clears in 3 days**, not 14. The old hold existed to cover the refund window; with a 24 hour window, 3 days covers it and leaves room for a fraud check. It is the `commission_clear_days` settings row, so one UPDATE changes it.
- Refunds and terms rewritten for a one time purchase: there is nothing recurring, so there is nothing to cancel.
- The refunds policy carries one line saying local statutory rights still apply where they are longer. That sentence is what keeps a 24 hour policy enforceable rather than void against UK and EU consumers, who have a statutory cancellation period a term cannot remove.

## WHAT CHANGED IN VERSION 4

- **One time payment, not a subscription.** 5,000 / 8,000 / 9,999 PKR is paid once. No monthly fee, no renewal, no card on file, nothing to cancel. The `subscriptions` table is now `memberships`, `expires_at` is null on every live row, and renewal logic does not exist anywhere.
- **Commission is paid once per member, not once per payment.** An upgrade improves access and pays nobody a second time. Verified end to end.
- **The pricing page states the price and nothing else.** No earnings projections, no referral calculator, no break even figure on the cards. That number belongs on the referrals page next to the income disclosure, not on a price list.
- Signup no longer sends a confirmation email. Supabase's own mailer caps at a couple of messages an hour, which silently queued real members behind an invisible ceiling.

## WHAT CHANGED IN VERSION 3

- **PKR is the base currency**, not a conversion. Plan prices are defined natively in paisa. GBP, USD and EUR are indicative displays only.
- **Pricing is 5,000 / 8,000 / 9,999 PKR** across three plans. The fourth plan is gone.
- **Level 1 commission is a flat 40% on every plan.** It is the headline of the product and does not change with what the member bought.
- **The rank multiplier applies to levels 2 and 3 only.** Multiplying 40% would break the flat promise and breach the 45% per level cap the moment anyone reached rank 4 (40 x 1.2 = 48).
- See the **margin note** at the end of section 5.1. Paying 40% at level 1 changes the unit economics materially and needs a decision.

## WHAT CHANGED IN VERSION 2

- **Next.js 16.3.3** pinned, with the real breaking changes from the 16 release documented in section 4. Version policy explained so nobody has to guess again.
- **Every element of chance removed.** There is no draw, no lottery, no odds, no random seed, no free entry route. Prizes are awarded deterministically to the top of a published leaderboard. Section 8 is now a performance competition, not a draw.
- **Pricing reduced.** Entry is £11. Every tier came down.
- **The referral system is now the spine of the product**, not a feature attached to a marketplace. Tasks exist to fund and justify the commissions.
- **Tasks are posted by admin.** No client-side commissioning in v1. A member completes an approved task and gets paid into their wallet.
- **Pakistan is a first class market.** Regional prize tracks, Umrah as the headline award, PKR display, WhatsApp-first sharing, a low-end Android performance budget, and a flagged problem with taking payments from Pakistan that needs solving before launch.

---

## 0. ROLE AND STANDARD

You are a senior full stack engineer with ten years shipping production SaaS in the UK market. You write TypeScript that a team maintains for five years, not a demo that looks good in a screenshot. You do not ship a component until it works at 390px and 1920px. You do not invent data. You do not add a feature that was not asked for, and you do not silently drop one that was.

Build quality bar:

- Every page renders correctly at 390, 768, 1024, 1440 and 1920 CSS pixels before it is considered done.
- Every interactive element has a visible keyboard focus state and a real accessible name.
- No `any`. No `@ts-ignore`. No unused exports. TypeScript `strict` plus `noUncheckedIndexedAccess`.
- No client component where a server component works.
- Every money value is an integer of minor units (pence, or paisa for PKR display). Never a float.
- Every write that touches money goes through a single Postgres function with an idempotency key. Never through the browser client.

---

## 1. WHAT WE ARE BUILDING

**Assignwork** (assignwork.co.uk) is a UK company running a referral-led work platform.

Read the order of these three sentences carefully, because it determines what gets built first and what gets the most engineering attention:

1. **The referral programme is the product.** Members introduce other members. When someone they introduced pays for a plan, they earn commission. When that person introduces someone, they earn again, two levels down, and again three levels down. Everything on the platform is designed to make that chain visible, understandable and worth working at.
2. **Tasks are the engine underneath it.** Admin posts paid tasks. Members claim them, complete them, get reviewed, and get paid into their wallet. This is what makes membership worth paying for, and it is what makes the commission real revenue rather than recruitment income.
3. **The leaderboard is the motivation on top.** Referral performance earns points. Points produce a public ranking. The top of that ranking wins real prizes, including Umrah packages and Northern Areas trips for the Pakistan track. It is a competition, decided entirely by published performance.

Membership starts at £11 per month. Paying unlocks the task pool, the referral programme, and leaderboard eligibility.

---

## 2. TWO COMPLIANCE GUARDRAILS

These are commercial and legal rather than technical, but they change the data model, so they sit at the top. There is nothing here about gambling, because the design in section 8 contains no element of chance.

### 2.1 "Tasks" and UK academic law

In England, the Skills and Post-16 Education Act 2022 made it a criminal offence to provide, or arrange the provision of, academic work for a student to submit as their own, and to advertise such a service.

**The position this spec is written against:** Assignwork posts commercial tasks. Content writing, research summaries, editing and proofreading, data entry and cleaning, transcription, translation and localisation, image tagging, product listing work, survey and testing work. Plus clearly labelled tutoring that produces guidance rather than submittable coursework.

Enforcement in the product, not in a disclaimer:

- `tasks.compliance_flag` is `standard`, `tutoring` or `restricted`.
- A database check constraint blocks any task with `compliance_flag = 'restricted'` from reaching `status = 'open'`. It cannot be published, not even by an owner-role admin.
- Public copy never uses "write my essay", "do my assignment for me", or "submit as your own".

### 2.2 Multi level referral commission in the UK

The Trading Schemes Act 1996 and the Consumer Protection from Unfair Trading Regulations 2008 restrict schemes where a participant's income derives mainly from recruiting other participants rather than from the sale of a genuine product or service.

Since the referral programme is the centre of this product, these safeguards are load bearing. Build them in from day one:

- Commission is calculated on **net revenue from a real service subscription**, after payment processing fees and VAT. Never on a joining fee. Never on recruitment alone.
- Commission depth is capped at **three levels**. The schema supports more, the seeded rules ship at three.
- A member must have completed at least one approved task in the previous 90 days to stay commission eligible. `profiles.commission_eligible` is recomputed nightly. Earning cannot come from recruitment alone, and the system enforces it rather than promising it.
- 24 hour refund window from confirmation, with automatic commission reversal on refund. See the note below on UK and EU statutory rights.
- A published **income disclosure statement** with real median and percentile figures, linked from the referrals page, the leaderboard and the signup flow. Ship honest numbers even when the honest number is unflattering.
- No inventory purchase, no minimum spend to stay active, no paid rank advancement, no paid leaderboard position.

---

## 3. DESIGN SYSTEM (NON NEGOTIABLE)

The visual language comes from the two references: the Hydra clean energy site and the Cline Design footer. What is borrowed is the **structure and the restraint**, not the content, imagery or brand.

### 3.1 What the references actually do

**From Hydra:**

- Enormous vertical whitespace. Sections breathe at 140 to 180px of padding on desktop. Nothing is crowded.
- A tiny uppercase eyebrow label with a lime highlight sits above every section heading. It is 11px, heavily letterspaced, and it does the navigational work so the heading does not have to explain itself.
- The hero is a full bleed photograph with a flat dark scrim at a fixed opacity. Not a gradient overlay.
- Section headings are large and plain. "What we do". Not "Discover our comprehensive service offering".
- Cards are flat light grey rectangles on a light grey page. Separation comes from a one pixel gap and a tonal shift, never from shadow.
- Icons are thin isometric line drawings. One stroke weight. No fills. No colour.
- A small circular `+` affordance sits in the card corner as the expand control. It is the only circle in the layout.
- Colour blocking: a solid lime panel sits directly beside a solid near black panel, split down the middle, with large numerals in the dark half.

**From Cline:**

- A full width solid lime CTA band carrying one line of type that mixes regular and bold weight in the same sentence, with plain underlined text links rather than buttons.
- A quiet footer underneath holding real addresses and phone numbers at a small type scale.
- An oversized wordmark bleeding off the bottom edge, clipped by the viewport.

Reproduce all of the above structurally.

### 3.2 Colour tokens

```css
@theme {
  /* Brand */
  --color-lime:         #d4f717;  /* primary. background only. */
  --color-lime-press:   #c2e40e;  /* active state on lime fills */
  --color-violet:       #5a38fd;  /* secondary. links, focus, data viz */
  --color-violet-press: #4a2ce0;

  /* Neutrals */
  --color-bg:          #f1f1f1;  /* global page background */
  --color-surface:     #ffffff;  /* elevated: dashboard cards, inputs, modals */
  --color-surface-alt: #e7e7e7;  /* flat cards sitting on --color-bg */
  --color-ink:         #0d0d0d;  /* headings, body, dark panels */
  --color-ink-soft:    #1a1a1a;  /* secondary dark panel */
  --color-muted:       #6b6b6b;  /* secondary text, 5.2:1 on bg */
  --color-line:        #d9d9d9;  /* hairline border on light */
  --color-line-dark:   #2a2a2a;  /* hairline border on dark */

  /* Status. Muted, never neon. */
  --color-positive: #1f7a4d;
  --color-warning:  #8a6100;
  --color-critical: #a8271f;
  --color-info:     #2f4fb5;
}
```

**Contrast rules. Hard rules, not guidance.**

`#d4f717` on white or on `#f1f1f1` is roughly 1.2:1. It is invisible as text. Therefore:

- Lime is a **fill only**: buttons, chips, panels, highlight blocks, leaderboard position markers.
- Text on lime is always `--color-ink`, roughly 16:1. Never white on lime.
- Lime is never used for body copy, links, icons on light backgrounds, or thin strokes.
- On a dark panel, lime may carry large numerals at 40px and above, and a 2px underline. Never paragraph text.
- Violet `#5a38fd` is the text accent: about 7.9:1 on white, 6.9:1 on `#f1f1f1`. Links, focus rings, secondary CTA fills with white text, chart series.
- `#6b6b6b` is the floor for secondary text. Nothing lighter anywhere.

**Banned outright:** any `linear-gradient`, `radial-gradient`, `conic-gradient`, or layered background imitating one. Any `backdrop-filter: blur` glass card. Any glow, neon, or coloured shadow. Dark mode in v1, since the design already colour blocks and a toggle doubles the QA surface for no user gain.

### 3.3 Typography

One family. **Inter Tight**, self hosted as a variable font via `next/font/local`. Weights 400, 500, 600, 700. No second family for headings, code, or labels. Where a monospace effect is wanted on an eyebrow label, get it from uppercase plus letterspacing on Inter Tight.

```
Display  clamp(3rem, 7vw, 6rem)           w600  lh 0.94  ls -0.035em
H1       clamp(2.5rem, 5vw, 3.5rem)       w600  lh 1.02  ls -0.030em
H2       clamp(2rem, 3.6vw, 2.75rem)      w600  lh 1.08  ls -0.025em
H3       clamp(1.375rem, 2.2vw, 1.75rem)  w600  lh 1.20  ls -0.020em
H4       1.125rem                         w600  lh 1.35  ls -0.010em
Lead     clamp(1.0625rem, 1.4vw, 1.25rem) w400  lh 1.50  ls -0.011em
Body     1rem                             w400  lh 1.60  ls -0.006em
Small    0.875rem                         w400  lh 1.55
Micro    0.75rem                          w500  lh 1.40
Eyebrow  0.6875rem                        w500  lh 1.00  ls 0.14em  UPPERCASE
Numeric  tabular-nums on every table, ledger, counter, stat and leaderboard row
```

Rules:

- Headings are **sentence case**. "What we do", not "What We Do". The only uppercase in the system is the eyebrow label.
- Body copy caps at 68 characters per line. A lead paragraph caps at roughly 640px.
- The oversized footer wordmark is `font-size: 22vw; font-weight: 700; letter-spacing: -0.05em`, clipped by `overflow: hidden` on its container, capped at 320px above 1440.
- Never letterspace body text. Never justify text.

### 3.4 Shape, elevation, spacing

```
--radius-xs:   2px;   /* chips, eyebrow highlight, badges, rank markers */
--radius-sm:   4px;   /* buttons, inputs, select, header bar */
--radius-md:   6px;   /* cards, panels, modals */
--radius-full: 999px; /* ONLY: avatars, the card corner + control, status dots */
```

**No pill buttons. No pill header. No pill tabs. No pill inputs.** Maximum radius on any rectangular element is 6px. This is stated three times in this document because it is the single thing most likely to be got wrong.

Elevation is essentially absent. Separation comes from a tonal shift, a 1px `--color-line` border, and whitespace. The only permitted shadow, reserved for overlays that genuinely float (dropdown, popover, modal, toast):

```css
box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.08);
```

Spacing scale on a 4px base: `4 8 12 16 20 24 32 40 48 64 80 96 120 160 200`.

Section vertical padding: `160px` desktop, `112px` at 1024 and below, `72px` at 640 and below.
Container `max-width: 1440px`, gutters `40 / 32 / 20`.
Grid: 12 column desktop, 8 tablet, 4 mobile, 24px gutter.

### 3.5 Iconography

Lucide React, `strokeWidth={1.25}`, 20px or 24px on a 24px grid, `currentColor`, never filled.

**Banned icons, no exceptions:** sparkles, sparkle, wand, zap, rocket, brain, lightbulb, trophy with rays, fire, star burst, crown, gem, and every emoji anywhere in the product UI. A leaderboard shows position numbers, not medals.

For the four "what we do" service cards, use **thin isometric line illustrations** in the Hydra style: single 1px stroke, no fill, no colour, roughly 96px square, delivered as SVG in `/public/illustrations/`. Placeholder with a plain Lucide outline until the artwork lands.

### 3.6 Motion

- 200ms for state changes, 420ms for entrance reveals.
- Easing `cubic-bezier(0.22, 1, 0.36, 1)` for entrances, `cubic-bezier(0.4, 0, 0.2, 1)` for state changes.
- Entrance pattern: opacity 0 to 1 with an 8px upward translate, fired once at 20% viewport intersection, staggered 60ms across siblings, capped at 6 staggered items.
- Images reveal with `clip-path: inset(0 0 100% 0)` to `inset(0 0 0 0)` over 600ms. No scale, no parallax, no scroll jacking.
- Card hover: border darkens to ink over 200ms and the corner `+` rotates 90 degrees. Nothing lifts, scales or glows.
- Leaderboard position changes animate with a 300ms row translate when live data updates. No confetti, no flashing.
- Number counters animate once on first view over 900ms and never re-trigger.
- Everything wrapped by `@media (prefers-reduced-motion: reduce)` setting durations to 1ms and removing transforms.

### 3.7 Core component specs

**Button.** Rectangle at `--radius-sm`, height 48 large / 40 default / 32 small, horizontal padding 24 / 20 / 12, weight 500, sentence case.

- `primary`: lime fill, ink text, 1px ink border. Hover `--color-lime-press`.
- `secondary`: ink fill, white text. Hover `#262626`.
- `tertiary`: transparent, ink text, 1px `--color-line` border. Hover: border goes ink.
- `ghost`: transparent, no border, underline on hover.
- `violet`: violet fill, white text. In-dashboard primary actions where lime would collide with lime data viz.
- Arrow affordance from the references: a 20px square at `--radius-xs` to the right of the label holding a 12px `ArrowUpRight`. On hover it translates 2px right and 2px up. On for marketing CTAs, off in the dashboard.
- Focus: `outline: 2px solid var(--color-violet); outline-offset: 2px`.
- Disabled: 40% opacity, `cursor: not-allowed`, no hover, and the reason stated in text below rather than only implied.

**Eyebrow label.** A span with lime background, ink text, 11px, uppercase, 0.14em tracking, `4px 8px` padding, `--radius-xs`. Sits 24px above its heading. Every major section on every marketing page has one.

**Header.** Full width, 72px tall, `position: sticky; top: 0`. Not floating, not a capsule, not a pill.

- Over the hero: transparent, white text, no border.
- After 24px of scroll: `--color-bg` background, ink text, 1px bottom border, transitioned over 200ms.
- Layout: wordmark left; nav links centre-left at 14px weight 500 with 32px gaps; right side holds a "Log in" ghost link and a "Get started" primary button.
- Nav: How it works, Referrals, Leaderboard, Tasks, Pricing, Guides, Blog.
- Below 1024px: hamburger opens a full screen `--color-bg` overlay, links at H3 size stacked with 1px dividers, CTA pinned to the bottom, body scroll locked, focus trapped, Escape closes.

**Card (marketing).** `--color-surface-alt` fill, no border by default, `--radius-md`, min-height 240px, 32px padding. Illustration top, label bottom. A 28px circular `+` top right expands the card in place with a height transition. The one permitted circle.

**Card (dashboard).** `--color-surface` fill, 1px `--color-line` border, `--radius-md`, 24px padding.

**Input.** 44px tall, `--color-surface` fill, 1px `--color-line` border, `--radius-sm`, 14px text, 12px horizontal padding. Label above at Micro weight 500. Never a floating label, never placeholder-as-label. Error: 1px `--color-critical` border plus a 13px message with an icon below. Focus: violet 2px outline, 1px offset.

**Table.** Header row at Micro, uppercase, 0.08em tracking, `--color-muted`, 1px bottom border. Rows 56px tall with a 1px bottom border, hover fill `--color-bg`. Numerics right aligned and tabular. Below 768px each row collapses into a stacked definition card using the column names as labels.

**Leaderboard row.** 64px tall. Position number at H4 in tabular figures, fixed 56px column. Positions 1 to 3 get a lime `--radius-xs` block behind the number with ink text. Avatar 32px, display name, country code, rank badge, points right aligned at H4 tabular. The signed-in member's own row is ink-filled with white text and sticks to the bottom of the viewport when scrolled out of view.

**Stat block.** Value at Display or H1 size, lime on an ink panel or ink on a lime panel. Label beneath at Micro uppercase.

**Rank badge.** Rectangular at `--radius-xs`, 22px tall, Micro weight 500, uppercase, with a 6px status dot. Ranks use a tonal ink scale, not eight competing colours.

**Empty state.** One line heading, one line of explanation in `--color-muted`, one primary action. No illustration, no mascot.

**Toast.** Bottom right on desktop, top full width on mobile. Ink fill, white text, 4px radius, 5s auto dismiss, dismissible, `aria-live="polite"`.

---

## 4. TECH STACK AND VERSION POLICY

### 4.1 Stable versus latest, since you asked

npm packages carry **dist-tags**. Two matter:

- **`latest`** is the stable release. This is what `npm install next` gives you and what production uses.
- **`canary`** is the nightly build. Next.js ships new features here first. Never use it in production.

Other tags you will see on the Next.js package are noise: `beta` and `rc` are stale leftovers from previous release cycles and point at older versions than `latest`. Ignore them.

**Verified against the npm registry on 26 August 2026:**

| Package | dist-tag `latest` (stable) | dist-tag `canary` |
|---|---|---|
| `next` | **16.3.3** | 16.4.0-canary.8 |
| `react` / `react-dom` | **19.2.8** | 19.3.0-canary |
| `tailwindcss` | **4.3.3** | n/a |
| `@supabase/supabase-js` | **2.112.4** | 2.112.4-canary.3 |
| `stripe` | **22.5.0** | n/a |

**Use Next.js 16.3.3.** Pin exact versions in `package.json` with no `^` or `~`, commit the lockfile, and set Renovate or Dependabot to open weekly PRs so upgrades are a reviewed decision rather than a surprise. Re-run `npm view next dist-tags` at kickoff, because these numbers move.

Runtime floors set by Next 16: **Node.js 20.9+** (Node 18 is unsupported), **TypeScript 5.1+**, and browsers from Chrome 111, Edge 111, Firefox 111, Safari 16.4.

### 4.2 Next.js 16 specifics that will break code written from memory

Anyone who learned the App Router on Next 13 or 14 will get these wrong. Read them before writing a route.

- **`middleware.ts` is now `proxy.ts`.** The file is renamed and the exported function is `proxy`, running on the Node.js runtime. `middleware.ts` still works but is deprecated and will be removed. Our Supabase session refresh and the `/admin` role gate live in `proxy.ts`.
- **Request APIs are async.** `await cookies()`, `await headers()`, `await draftMode()`. Route and page `params` and `searchParams` are Promises and must be awaited. This affects the referral cookie read in `/r/[code]` and every dynamic page in the app.
- **Turbopack is the default bundler.** No configuration needed. Turbopack config moved to top-level `turbopack` in `next.config.ts`, out of `experimental`.
- **`revalidateTag(tag)` alone is deprecated.** It now takes a `cacheLife` profile as a second argument: `revalidateTag('tasks', 'max')`. In Server Actions use `updateTag(tag)` when the user must see their own write immediately, and `refresh()` when only uncached data needs re-reading. Our pattern: `updateTag` after a task claim or a payout request, `revalidateTag(tag, 'max')` for blog and guides, `refresh()` after marking a notification read.
- **Cache Components are opt-in** via `cacheComponents: true` plus the `"use cache"` directive. `experimental.ppr` and `experimental.dynamicIO` are removed. Turn `cacheComponents` on for the marketing and content routes once phase 1 is stable, and leave the dashboard fully dynamic.
- **`next lint` is removed.** Run ESLint directly; `next build` no longer lints. Wire lint as its own CI step.
- **`serverRuntimeConfig` and `publicRuntimeConfig` are removed.** Environment variables only.
- **Parallel route slots now require an explicit `default.js`** or the build fails.
- **`next/image` defaults changed:** `images.qualities` now defaults to `[75]` and the `quality` prop is coerced to the nearest allowed value, `minimumCacheTTL` is 4 hours, `16` is gone from `imageSizes`, redirects cap at 3, and a local `src` with a query string needs `images.localPatterns`. Use `images.remotePatterns`, never the deprecated `images.domains`.
- **React Compiler support is stable but off by default.** Leave it off for phase 0. Evaluate it at phase 13 with real build timings, because it adds Babel to the pipeline.

### 4.3 Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.3.3, App Router | Server Components by default, Server Actions for mutations |
| Runtime | Node.js 22 LTS | Above the 20.9 floor, matches Vercel default |
| Language | TypeScript 5.x strict | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Styling | Tailwind CSS 4.3.3, CSS-first `@theme` | Tokens live in `app/globals.css`, no config sprawl |
| Primitives | shadcn/ui on Radix | Every component restyled. Strip default radii and shadows on install. |
| Database | Supabase Postgres | RLS on every table without exception |
| Auth | Supabase Auth via `@supabase/ssr` | Email and password, magic link, Google OAuth |
| Storage | Supabase Storage | `submissions` private, `avatars` public, `media` public, `kyc` private with signed URLs |
| Realtime | Supabase Realtime | Notifications, wallet ledger, live leaderboard |
| Edge functions | Supabase Edge Functions (Deno) | Stripe webhook, nightly rank and eligibility recompute, season close, payout batching |
| Payments in | Stripe Billing 22.5.0 | UK entity, GBP settlement, Checkout plus Customer Portal, Stripe Tax for VAT. See 13.2 for the Pakistan problem. |
| Payouts | Wise Platform API, manual CSV/BACS fallback in v1 | Never store raw bank details |
| Email | Resend plus React Email | Transactional only in v1 |
| Forms | react-hook-form plus Zod | One Zod schema shared by client and server action |
| Client data | TanStack Query v5 | Dashboard only, never on marketing pages |
| Charts | Recharts, restyled | Flat fills, no gradients, violet and ink series |
| Editor | Tiptap in admin | Blog and guides, stored as JSON, rendered server side |
| Rate limiting | Upstash Redis | Auth, referral click, form submission, payout request |
| Motion | Motion (framer-motion) | Reveals and leaderboard row transitions only |
| Analytics | PostHog, EU cloud | Consent gated |
| Errors | Sentry | Source maps uploaded on deploy |
| Testing | Vitest plus Playwright | Commission and points maths tested to the penny and the point |
| Hosting | Vercel, London region | ISR on marketing and content, dynamic on `/dashboard` and `/admin` |

**Deliberately not used:** Prisma (fights RLS), a headless CMS (the admin editor is in scope), Redux, CSS-in-JS, any component library with an opinionated look, any AI chat widget.

### 4.4 Project structure

```
app/
  (marketing)/
    layout.tsx
    page.tsx                        # home
    how-it-works/page.tsx
    referrals/page.tsx              # the programme, the calculator, the rates
    leaderboard/page.tsx            # public, indexed, the social proof engine
    leaderboard/[season]/page.tsx   # archived seasons and past winners
    prizes/page.tsx                 # prize catalogue and the points formula
    prizes/umrah/page.tsx           # the Pakistan campaign page
    tasks/page.tsx                  # public task catalogue
    tasks/[slug]/page.tsx           # gated detail
    pricing/page.tsx
    about/  careers/  contact/
    guides/  guides/[category]/  guides/[category]/[slug]/
    blog/  blog/[slug]/  blog/tag/[tag]/
    legal/[slug]/page.tsx
  (auth)/
    login/ signup/ forgot-password/ reset-password/ verify/ onboarding/
  (app)/
    layout.tsx
    dashboard/page.tsx
    dashboard/referrals/            # THE flagship screen. link, tree, downline, ledger, materials
    dashboard/leaderboard/
    dashboard/tasks/                # available, active, submitted, history
    dashboard/earnings/             # wallet, ledger, payouts, invoices
    dashboard/rank/
    dashboard/prizes/               # entitlements and claim flow
    dashboard/learn/
    dashboard/notifications/
    dashboard/settings/
  (admin)/
    admin/...
  r/[code]/route.ts                 # referral capture, 307 redirect
  api/webhooks/stripe/route.ts
  api/og/[...slug]/route.tsx
proxy.ts                            # NOT middleware.ts. Session refresh + admin gate.
components/{ui,marketing,app,admin}
lib/{supabase,referral,leaderboard,money,validation,stripe,email}
supabase/{migrations,functions,seed.sql}
types/database.ts                   # generated, never hand edited
```

---

## 5. TWO PROGRESSION AXES

The brief mentioned levels. There are two separate ladders and conflating them is the fastest way to make this unmaintainable.

### 5.1 Plan (what you pay for)

A one time purchase. Controls access, task volume, and the two deeper commission levels. Three plans.

| Plan | Price, paid once | Task claims / month | L1 / L2 / L3 commission | Payout threshold |
|---|---|---|---|---|
| **Starter** | **5,000 PKR** | 5 | **40%** / 5% / 2% | 3,000 PKR |
| **Pro** | **8,000 PKR** | 20 | **40%** / 8% / 4% | 2,000 PKR |
| **Elite** | **9,999 PKR** | 50 | **40%** / 10% / 5% | 1,000 PKR |

**These are one time prices.** A member pays once and the account stays open. There is no monthly fee, no renewal and nothing to cancel, so `memberships.expires_at` is null on every live row. Never build renewal logic against this schema.

Commission is paid **once per member**, not once per payment. Buying an upgrade improves access and pays nobody again, because `award_commissions` returns 0 unless `payments.is_first_payment` is true.

**PKR is the base currency**, stored natively as paisa (5,000 PKR is `500000`). GBP, USD and EUR are indicative conversions behind a switcher, always shown beside the line "priced and charged in PKR". Never store a converted price, and never let a conversion round the base figure.

**Level 1 is a flat 40% on every plan.** This is the clearest promise the product makes: what you bought does not change what you earn on the people you bring in. Plans differ on task volume and on levels 2 and 3 only.

**The rank multiplier applies from level 2 down.** Multiplying the 40% would break the flat promise and breach the 45% per level cap as soon as anyone reached rank 4 (40 x 1.2 = 48). Enforced in `lib/commission.ts` and in the SQL.

Three same plan referrals covers a member's own fee, because 40% of 95% is 38% and ceil(1 / 0.38) is 3. That number is computed at render time and never written into copy, so it stays true if a rate or a price changes.

A plan does **not** buy leaderboard advantage. Points come from what a member's referrals buy, never from what the member themselves bought. See section 8.

### ⚠ Margin note, needs a founder decision

At 40% / 10% / 5%, a fully populated three level chain pays out **up to 55% of net revenue** on referrals alone. Task payments, prizes, payment processing, support and infrastructure all come out of the remaining 45%.

That works only if one of the following is true, and the founder should say which:

1. **Task payments are funded by client revenue, not membership revenue.** This is the assumption the current model needs. It means the client side of the marketplace has to actually exist and be sold, and nothing built so far creates it.
2. **Level 1 is 40% on the first payment and lower on renewals.** Common in referral programmes and defensible, but it has to be published plainly rather than discovered in month two.
3. **The blended payout lands well under 55%** because most chains are shallow and the qualification rules bite. Probably true in practice. Do not plan on it.

`DECISION: founder to confirm which of the three holds before payment products are created. Plan codes and commission rules are painful to change once live subscriptions exist.`


### 5.2 Rank (what you earn through performance)

Eight ranks. Not purchasable. Recomputed nightly and on qualifying events. Controls which tasks a member can see, their commission multiplier, and their access to higher-paid work.

| # | Rank | Direct active referrals | Tasks approved | Avg QA score | Commission multiplier | Unlocks |
|---|---|---|---|---|---|---|
| 1 | Associate | 0 | 0 | n/a | 1.00x | Entry task pool |
| 2 | Contributor | 1 | 3 | 3.5 | 1.05x | Standard pool |
| 3 | Specialist | 3 | 10 | 4.0 | 1.10x | 6 hour head start on new tasks |
| 4 | Senior | 6 | 25 | 4.2 | 1.20x | Premium pool, vanity referral code |
| 5 | Lead | 12 | 50 | 4.3 | 1.30x | Weekly payouts |
| 6 | Principal | 25 | 100 | 4.4 | 1.40x | Reviewer role |
| 7 | Partner | 50 | 200 | 4.5 | 1.50x | Named account manager, custom rate tasks |
| 8 | Director | 100 | 400 | 4.6 | 1.60x | Revenue share pool, advisory seat |

Rules that make this defensible:

- All four conditions must hold at once. No partial promotion.
- "Direct active referral" means a direct referral holding a paid membership past its 24 hour refund window.
- Ranks can go down. Nightly recompute demotes after a 30 day grace period, with email at day 1 and day 21.
- The commission multiplier applies to the plan base rate, then the total is hard capped at 45% of net revenue at any single depth. The cap lives in SQL, not in application code.
- `PLACEHOLDER:` these thresholds are a starting curve. Rerun them against real funnel data after 90 days.

---

## 6. SUPABASE DATA MODEL

Forward-only numbered SQL migrations in `supabase/migrations`. Types generated into `types/database.ts`, never hand edited. RLS on every table, deny by default.

### 6.1 Identity

```sql
create table profiles (
  id                uuid primary key references auth.users on delete cascade,
  full_name         text not null,
  username          citext unique not null,
  display_name      text,                   -- shown on the public leaderboard
  leaderboard_optin boolean not null default true,
  avatar_url        text,
  headline          text,
  country_code      char(2) not null default 'GB',
  timezone          text not null default 'Europe/London',
  phone_e164        text,
  phone_verified_at timestamptz,
  referral_code     citext unique not null,
  referred_by       uuid references profiles(id) on delete set null,
  sponsor_locked_at timestamptz,
  rank_id           smallint not null references ranks(id) default 1,
  rank_since        timestamptz not null default now(),
  status            text not null default 'pending'
                    check (status in ('pending','active','restricted','suspended','closed')),
  kyc_status        text not null default 'none'
                    check (kyc_status in ('none','pending','verified','rejected')),
  commission_eligible     boolean not null default false,
  last_task_approved_at   timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (referred_by);
create index on profiles (rank_id);
create index on profiles (country_code);
```

Also `user_roles(user_id, role)` with `member`, `reviewer`, `support`, `finance`, `admin`, `owner`. Never a boolean `is_admin`.

### 6.2 The referral chain (the heart of the system)

Do not walk a `referred_by` chain at query time. Use a **closure table**. It turns "everyone within three levels of me" into a single indexed query and makes commission calculation provably correct.

```sql
create table referral_edges (
  ancestor_id   uuid not null references profiles(id) on delete cascade,
  descendant_id uuid not null references profiles(id) on delete cascade,
  depth         smallint not null check (depth between 1 and 20),
  created_at    timestamptz not null default now(),
  primary key (ancestor_id, descendant_id)
);
create index on referral_edges (descendant_id, depth);
create index on referral_edges (ancestor_id, depth);
```

Populated by a trigger the moment `referred_by` is set. The trigger inserts one row at depth 1 for the direct sponsor, then copies every row where the sponsor is a descendant, adding 1 to each depth. Cycles are prevented by refusing any insert where `ancestor_id = descendant_id`, or where the proposed sponsor already appears in the new member's descendant set.

```sql
create table referral_clicks (
  id uuid primary key default gen_random_uuid(),
  code         citext not null,
  visitor_id   uuid not null,
  ip_hash      text not null,          -- sha256(ip + daily salt). never raw.
  ua_hash      text not null,
  landing_path text,
  utm          jsonb,
  country_code char(2),
  channel      text,                   -- 'whatsapp','facebook','direct','qr', ...
  created_at   timestamptz not null default now()
);

create table referral_attributions (
  visitor_id        uuid primary key,
  first_code        citext not null,
  first_touch_at    timestamptz not null,
  last_code         citext not null,
  last_touch_at     timestamptz not null,
  converted_user_id uuid references profiles(id),
  converted_at      timestamptz
);
```

**Attribution model:** first touch wins, 90 day window, held in an httpOnly `aw_ref` cookie and mirrored server side against `visitor_id`. `aw_ref_last` records last touch for analytics only and never pays.

### 6.3 Commercial

```sql
create table plans (
  id              smallserial primary key,
  code            text unique not null,          -- 'starter','pro','elite','studio'
  name            text not null,
  price_minor     integer not null,              -- 1100 = £11.00
  currency        char(3) not null default 'GBP',
  interval        text not null check (interval in ('month','year')),
  stripe_price_id text unique not null,
  monthly_claims  integer,                       -- null = unlimited
  referral_points smallint not null,             -- points a REFERRAL of this plan awards
  payout_threshold_minor integer not null,
  features        jsonb not null default '[]',
  sort_order      smallint not null,
  is_active       boolean not null default true
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id smallint not null references plans(id),
  stripe_customer_id     text not null,
  stripe_subscription_id text unique not null,
  status text not null,
  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index on subscriptions (user_id)
  where status in ('active','trialing','past_due');

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  subscription_id uuid references subscriptions(id),
  plan_id smallint references plans(id),
  gross_minor      integer not null,
  tax_minor        integer not null default 0,
  fee_minor        integer not null default 0,
  net_minor        integer not null,              -- commission base
  currency         char(3) not null default 'GBP',
  is_first_payment boolean not null,
  stripe_payment_intent_id text unique not null,
  stripe_invoice_id text,
  status text not null check (status in
    ('succeeded','refunded','partially_refunded','disputed')),
  paid_at timestamptz not null,
  refunded_at timestamptz
);
```

`net_minor` is the commission base. Paying commission on gross means paying out on money the business never received.

### 6.4 Commission and wallet

```sql
create table commission_rules (
  id serial primary key,
  plan_id  smallint not null references plans(id),
  depth    smallint not null check (depth between 1 and 20),
  rate_bps integer not null check (rate_bps between 0 and 4500),
  applies_to text not null default 'first'
             check (applies_to in ('first','renewal','both')),
  effective_from timestamptz not null default now(),
  effective_to   timestamptz
);
create unique index on commission_rules (plan_id, depth, applies_to, effective_from);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  payment_id     uuid not null references payments(id) on delete cascade,
  earner_id      uuid not null references profiles(id),
  source_user_id uuid not null references profiles(id),
  depth          smallint not null,
  base_minor     integer not null,
  rate_bps       integer not null,
  multiplier_bps integer not null default 10000,
  amount_minor   integer not null,
  status text not null default 'pending'
         check (status in ('pending','review','available','paid','reversed','void')),
  clears_at timestamptz not null,
  reversed_reason text,
  created_at timestamptz not null default now(),
  unique (payment_id, earner_id, depth)         -- idempotency
);

create table wallet_entries (
  id bigserial primary key,
  user_id uuid not null references profiles(id),
  entry_type text not null check (entry_type in
    ('commission','task_payment','prize','bonus','payout','reversal','adjustment','fee')),
  amount_minor        integer not null,          -- signed
  balance_after_minor integer not null,
  ref_table text,
  ref_id    uuid,
  memo      text,
  created_by uuid references profiles(id),       -- null = system
  created_at timestamptz not null default now()
);
create index on wallet_entries (user_id, created_at desc);
```

`wallet_entries` is append only. Revoke update and delete from every role including `service_role`. Corrections are new reversing entries, never edits. When finance asks why a balance is what it is, the answer is a scrollable list, not a guess. `audit_log` follows the same rule.

```sql
create table payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  amount_minor integer not null,
  currency char(3) not null default 'GBP',
  method text not null check (method in ('bank_gbp','wise','paypal','bank_pkr')),
  destination_token text not null,    -- provider token. never raw bank details.
  status text not null default 'requested'
    check (status in ('requested','approved','processing','paid','failed','cancelled')),
  requested_at timestamptz not null default now(),
  approved_by uuid references profiles(id),
  processed_at timestamptz,
  provider_ref text,
  failure_reason text
);
```

### 6.5 The one function that matters

Every commission is created by exactly one Postgres function, called only from the Stripe webhook edge function, inside a transaction.

```sql
create or replace function public.award_commissions(p_payment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_max_depth smallint := coalesce(
    (select value::smallint from settings where key = 'commission_max_depth'), 3);
  v_row record;
  v_count integer := 0;
begin
  select * into v_payment from payments where id = p_payment_id for update;
  if not found or v_payment.status <> 'succeeded' then return 0; end if;

  for v_row in
    select e.ancestor_id as earner_id,
           e.depth,
           r.rate_bps,
           coalesce(rk.multiplier_bps, 10000) as multiplier_bps
    from referral_edges e
    join profiles      p  on p.id  = e.ancestor_id
    join ranks         rk on rk.id = p.rank_id
    join subscriptions s  on s.user_id = e.ancestor_id
                         and s.status in ('active','trialing')
    join commission_rules r on r.plan_id = s.plan_id
                         and r.depth = e.depth
                         and r.applies_to in
                             (case when v_payment.is_first_payment then 'first'
                                   else 'renewal' end, 'both')
                         and r.effective_from <= v_payment.paid_at
                         and (r.effective_to is null or r.effective_to > v_payment.paid_at)
    where e.descendant_id = v_payment.user_id
      and e.depth <= v_max_depth
      and p.status = 'active'
      and p.commission_eligible = true
      -- qualification: to earn at depth N you need at least N direct active referrals
      and (select count(*) from referral_edges de
             join profiles dp      on dp.id = de.descendant_id
             join subscriptions ds on ds.user_id = dp.id and ds.status = 'active'
           where de.ancestor_id = e.ancestor_id and de.depth = 1) >= e.depth
  loop
    insert into commissions (payment_id, earner_id, source_user_id, depth,
                             base_minor, rate_bps, multiplier_bps,
                             amount_minor, clears_at)
    values (
      p_payment_id, v_row.earner_id, v_payment.user_id, v_row.depth,
      v_payment.net_minor, v_row.rate_bps, v_row.multiplier_bps,
      least(
        floor(v_payment.net_minor * v_row.rate_bps * v_row.multiplier_bps / 100000000.0),
        floor(v_payment.net_minor * 0.45)             -- hard 45% cap per depth
      )::integer,
      v_payment.paid_at + make_interval(days => v_clear_days)  -- 3 by default
    )
    on conflict (payment_id, earner_id, depth) do nothing;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
```

Companion functions, same discipline: `reverse_commissions(payment_id, reason)` on refund or dispute, `clear_commissions()` hourly moving `pending` to `available` and writing the wallet entry, `recompute_rank(user_id)`, `recompute_commission_eligibility()` nightly, `award_leaderboard_points(payment_id)`, `close_season(season_id)`.

**Unit test `award_commissions` to the penny** with fixtures for: a full three level chain, a chain where the middle member is suspended, a depth-2 earner failing the qualification rule, a refund reversal, a duplicate webhook delivery, and rounding at £11.00 net through 25% at a 1.6x multiplier.

### 6.6 Tasks (admin posted)

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug  citext unique not null,
  category_id smallint not null references task_categories(id),
  summary text not null,                -- public
  brief   jsonb not null,               -- gated. Tiptap document.
  deliverable_type text not null,
  payout_minor integer not null,        -- what the member earns
  currency char(3) not null default 'GBP',
  min_rank_id smallint not null default 1,
  early_access_opens_at timestamptz,    -- rank 3+ see it here
  opens_at  timestamptz not null,       -- everyone else sees it here
  due_hours integer not null,           -- hours from claim to deadline
  max_claims smallint not null default 1,
  claims_used smallint not null default 0,
  status text not null default 'draft' check (status in
    ('draft','scheduled','open','full','in_review','completed','cancelled','expired')),
  compliance_flag text not null default 'standard'
    check (compliance_flag in ('standard','tutoring','restricted')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  -- restricted tasks can never be published
  constraint restricted_never_open
    check (not (compliance_flag = 'restricted' and status = 'open'))
);
```

Plus `task_categories`, `task_claims(task_id, user_id, claimed_at, due_at, status)`, `submissions(task_id, user_id, version, file_paths[], notes, status)`, `submission_reviews(submission_id, reviewer_id, rubric jsonb, score numeric, feedback, decision)`, `task_events` for audit.

Flow: admin creates and schedules → task opens (rank 3+ six hours early) → member claims within their monthly quota and rank gate → member uploads to the private `submissions` bucket → reviewer scores against a published rubric → on approval, `payout_minor` is written to `wallet_entries` as a `task_payment`, `profiles.last_task_approved_at` is stamped, and rank recompute is triggered.

### 6.7 Leaderboard and prizes

See section 8 for the full behaviour. Tables:

```sql
create table seasons (
  id smallserial primary key,
  name text not null,                   -- 'Q4 2026'
  slug citext unique not null,
  track text not null check (track in ('pk','uk','global')),
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming','live','closed','awarded')),
  rules_md text not null,               -- published verbatim before the season opens
  closed_at timestamptz,
  awarded_at timestamptz
);

create table leaderboard_points (
  id bigserial primary key,
  season_id smallint not null references seasons(id),
  user_id   uuid not null references profiles(id),
  points    integer not null,           -- signed. reversals are negative rows.
  reason    text not null check (reason in
    ('referral_signup','retention_90d','task_approved','reversal','adjustment')),
  ref_table text, ref_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on leaderboard_points (season_id, user_id);

create materialized view leaderboard_standings as
  select season_id, user_id, sum(points) as points,
         max(created_at) as last_point_at,
         min(created_at) as first_point_at
  from leaderboard_points group by season_id, user_id;

create table prizes (
  id smallserial primary key,
  season_id smallint not null references seasons(id),
  position_from smallint not null,
  position_to   smallint not null,
  title text not null,                  -- 'Umrah package for two'
  description_md text not null,
  cash_alternative_minor integer,
  currency char(3) not null default 'GBP',
  image_path text
);

create table prize_awards (
  id uuid primary key default gen_random_uuid(),
  season_id smallint not null references seasons(id),
  prize_id  smallint not null references prizes(id),
  user_id   uuid not null references profiles(id),
  final_position smallint not null,
  final_points   integer not null,
  status text not null default 'pending_verification' check (status in
    ('pending_verification','verified','accepted','cash_taken','fulfilled','forfeited')),
  verified_by uuid references profiles(id),
  notes text,
  awarded_at timestamptz not null default now(),
  unique (season_id, user_id)
);
```

### 6.8 Content and system

`posts`, `guides`, `guide_chapters`, `authors`, `tags`, `post_tags`, `job_openings`, `notifications`, `notification_preferences`, `support_tickets`, `ticket_messages`, `audit_log`, `settings`, `feature_flags`, `fraud_signals`, `devices`.

`audit_log(actor_id, action, subject_table, subject_id, before jsonb, after jsonb, ip_hash, created_at)` records every admin write and every money movement. Append only.

### 6.9 RLS posture

- RLS on every table. Default deny.
- A member reads their own `profiles` row, and of others only a public view: `username, display_name, avatar_url, rank_id, country_code, headline`.
- A member reads their own `commissions`, `wallet_entries`, `payout_requests`, `subscriptions`, `payments`, `prize_awards`.
- A member reads `referral_edges` where `ancestor_id = auth.uid()` and `depth <= 3`. They see a downline member's display name, rank, join month, and whether they hold an active plan. They never see another member's earnings, email, phone or address.
- `leaderboard_standings` is readable by anyone, but only exposes `display_name`, `country_code`, `rank_id` and `points` for members with `leaderboard_optin = true`. Opted-out members still compete and still win, they just appear as "Member #1284".
- `tasks` readable when `status = 'open'`, `min_rank_id <= caller rank`, and the caller's access window has opened. The `brief` column is stripped for anonymous readers by a separate public view.
- All writes to money and points tables are revoked from `authenticated` entirely. They happen only through `security definer` functions called by the service role.
- Storage: `submissions` and `kyc` are private, served only via short-lived signed URLs generated after a server-side ownership check.
- Write a Playwright RLS suite that logs in as member A and asserts 403 or an empty set on every one of member B's resources. Run it in CI.

---

## 7. REFERRAL SYSTEM: FULL BEHAVIOUR SPEC

This is the product. It gets the most engineering time and the best screen in the app.

### 7.1 Code and link

- Format: 8 characters, Crockford base32, uppercase, ambiguous characters removed (no I, L, O, U). Example `AW7K4Q2M`. Collision checked on generation with up to 5 retries.
- Rank 4 and above can claim one vanity code: 4 to 16 characters, `a-z0-9-`, checked against a reserved list (admin, support, help, api, login, assignwork) and a profanity list.
- Canonical link `https://assignwork.co.uk/r/AW7K4Q2M`. Every marketing page also accepts `?ref=CODE`.
- Deep links: `https://assignwork.co.uk/r/AW7K4Q2M?to=/prizes/umrah` lands on the campaign page with attribution intact. This matters, because a member sharing the Umrah campaign should not have to send people to the home page.
- Members get: the link, a QR code (PNG and SVG download), one-tap copy, the native share sheet on mobile, and a prewritten share text library.

### 7.2 Share tooling (built for how this will actually spread)

WhatsApp is the first share option, not the fourth, and it is the default on mobile. Order: WhatsApp, copy link, native share sheet, Facebook, then the rest.

The share text library holds editable templates in **English and Urdu**, each under 300 characters so nothing truncates, each carrying the link and no tracking clutter in the visible text. Members edit before sending. Never auto-post on a member's behalf and never request contact list access.

`referral_clicks.channel` is derived from the `utm_source` we append per share button, so the dashboard can honestly tell a member which channel actually converts for them.

### 7.3 Capture flow

`app/r/[code]/route.ts`. Note the Next 16 async APIs.

```ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;          // params is a Promise in Next 16
  const jar = await cookies();            // cookies() is async in Next 16
  ...
}
```

1. Rate limit by IP hash: 30 requests per minute.
2. Look up the code. If unknown, or owned by a suspended member, redirect to `/` with no cookie set, and log it.
3. Read or mint a `visitor_id` first party cookie, 400 day expiry.
4. Insert a `referral_clicks` row with hashed IP and user agent. Never store a raw IP.
5. Upsert `referral_attributions`: set `first_code` only if absent, always update `last_code`.
6. Set httpOnly, secure, `SameSite=Lax` cookie `aw_ref` with the code, 90 day expiry, **only if `aw_ref` is not already set**.
7. 307 to the `to` param if present and same-origin, otherwise `/`.

At signup the server action reads `aw_ref`, validates it, rejects self referral by matching email or hashed phone, sets `profiles.referred_by`, and lets the trigger build the closure rows. `sponsor_locked_at` is stamped in the same transaction. **The sponsor is never editable afterwards**, not by the member and not by admin, except through a `sponsor_override` action requiring two admin approvals and writing to `audit_log`.

### 7.4 The network tree

`/dashboard/referrals` is the flagship screen. It should feel like an instrument, not a list.

**Header:** four stat tiles. Network size, active paid members in network, lifetime commission, commission in the last 30 days with a delta against the prior 30.

**Tree visualiser.** A custom SVG or Canvas orthogonal tree, not a generic org chart library.

- The member is the root, left aligned. Levels flow left to right on desktop.
- Nodes are 4px radius rectangles, 200 by 64px, holding avatar, display name, rank badge and a plan status dot.
- Connectors are 1px orthogonal lines in `--color-line`. Right angled, never curved.
- Node fill encodes status: `--color-surface` for active paid, `--color-surface-alt` for lapsed, ink with white text for the member themselves.
- A lime 2px left border marks a node that produced commission this month.
- Each depth column has a sticky header showing the count and the commission rate at that depth.
- Click a node for a right side panel: join date, rank, plan, lifetime commission generated for you, their own direct count, and leaderboard points they contributed. Collapse and expand subtrees. Search by name to jump and highlight. Zoom 50 to 150%, drag to pan, and a "fit to view" control.
- Beyond 200 nodes, virtualise: render only nodes intersecting the viewport plus a 400px buffer. Load test at 5,000 nodes.
- Below 1024px it becomes a nested accordion. Depth 1 rows expand to depth 2, which expand to depth 3. Same data, same panel on tap, no horizontal scroll, no pinch zoom.
- A visible "view as table" toggle gives a fully keyboard-operable equivalent. Not hidden behind a screen reader class.

**Downline table.** Member, depth, rank, plan, joined, status, commission generated, points contributed, last active. Filter by depth, plan, status, country and date range. Sort on every column. Server side pagination at 50. CSV export.

**Commission ledger tab.** Every row with source member, depth, base, rate, multiplier, amount, status and clearing date. A `pending` row shows a countdown to `clears_at`. A `reversed` row shows the reason inline in `--color-critical`, never hidden. A `review` row shows an expected resolution date.

**Earnings chart.** Stacked bars by depth over 12 months. Violet for depth 1, `#8b74ff` depth 2, `#c0b3ff` depth 3. Flat fills. Toggle to cumulative.

**Materials tab.** Banners in standard sizes, a one page PDF explainer in English and Urdu, the income disclosure, and the share text library.

### 7.5 Earnings calculator (marketing)

On `/referrals`: three sliders for direct referrals, average referrals each of them makes, and plan mix. Live output of monthly commission at each depth plus the total, with the rank multiplier applied.

Directly beneath it, at the same visual weight and not in smaller grey type: "This is a projection, not a forecast. Read the income disclosure." with a link. Ship the calculator and the honest caveat together or ship neither.

### 7.6 Anti abuse

Each of these writes to `fraud_signals` and appears in the admin fraud console:

- Self referral by matching email, hashed phone, or payment fingerprint.
- More than 3 signups from one hashed IP in 24 hours.
- More than 8 signups from one device fingerprint, ever.
- A chain where 3 or more consecutive members share a device fingerprint.
- A payment method fingerprint reused across more than 2 accounts.
- A signup converting within 30 seconds of the referral click.
- A disposable email domain, checked against a maintained list.
- A subscription cancelled within 20 days of a commission clearing, repeated 3 times under the same sponsor.

Flagged commissions move to `review` rather than `available`, and flagged leaderboard points are held out of the published standings until resolved. The member sees "under review" with an expected resolution date, never a silent hold.

---

## 8. LEADERBOARD AND PRIZES

**There is no element of chance anywhere in this system.** No draw, no lottery, no random selection, no odds, no seed, no ticket. Prizes go to whoever finishes highest on a published, auditable points table. It is a performance competition, and it must stay one: never introduce a random tiebreak, a "bonus entry", or a spin-to-win mechanic, because that is exactly what would turn a competition into a lottery.

### 8.1 How points are earned

Published verbatim on `/prizes`, in plain language, before any season opens:

```
When someone you referred directly pays for their first month, you earn:

    Starter referral   10 points
    Pro referral       22 points
    Elite referral     45 points

If that person is still subscribed 90 days later, you earn half again.

Every task you complete and get approved earns 1 point,
capped at 20% of your season total.

If a referral refunds or charges back, those points are removed.
```

Three deliberate design choices, and the reasons, because you will be asked:

1. **Points come from the plan your referral buys, not the plan you bought.** Nobody can buy a better leaderboard position. This is what keeps the competition honest and keeps it clear of the Trading Schemes issues in section 2.2.
2. **The 90 day retention bonus** means the leaderboard rewards bringing in people who stay, not people who sign up and vanish. It is the single most important line in the formula.
3. **The task cap** means the board cannot be won by recruitment alone in spirit, and it gives members who complete a lot of work a real, if smaller, path up.

### 8.2 Seasons and tracks

Three tracks running in parallel, each with its own board and its own prizes. Eligibility is by verified country of residence, set at signup and changeable only with verification.

- **`pk`** — Pakistan
- **`uk`** — United Kingdom
- **`global`** — everywhere else

**Quarterly majors** carry the headline prizes. **Monthly minis** run inside them with smaller wallet-credit awards, so a new member always has something reachable within 30 days rather than staring at a quarterly board they cannot catch.

A **rising member award** goes to the largest month-over-month points increase in each track. Without it, the same ten people win every season and everyone else stops trying by week three. This is a retention mechanic, not a nicety.

### 8.3 Prize catalogue

`PLACEHOLDER: every prize below must be costed and a supplier contracted before a season opens. Nothing is announced that is not already paid for or underwritten.`

**Pakistan track, quarterly:**

| Position | Prize | Cash alternative |
|---|---|---|
| 1 | Umrah package for two, flights, visa, hotel, transfers | Yes |
| 2 | Northern Areas trip for two, Naran and Kaghan, 5 nights | Yes |
| 3 | Laptop | Yes |
| 4 to 10 | Smartphone | Yes |
| 11 to 25 | PKR wallet credit | n/a |
| 26 to 100 | Smaller PKR wallet credit | n/a |

**UK and global tracks, quarterly:** cash awards, equipment, and a paid conference or training budget on the same position bands.

**Monthly minis, all tracks:** wallet credit to the top 3, plus the rising member award.

Rules that make the prizes real rather than a poster:

- Every physical or travel prize carries a **cash alternative** at a published value. A winner is never forced to take a trip they cannot make.
- Travel is fulfilled by a **named third party operator**, contracted in advance. Assignwork does not sell travel and does not hold client money for it.
- The prize page states plainly what is and is not included: visa, flights, hotel category, transfers, meals, and what the winner pays for themselves.
- Winners verify identity before anything is booked or shipped.
- Winner names and photographs are published only with **written consent**. An opted-out winner appears as "Member #1284" and still receives the prize.
- Prizes may be taxable in the winner's country. Say so on the prize page. Do not give tax advice.

### 8.4 Season lifecycle

1. **Open.** Admin creates the season with dates, track, prize table and `rules_md`. The rules are published before the first point is earned and are then immutable. A change requires closing the season and opening a new one.
2. **Live.** Points accrue in `leaderboard_points`. The materialised view refreshes every 5 minutes, plus immediately on a qualifying event. The public board shows a "standings as of HH:MM" timestamp so nobody thinks it is stale or rigged.
3. **Close.** At `ends_at` the season locks. No further points attach to it. A **7 day settlement window** runs, during which refunds, chargebacks and fraud reviews remove points. This window exists because paying out a prize on a referral that charges back a week later is an unrecoverable loss.
4. **Award.** Final standings are computed. Ties break on **who reached that point total first** (`first_point_at`, then `last_point_at`), which is deterministic and needs no randomness. `prize_awards` rows are created. Winners are notified and enter verification.
5. **Publish.** The archived board stays permanently at `/leaderboard/[season]` with final positions, points and the rules that were in force. Anyone can go back and check. That permanent record is the whole reason people will believe the next season.

### 8.5 The public leaderboard page

`/leaderboard` is a marketing page and a retention loop at once. It is public, indexed, and one of the best organic and social assets the platform will have.

- Track switcher: Pakistan, UK, Global. A rectangular segmented control, not a pill.
- Season switcher, current and archived.
- Top 3 rendered as three panels above the table: ink panel, lime position numeral, display name, points, prize title.
- Table from position 4 down, paginated at 50, with a search box.
- A live countdown to season close.
- The points formula shown in full on the page, not behind a link.
- For a signed in member: their own row pinned to the bottom of the viewport with their position and the exact points needed to reach the next band. "You are 34 points from position 10" beats a progress bar.
- Prize table for the current season alongside.
- Below 768px the table drops to position, name, points and nothing else. Everything else moves into a tap-to-expand row.

### 8.6 The Umrah campaign page

`/prizes/umrah` is a dedicated landing page for the Pakistan announcement, and it is the page members will actually share.

Structure: full bleed photograph with a flat scrim, plain H1, exactly what the package includes as a bulleted list with nothing vague in it, the points formula, the current Pakistan standings embedded live, a countdown to close, previous winners once there are any, then FAQ, then a single CTA to sign up carrying the referrer's attribution through.

Copy in English with an Urdu translation available. This is a religious pilgrimage and the copy must be plain and respectful. No urgency tricks, no fake scarcity counters, no "only 3 spots left", no exclamation marks. State the prize, state the rules, state the closing date.

---

## 9. MARKETING PAGES, SECTION BY SECTION

Every section: eyebrow label, then heading, then content. Full bleed image sections break the container. Alternate `--color-bg` and full bleed for rhythm.

### 9.1 Home

1. **Hero.** Full bleed photograph, 88vh, flat `rgba(13,13,13,0.55)` scrim, centred. H1 at Display in white, one Lead line beneath at 90% white capped at 620px, then primary "Start from £11 a month" and tertiary "See how referrals pay". A 1px white 20% divider above a three item proof row at Micro: members, tasks paid this month, commission paid to date. `PLACEHOLDER: all three. Do not ship invented figures.`

2. **Statement block.** `--color-bg`. Eyebrow "INTRODUCTION". One paragraph at H2, maximum 45 words, capped at 720px, ink "Learn more" button beneath. Enormous whitespace. This should feel almost empty.

3. **How the referral works.** Full bleed ink panel, and it comes third because it is the product. Three columns: You, Your referral, Their referral. Orthogonal connectors, the commission rate at each depth as a large lime numeral, one line of explanation under each. Stacks vertically on mobile with the connector rotating to run top to bottom.

4. **What we do.** Eyebrow, H2, four card grid on `--color-surface-alt`, thin isometric illustration, label at the bottom, circular `+` expanding in place. Cards: Paid tasks, Referral commission, Rank progression, Leaderboard prizes. Four across at 1280+, two at 768, one below 640, 1px gap, never a shadow.

5. **Split panel.** Exactly the Hydra composition. Left half lime with a thin concentric arc line graphic in ink, no fill. Right half ink with two enormous lime numerals and Micro labels. 50/50 at 1024+, stacked below, each half at least 420px tall. `PLACEHOLDER: both numerals.`

6. **Live leaderboard strip.** Eyebrow, H2, the current top 5 from each track pulled live, with a countdown to season close and a link to the full board. Revalidate every 5 minutes. If no season is live, this section does not render.

7. **Full bleed image band.** Photograph, dark scrim, centred H2 in white, single tertiary CTA on a white 1px border.

8. **Tasks open right now.** Eyebrow, H2, a horizontally scrolling row of 4 to 6 real open tasks pulled live. Each card: category chip, title, payout, deadline, minimum rank. "See all open tasks" ghost link. If the pool is empty the section does not render. Never fake a task.

9. **Ranks.** Eyebrow, H2, a horizontal 8 step rail. Each step a rectangular node with rank name, multiplier and a one line unlock. Scrolls horizontally on mobile with a visible scrollbar track.

10. **Guides teaser.** Three latest guides as a plain list with category, title, read time, hairline dividers. No cards, no thumbnails.

11. **FAQ.** Eight questions, single column accordion, capped at 780px, plus a link to the help centre. FAQPage JSON-LD.

12. **CTA band.** The Cline band. Full width lime, ink text, 160px vertical padding, one line at Display size mixing weight 400 and 700 in the same sentence. Two plain underlined text links on the right: "Get started" and "Talk to us". No buttons in this band. At 768 and below the line wraps and the links stack beneath at H4.

13. **Footer.** `--color-bg`, three zones. Top: four link columns (Platform, Programme, Company, Legal) plus a newsletter input with an inline square arrow submit. Middle: social icons left, copyright and Terms and Privacy centre, two UK office blocks right at Small size. Bottom: the oversized `assignwork` wordmark at 22vw, ink, clipped by the viewport bottom edge.

### 9.2 Other marketing pages

- `/how-it-works` — numbered vertical walkthrough, sticky step index at 1024+, alternating image and text rows, ending in the pricing preview.
- `/referrals` — how it works, the calculator, the rate table by plan and depth, the qualification rules in plain words, the income disclosure link, and an FAQ that answers the awkward questions honestly: what happens if my referral cancels, when do I get paid, why was my commission reversed.
- `/leaderboard` and `/leaderboard/[season]` — section 8.5.
- `/prizes` and `/prizes/umrah` — section 8.3 and 8.6.
- `/pricing` — four plan cards, monthly and annual toggle as a rectangular segmented control, a full comparison table collapsing to a per-plan accordion below 768, the currency switcher including PKR, a plan FAQ, and the VAT line.
- `/tasks` — public catalogue, faceted by category, payout band, deadline and minimum rank. Summary, payout and deadline public; full brief gated behind signup. This is the SEO engine, so every task gets a real URL, structured data, and ISR at 60 seconds.
- `/guides` — 5 or 6 learning tracks with a chapter list, progress tracking for signed in members, previous and next navigation, an in-page table of contents highlighting on scroll, and read time.
- `/blog` — featured post, chronological grid, tag filtering, author pages, related posts, newsletter block at the article foot.
- `/about`, `/careers` with `/careers/[slug]`, `/contact` writing to `support_tickets`, and the legal set: terms, privacy, cookies, referral terms, competition rules, income disclosure, refunds.

---

## 10. THE MEMBER DASHBOARD

Shell: 240px fixed left sidebar at 1280+, collapsing to a 64px icon rail at 1024, and to a 5 item bottom tab bar at 768 and below. Top bar: breadcrumb, global search (tasks, guides, downline members), notification bell with unread count, account menu.

**Overview.** Four stat tiles: available balance, pending commission, leaderboard position with points to the next band, current rank with a progress bar. Then two columns at 1280+. Left: your active tasks, and tasks matching your rank. Right: the referral snapshot with the copy-link control front and centre, the last 5 wallet entries, and the season countdown. Single column below 1024.

The referral link control appears on the overview, not buried three clicks deep. It is the single most used control in the product.

**Referrals.** Section 7.4.

**Leaderboard.** The member's position across all three boards they are eligible for, points breakdown showing exactly which referral produced which points and when, points needed for the next band, and season history with any prizes won.

**Tasks.** Tabs: available, active, in review, revisions, completed. Available shows task cards with a claim button that respects the access window, monthly quota and rank gate, and states the exact reason when disabled rather than just greying out. Active shows a countdown turning `--color-warning` at 24 hours. Submission is drag and drop to a private bucket with progress, version history and a notes field. Review shows the reviewer's score against each rubric line plus written feedback.

**Earnings.** Balance card with the payout threshold and a request button, disabled below the threshold with the reason stated. Ledger table, filterable and exportable. Commission tab per 7.4. Payout history with a status timeline. Self billing invoices as downloadable PDFs.

**Rank.** Current rank, four criteria each with a progress bar and the exact remaining amount, full rank table, promotion history, and a demotion warning banner during grace.

**Prizes.** Awards won, verification status, the claim flow, the cash alternative choice, and fulfilment tracking.

**Learn, notifications, settings.** Settings covers profile, display name and leaderboard opt-in, payout method, security (password, TOTP 2FA, active sessions with revoke), notification preferences per channel and per event, and account closure with a clear statement of what happens to the downline and to pending commission.

---

## 11. ADMIN PANEL

Separate route group, separate layout, role gated in `proxy.ts` and again in every server action. Denser than the member app: 40px rows, more columns, keyboard shortcuts.

KPI dashboard (MRR, active subscriptions, churn, new members by source and country, outstanding commission liability, payout queue value, task fill rate, average QA score, points issued this season) · Members (search, filter, 360 detail, suspend, restrict, read-only impersonation that is logged and banner-flagged) · Referral explorer (search any member, view their full tree, trace any commission back to its payment) · Commission rules (edit rates with an effective-from date, never destructive, always a new row) · Fraud console (signal queue, bulk resolve, pattern view) · **Tasks** (create, schedule, bulk import via CSV, category management, the compliance flag gate, duplicate a task as a template) · Review queue (submission viewer, rubric scoring, approve, revise, reject, plagiarism result) · Payouts (queue, approve individually or in batch, CSV and BACS export, mark paid, failure handling) · **Seasons and prizes** (create season, publish rules, define the prize table, monitor standings, close, run settlement, generate awards, record verification and fulfilment, manual point adjustment with a mandatory reason that writes to `audit_log`) · Content (Tiptap for posts and guides, SEO fields, scheduling, preview) · Support (ticket queue, canned replies, assignment) · Settings and feature flags · Audit log with full text search and CSV export.

Every destructive admin action requires typed confirmation of the subject's name. Every admin write lands in `audit_log`. Nothing is hard deleted.

---

## 12. PAYMENTS AND PAYOUTS

### 12.1 Money in

Stripe Checkout in subscription mode. Products and prices created once by a seeded script, IDs stored in `plans`. Stripe Tax for VAT. Customer Portal for plan changes, card updates and cancellation.

Webhook at `/api/webhooks/stripe`, signature verified against the raw body. **Every event is written to a `stripe_events` table keyed on the Stripe event ID before any processing**, which is what makes redelivery safe. Handle `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`.

On `invoice.paid`: insert the payment with `net_minor` from the balance transaction, then call `award_commissions`, then `award_leaderboard_points`. On refund or dispute: `reverse_commissions` and write a negative `leaderboard_points` row.

### 12.2 The Pakistan payment problem, flagged now rather than at launch

`DECISION: this needs solving before the Pakistan campaign runs, and it is the largest commercial risk in the plan.`

A UK Stripe account can accept internationally-enabled cards from Pakistan, but a large share of Pakistani debit cards are not enabled for international e-commerce by default, and card penetration is low relative to mobile wallets. If the Umrah campaign drives significant Pakistani traffic to a card-only checkout, most of that traffic cannot pay, and the referrers who worked for it will conclude the platform does not work.

Options, in the order I would evaluate them:

1. **Add a local payment service provider as a second payin rail** (Safepay, PayFast, or an aggregator supporting JazzCash and Easypaisa). Usually requires a Pakistani entity or a local partner. Highest conversion, highest setup cost.
2. **Annual plans only for the PK track**, reducing the number of times a card has to work from twelve to one.
3. **Launch the PK campaign to card-enabled users only** and say so plainly in the campaign copy.

Build the schema so this is not painful later: `payments.provider` and `payments.provider_ref` are generic, `plans` are provider agnostic, and `award_commissions` keys on `payments`, not on anything Stripe-shaped. Adding a second provider should mean a new webhook handler and nothing else.

### 12.3 Money out

Members request payouts above their plan threshold. Requests enter a queue, finance approves, and the batch exports or fires through the provider. Bank details are tokenised by the provider and never stored. Self billing invoices generate as PDFs. Payouts are blocked while `kyc_status <> 'verified'` once lifetime earnings pass £500, and the member is told this at £400 rather than at the moment they are blocked.

---

## 13. CONTENT AND COPY RULES

Nothing on this site may read as though a language model wrote it. These are review criteria, not preferences.

**Never use:** em dashes or en dashes in body copy, use a comma, a full stop or a colon. The words unlock, seamless, elevate, supercharge, revolutionise, empower, leverage, journey, harness, unleash, cutting edge, game changing, next level, transform your. The opener "In today's fast paced world". The construction "It's not just X, it's Y". The construction "Whether you're X, Y, or Z". A three fragment tricolon as a heading. A rhetorical question opening a section. Exclamation marks. Emoji. Title Case headings.

**Always:** British English (organise, programme, licence, favour, cheque). The £ symbol before the figure. UK dates (26 August 2026). Second person for the member, first person plural for the company. Real specifics over superlatives: "tasks pay between £6 and £140" beats "competitive rates". Short sentences carrying one idea.

**Voice:** a UK operator who has actually run this, writing to someone deciding whether to spend £11. Direct, unhurried, slightly plain. It states what happens, including the parts that are not flattering.

**Reference copy, use as a calibration sample:**

> Eyebrow: INTRODUCTION
>
> H1: Get paid for the work. Get paid again for who you bring.
>
> Lead: Assignwork is a UK platform for paid online tasks. Complete work that matches your rank, and earn commission on every member you introduce, three levels deep.
>
> Statement block: We built Assignwork around one idea. The people who bring good members in should be paid properly for it, and they should be able to see exactly where every pound came from. Tasks fund the platform. Referrals are how most members earn the rest.
>
> Leaderboard section: Every referral earns points. The points are published. At the end of each season the top of the board takes the prize, and the board stays online afterwards so anyone can check.
>
> CTA band: Ready when you are. → Get started · Talk to us

Every number in shipped copy is real or the section does not ship. An empty state beats a fabricated statistic.

**Urdu copy** is a real translation commissioned from a person, reviewed by a native speaker. It is not machine output, and it is not shipped until it has been read by someone who speaks the language.

---

## 14. PAKISTAN AS A FIRST CLASS MARKET

Treating the Pakistan track as an afterthought will lose it. Engineering consequences:

- **Performance budget.** Assume a low-end Android device on 4G, sometimes 3G. Marketing routes ship under 120KB of gzipped JS. The leaderboard is server rendered, not a client-side data grid. The tree visualiser is dynamically imported and never loaded on a marketing page. Test on a throttled Moto G class profile, not on a MacBook.
- **Images.** AVIF with WebP fallback, `sizes` set correctly, `priority` only on the LCP image. Hero images capped at 1600px wide.
- **WhatsApp first.** It is the default share target on mobile and the first button everywhere, with English and Urdu templates.
- **Currency.** PKR shown alongside GBP everywhere a price or a payout appears, at an indicative daily rate, always labelled as indicative and always beside "billed in GBP".
- **Locale.** `en-GB` default, `ur-PK` for the campaign page and share materials. Right to left support for Urdu blocks, using logical CSS properties (`margin-inline-start`, not `margin-left`) throughout the codebase from day one, because retrofitting that is miserable.
- **Payouts.** Pakistani members need a working payout rail before they earn, not after. Wise supports PKR payouts to bank accounts. Verify the corridor and the fees before launch and publish the fee on the payout page.
- **Support hours.** State them in PKT as well as GMT on the contact page.

---

## 15. RESPONSIVE, ACCESSIBILITY, PERFORMANCE, SEO

**Breakpoints:** 390, 640, 768, 1024, 1280, 1440, 1920. Mobile first, verified at all seven.

No horizontal page scroll at any width, ever. Tables collapse to stacked cards below 768. The referral tree becomes an accordion below 1024. The leaderboard drops to three columns below 768. Charts get a 240px minimum height and their own horizontal scroll container. Touch targets 44px minimum. Sticky elements never take more than 20% of a mobile viewport. Use `100dvh`, never `100vh`, and test against the iOS Safari dynamic toolbar.

**Accessibility, WCAG 2.2 AA.** Real alt text or `alt=""` where decorative. Heading order never skips. Every form control has a `<label>`. Errors announced via `aria-live`. Modals trap focus and restore it on close. Skip to content link. The tree has a visible "view as table" toggle giving a keyboard-operable equivalent. Colour is never the only carrier of meaning, so every status dot is paired with text. The leaderboard is a real `<table>` with `<caption>` and scope attributes, not a div grid.

**Performance.** LCP under 2.0s on 4G, INP under 200ms, CLS under 0.05. Route-level code splitting, dynamic import for the tree visualiser and the Tiptap editor. Marketing and content routes static or ISR, dashboard dynamic. No client-side fetching above the fold on any marketing page. Font subsetted to latin plus arabic for the Urdu pages, `display: swap`, with a matched fallback metric.

**SEO.** Unique title and description per route via the Metadata API. Canonicals. OG images generated per route by `@vercel/og`, and the leaderboard OG image renders the current top 3, because that is what gets shared. JSON-LD for Organization, WebSite with SearchAction, BreadcrumbList, Article, FAQPage, and JobPosting. `sitemap.ts` and `robots.ts` generated from the database. `hreflang` for `en-GB` and `ur-PK` on the pages that have both. `/tasks`, `/guides` and `/leaderboard` are the organic engines and get the deepest internal linking.

---

## 16. BUILD ORDER

Do not start a phase until the previous one is deployed and verified. Note that the referral engine comes before the marketplace, because it is the product.

0. **Foundation.** Repo, Next.js 16.3.3, Tailwind 4 tokens, Inter Tight, the full component library on a `/kitchen-sink` route, Supabase project, CI with typecheck, ESLint as its own step, unit tests and Playwright.
1. **Marketing shell.** Header, footer, CTA band, section primitives, home page complete, legal pages, contact.
2. **Auth and profiles.** Signup, login, verification, onboarding, profile, RLS baseline, the RLS test suite, `proxy.ts` session refresh.
3. **Referral capture.** Codes, `/r/[code]`, cookies, attribution, the closure table and its trigger, cycle prevention, share tooling with the WhatsApp path.
4. **Billing.** Stripe products, Checkout, portal, webhook with the `stripe_events` idempotency table, subscriptions, payments.
5. **Commission engine.** Rules, `award_commissions`, clearing, reversal, wallet ledger, full unit suite. Not done until the maths is proven at the penny.
6. **Referral dashboard.** Shell, overview, the tree, downline, ledger, materials, calculator. The flagship screen gets its own phase.
7. **Tasks.** Admin task creation, catalogue, claims, submissions, review, wallet payment on approval.
8. **Ranks.** Recompute, eligibility recompute, progression UI, gating, demotion grace.
9. **Leaderboard.** Points award and reversal, seasons, tracks, the materialised view, the public board, the member view.
10. **Prizes.** Prize tables, season close, settlement window, award generation, verification, claim and fulfilment flow, the Umrah campaign page.
11. **Payouts.** Requests, queue, approval, export, self billing invoices, KYC gate, PKR corridor.
12. **Admin.** Everything in section 11.
13. **Content.** Blog, guides, editor, SEO, sitemap, Urdu translations.
14. **Hardening.** Rate limits, fraud console, audit review, accessibility audit, tree load test at 5,000 nodes, low-end Android performance pass, penetration test, income disclosure with real data.

---

## 17. DEFINITION OF DONE

A feature is not done until all of these are true.

- Renders correctly at 390, 768, 1024, 1440 and 1920 with no horizontal scroll.
- Keyboard operable end to end with visible focus at every stop.
- Loading, empty, error and success states all exist and are all designed.
- Every server action validates with Zod on the server, not only on the client.
- RLS verified by a test that logs in as another member and fails to read the data.
- Money and points paths unit tested with rounding, reversal and idempotency cases.
- No gradient, no glass blur, no pill radius, no banned icon, no em dash in copy, no element of chance.
- Lighthouse on every marketing route: performance 90+, accessibility 100, best practices 100, SEO 100.
- Copy read aloud once. If it sounds like a brochure, rewrite it.

---

## APPENDIX A: KERNEL PROMPT

Paste this to re-anchor a drifting session.

> Building Assignwork, a UK referral-led work platform aimed primarily at Pakistan. The referral programme is the product: **a flat 40% on every direct referral, on every plan**, then smaller shares two and three levels down, a closure table for the chain, and a public points leaderboard whose top finishers win prizes including Umrah packages on the Pakistan track. Admin posts paid tasks, members complete them and get paid into a wallet. **PKR is the base currency, stored as paisa.** Plans are 5,000 / 8,000 / 9,999 PKR, paid **once**: no subscription, no renewal. Commission is paid once per member, never on a renewal or an upgrade. The rank multiplier applies to levels 2 and 3 only, never to the 40%.
>
> **There is no element of chance anywhere.** No draw, no lottery, no random selection, no odds, no seed. Prizes go to the top of a published points table, ties broken by who got there first.
>
> Stack: Next.js 16.3.3 (Turbopack default, `proxy.ts` not `middleware.ts`, `await cookies()`, `await params`, `revalidateTag(tag, profile)` / `updateTag()` / `refresh()`), React 19.2.8, TypeScript strict, Tailwind 4.3.3 CSS-first tokens, shadcn on Radix restyled, Supabase Postgres with RLS on every table, Supabase Auth via `@supabase/ssr`, Stripe 22.5.0 in GBP, Resend, TanStack Query in the dashboard only. Node 20.9+.
>
> Design: one font, Inter Tight 400 to 700, sentence case headings. Lime `#d4f717` is a fill only with ink `#0d0d0d` text on it and never text on light. Violet `#5a38fd` for links, focus and charts. Page background `#f1f1f1`, cards `#e7e7e7` flat or `#ffffff` with a 1px `#d9d9d9` border. Max radius 6px, buttons 4px. No pill buttons, no pill header, no pill anything. No gradients, no glass blur, no shadows except floating overlays. Lucide at strokeWidth 1.25, never sparkles, zap, rocket, wand, lightbulb or emoji. An 11px uppercase lime-highlighted eyebrow sits above every section heading, sections get 160px vertical padding on desktop. Whitespace is the design.
>
> Money is integer pence. Commission is created only by the `award_commissions` Postgres function, called only from the Stripe webhook, unique on `(payment_id, earner_id, depth)`. The chain is a closure table `referral_edges(ancestor_id, descendant_id, depth)`, never a recursive walk. `wallet_entries`, `leaderboard_points` and `audit_log` are append only, corrections are new signed rows.
>
> Copy is British English, second person, no em dashes, no exclamation marks, no "unlock", "seamless", "elevate", "supercharge" or "in today's fast paced world", and no invented statistics. Pakistan is a first class market: WhatsApp-first sharing, PKR display, Urdu on campaign pages, logical CSS properties throughout, and a 120KB JS budget on marketing routes. Every page works at 390px and 1920px.

---

## APPENDIX B: OPEN DECISIONS

| # | Decision | Recommended | Owner |
|---|---|---|---|
| 1 | Platform positioning against the 2022 Act | Commercial tasks plus labelled tutoring, restricted flag blocked at DB level | Founder |
| 2 | **Pakistan payin rail** | Add a local PSP or run PK on annual plans only. Largest commercial risk in the plan. | Founder |
| 3 | Commission depth | 3 levels, schema supports more, the 8 lives in ranks | Founder |
| 4 | Renewal commission | Yes, at half the first payment rate, depth 1 only | Founder |
| 5 | Prize budget per season | Must be costed and underwritten before a season opens | Founder |
| 6 | Travel fulfilment operator | Named third party under contract, cash alternative on every prize | Ops |
| 7 | Payout provider and PKR corridor | Wise Platform, verify corridor and publish the fee | Ops |
| 8 | Company registration and VAT status | Required before Stripe goes live | Founder |
| 9 | Urdu translation | Commissioned from a person, reviewed by a native speaker | Marketing |
| 10 | Real launch statistics | No number ships until it is real | Founder |
