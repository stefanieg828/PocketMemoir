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
here — unlock is the same soft gate as Comic / Riso Looks for now.

## Placement

Stickers sit as decorative overlays on:

- the scrapbook album page (flip spreads + empty page)
- the cork wall (overview + zoomed board)

They do **not** replace entry kinds, shelf boards, or the Keep form “sticker”
chips (those are category labels).

## Free starter pack (~10 basics)

Cartoon flat, thick outline, Saturday-morning. No photoreal.

Hearts, stars, washi bits, smile wax, tiny doodles (flower, spark, bow, pin
dot, leaf, cloud). See `src/lib/memoir/stickers.ts` → `FREE_STARTER_PACK`.

## Cadence

- **Weekly or monthly drops** of small themed packs (seasonal, food, pets,
  travel, tiny jokes).
- Keep packs small (6–12 marks) so the tray stays cozy.
- Free starter always stays free; new drops can be unlock-gated later.

## Suggestions inbox

People can email ideas to **scraps@pocketmemoir.fun**. Same inbox as “Got an
idea?” — no in-app social feed.

## Persistence (v1)

Placed stickers persist in the local memoir store (`pageStickers`). Cap the
count so the page does not fill up forever. Backup / restore of stickers can
follow in a later pass.
