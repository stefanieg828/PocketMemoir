# Stickers

Private, local decorative overlays for the scrapbook page and cork wall — not
a social feed, and not a replacement for scrap kinds / category chips.

## Pack model

| Field | Notes |
|-------|--------|
| `id` | Stable slug, e.g. `free-starter`, `drop-2026-10` |
| `name` | Soft lowercase display name |
| `free` | `true` for the always-on starter; unlock packs later |
| `dropDate` | ISO date when a weekly/monthly pack lands (optional for free) |
| `stickers[]` | Marks in the pack (`id`, `name`, `mark`) |

Unlock can open a bigger library later. Do not invent App Store / Play Billing
here — same 99¢ site unlock as Comic / Riso (see `docs/unlock.md`).

## Placement

Stickers sit as decorative overlays on:

- the scrapbook album page (flip spreads + empty page)
- the cork wall (overview + zoomed board)

They do **not** replace entry kinds, shelf boards, or the Keep form “sticker”
chips (those are category labels).

### Place mode (primary)

1. Tap a mark in the tray → place-mode arms (“tap the page to stick it”).
2. Tap the scrapbook page or cork where you want it → sticker lands at that
   percent point (of the sticker-layer box), with a light random tilt/scale.
3. Cancel via the tray, or tap the same chip again.
4. Fallback: **stick randomly** still scatters if you prefer.

### Drag + peel

- Drag a placed sticker to move it (pointer + touch; `touch-action: none`).
- Short tap (no drag) peels it off. Drag does not remove.
- Peek mode: stickers from the peek file show read-only; tray / place / drag /
  remove stay off.

Cap: `PAGE_STICKER_CAP = 24`.

## Free starter pack (~12–16 marks)

Soft scrapbook / washi look — layered fills, soft highlights, slight imperfect
strokes, paper grain. Still cute, not photoreal. Fits Soft Storybook / Comic /
Riso.

Hearts, stars, washi bits, smile wax, flower, leaf, bow, pin, cloud, plus
postage stamp, foil star, tiny ticket, pressed flower. See
`src/lib/memoir/stickers.ts` → `FREE_STARTER_PACK` and
`src/components/sticker-mark.tsx`.

## Cadence

- **Weekly or monthly drops** of small themed packs (seasonal, food, pets,
  travel, tiny jokes).
- Keep packs small (6–12 marks) so the tray stays cozy.
- Free starter always stays free; new drops can be unlock-gated later.

## Suggestions inbox

People can email sticker and scrap ideas to the creator. Same inbox as “Got an
idea?” — no in-app social feed.

## Persistence

Placed stickers live in the local memoir store (`pageStickers`) and travel in
backup / peek files when present (optional field; older files omit them safely).
