# Images

## Active generated collection

The site now uses `assignwork/*.webp`. Originals, prompts and placement notes
are in `docs/ARTWORK.md`, `docs/artwork-originals/` and `docs/visual-assets.json`.
Run `node scripts/prepare-artwork.mjs` to create missing WebP derivatives.
The previous `hero.jpg`, `band-members.jpg` and `umrah.jpg` paths below are
historical guidance and are no longer required by the active pages.

## Previous placeholder guidance

Drop files here with these exact names and they appear on the site with no code
change. Until then each slot degrades to a clean solid ink panel rather than a
broken image icon, so the layout stays intact while you source photography.

| File | Used by | Suggested crop | Notes |
| --- | --- | --- | --- |
| `hero.jpg` | Home hero | 2400 x 1400, focal point upper third | People working, natural light. The heading sits centred over it, so keep the middle uncluttered. |
| `band-members.jpg` | Home image band | 2400 x 1100, focal point centre | Two or three people mid conversation. Warm, candid, not a stock handshake. |

## Rules

- Export at **1600px wide maximum** for anything below full bleed, and 2400px
  for the two full bleed slots. A large share of the Pakistan audience is on a
  low-end Android over 4G, and the marketing routes have a hard performance
  budget.
- Prefer **AVIF** with a JPG fallback. `next.config.ts` already lists AVIF and
  WebP first.
- A flat `rgba(13,13,13,0.55)` scrim sits over every photograph. Pick images
  that still read at that darkness. Never add a gradient overlay to compensate.
- No stock photography of glowing screens, abstract networks, or anyone pointing
  at a laptop. The reference sites use plain documentary photography and so
  should we.

## Illustrations

The four service card drawings are inline SVG in
`components/marketing/illustrations.tsx`, not files. If commissioned isometric
artwork lands later, put the SVGs in `/public/illustrations` and swap the
component bodies. Keep the single 1px stroke, no fill, no colour.
