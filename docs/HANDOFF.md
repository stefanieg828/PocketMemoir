# PocketMemoir — Build Mode Handoff

Paste this into Grok Build. Source lived in `grok-workspace-1.zip`. Domain bought: **PocketMemoir.fun** (Hostinger DNS; prefer GitHub Pages later, not Vercel).

## What it is

A private scrapbook / corkboard for random life junk: notes, people, tickets, lists, wins — not a social network and not a journaling app with prompts. Cute container, real life inside it (user photos sit in drawn frames).

Tagline we used: *A cartoon scrapbook for the random stuff life drops on you.*

App name: **PocketMemoir**

## Visual direction (LOCKED)

User rejected the old illustrated-mascot / photoreal polaroid look.

**Cartoon / sticker-book / Saturday-morning.** Thick outlines, flat color, washi as stickers, smiling wax seal, candy pushpins. Not 3D clay, not real paper stock photos, no moth/host mascot as the hero.

Hybrid: **cartoon chrome + real user photos** in drawn frames.

Two looks, **same data and same features**:

| Look | Default | Metaphor | Primary CTA |
|------|---------|----------|-------------|
| **Scrapbook** | YES | Cream album, maroon spine, washi, wax seal | **Stick it in** |
| **Corkboard** | flip | Cork dots, index cards, colored pins | **Pin it** |

Nav stays lean: **Shelf · Calendar · Look**. Do not add Home / Favorites / Me / bear tab. Generator mocks invented extra chrome — ignore it.

Empty states:
- Scrapbook: “The page is blank on purpose.” / “Nothing stuck in yet.”
- Corkboard: “Plenty of cork left.” / “Nothing pinned yet.”

Wordmark: text + small heart blob. No 3D host character images.

## One add flow (LOCKED)

**One Add screen.** User writes first (or picks category chips on the same screen). No separate “what kind?” picker page.

Flow: category chips → optional photo → title + details → seal/pin submit.

Default category: **Note**.

Add headings:
- Scrapbook: “Stick something in”
- Corkboard: “Pin something”

## Categories (21) → 6 shelf buckets

Kinds stay the same under the hood:

`note, moment, person, place, thing, event, idea, list, trip, work, food, recipe, pet, health, money, quote, dream, ticket, song, win, lesson`

Browse groups them into **6 buckets** (Shelf chips = All + buckets, not 21 kinds):

| Bucket | Kinds |
|--------|-------|
| Scraps | note, idea, list, quote |
| People | person, pet |
| Out & About | place, trip, ticket, event, moment |
| Everyday | thing, food, recipe, work, money, health, song |
| Proud | win, lesson |
| Dreams | dream |

Kind still shows as a sticker on the card + detail. Add form: bucket chips → kinds inside the bucket (default **Scraps / Note**). One Add screen still.

Calendar-worthy kinds: `event, moment, trip, health`.

## Entry status (life-stage shelves)

Optional `status` on each entry, default **`fresh`**. Existing localStorage rows migrate to `fresh`.

| Status | Scrapbook | Corkboard |
|--------|-----------|-----------|
| fresh | On the page | Up on the board |
| soft | Soft pile | Quiet corner |
| keepsake | Keepsakes ♡ | Proud pins ♡ |
| tucked | Tucked away | Boxed up |

Shelf Home sections by status (Fresh / Soft / Keepsakes visible; Tucked behind a fold). Move among statuses from the card chip or detail.

## Data model notes

`MemoirEntry`: title / how / facts / note / photo / happenedOn / **status**. Kind chosen on the form; bucket is derived from kind. Legacy jackets `pip` / `meg` → `scrapbook`; `ash` → `corkboard`. Unknown kinds → `note`. Unknown/missing status → `fresh`.

Persist key remains `pocketmemoir.v1`. Keep `normalizeJacket()` + `normalizeStatus()` on rehydrate.

## Code already changed (in the extracted workspace)

These were edited in `/home/workdir/pocketmemoir` after unzipping the workspace. Re-apply if Build starts from the original zip:

- `src/lib/memoir/types.ts` — 21 kinds, jackets `scrapbook` | `corkboard`, `normalizeJacket`, `CALENDAR_KINDS`
- `src/lib/memoir/copy.ts` — KIND_META + FILTERS + APP_NAME / TAGLINE
- `src/lib/memoir/jackets.ts` — two looks; `hostSrc` / `stampSrc` return empty (no mascot art)
- `src/lib/memoir/store.ts` — default jacket scrapbook; migrate old jackets + bad kinds
- `src/lib/memoir/dates.ts` — calendar uses CALENDAR_KINDS
- `src/routes/__root.tsx` — `data-jacket="scrapbook"`
- `src/routes/keep.tsx` — always show KeepForm; no TypePicker gate
- `src/routes/index.tsx` — empty state is caption + one seal, not a grid of every kind
- `src/components/keep-form.tsx` — internal kind state + category chips
- `src/components/filter-tabs.tsx` — bucket chip tabs (All + 6)
- `src/components/shelf-zone.tsx` / `status-mover.tsx` — status shelves + move menu
- `src/routes/index.tsx` — section Shelf by status zones; tucked fold
- `src/components/jacket-picker.tsx` — “Look” not “Jacket”; two swatches; 2-col grid
- `src/components/polaroid.tsx` — no stamp `<img>`; kind mark placeholder when no photo
- `src/components/wordmark.tsx` — heart blob, no sit image
- `src/components/host.tsx` — returns null
- `src/components/kind-mark.tsx` — new
- `src/components/keep-seal.tsx` — still uses `JACKET_META[jacket].keepLabel`
- `src/styles.css` — `.kind-chip`, corkboard body texture, look swatches, cartoon seals

## Still to polish in Build

- Push cartoon CSS further (washi stickers, pin dots on cork cards, mixed card sizes, slight tilts).
- Public-looking empty scrapbook page + one pinned card empty cork.
- Calendar copy/seals to match Stick it in / Pin it.
- Drop leftover TypePicker route usage if it still exists.
- Remove dead host/stamp image references so builds don’t 404.
- Sample scraps seed Soft pile + Keepsakes for screenshots (see store seeds).
- Accessibility: chips as radiogroup, seal buttons labeled.

## Do not resurrect

- pip / meg / ash jacket names in UI
- 3D host / moth / polaroid-stamp portraits as empty-card art
- Extra bottom nav from the image mocks
- “Jacket” wording — it is **Look**
- Forcing every card to be a square polaroid

## Deploy note (not blocking Build)

User has **PocketMemoir.fun** at Hostinger. They do not want Vercel. GitHub repo + GitHub Pages + Hostinger DNS is the intended path when the UI is ready.

## Voice

Warm, short, handwritten-adjacent. Not wellness-app copy. Not “capture your journey.” More: stick it in the book before it walks off.

## Flip album slice (feature/visual-polish)

Scrapbook Look Shelf is now a **flip album**: open two-page spread per bucket (Scraps → Dreams). Adjacent flips use a single page-turn; jumping tabs whooshes. Tucked stays behind a fold under the book. Corkboard Look still uses status shelf sections (cork wall is next).

**Cover = Add:** scrapbook `/keep` is a closed album cover; sealing navigates to `/?spread=<bucket>&flipIn=1` and opens that spread.

Do **not** start customization packs or canvas drawing yet. Corkboard wall+zoom is the next visual pass — keep Look cork usable as sectioned boards for now.
