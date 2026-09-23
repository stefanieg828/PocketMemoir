# PocketMemoir ← FlutterHobby cues (local comparison)

Independent skim for Stefanie: make PocketMemoir feel more like FlutterHobby — cozier, tighter, less “junk drawer.” Docs-only; no app code changed.

**Refs copied:** `docs/preview/fh-refs/`
- `fh-greenhouse-mock.jpg` — painted greenhouse mock (spatial shelves + potting bench)
- `fh-home-shelves.png` — live Home: In season / Resting / Proud shelf / Archive
- `fh-room-center.png` — craft-metaphor buddy moment (tend / water)

Live FH preview: https://stefanieg828.github.io/flutterhobby/

---

## 1. FlutterHobby vibe cues to steal

### Information architecture (steal this hardest)
- **Status shelves, not type dumps.** Home zones hobbies by life-stage: **In season · Resting · Proud shelf · Archive**. Same objects, different emotional weight.
- **Solstice ritual** re-sorts into those shelves (“still yours — just quieter”). PM has no equivalent — once stuck, everything is equal noise.
- **Collections** = nests + theme switch, not another flat list. Depth under a parent, not 21 peer chips.
- Lean-ish nav with purpose: Home / Collections / Solstice / You. PM’s Shelf · Calendar · Look is already lean — keep it; enrich **Shelf**.

### Craft metaphors (theme-locked voice)
Each room rewrites the whole verb set (Greenhouse plant/water/sip; Basement stash/dust; Closet hang/try-on; Desktop open/save; Workshop tighten/hang). PM already has Stick it in / Pin it — good. Extend that voice into **browse** (not only add).

### Spatial chrome
Wood signs, shelf bays, potting-bench CTA, empty rings. Furniture organizes, chips don’t. FH reads as a room; PM Shelf still reads as a filtered list inside a pretty frame.

### Color + soft craft
FH greens: `#1b4332` ink, `#74a892` accent, `#52796f` muted, `#f4f7f0` wash, blush `#c4788a`, plant swatches sage/blush/sky/honey/lavender/terracotta. Warm, limited, intentional. PM scrapbook (cream / maroon seal `#9b2d4a` / candy washi) and corkboard (cork `#e2a15a` / candy pins) are already strong — **keep both Looks**; don’t add a third world.

### Voice
Short, forgiving, handwritten-adjacent: “Any amount counts,” “tucked away, not deleted,” “Small steps, big growth ♡.” Matches PM HANDOFF voice (“stick it in before it walks off”) — apply it to shelves, not only empty states.

---

## 2. PocketMemoir pain points (“feels like a dump”)

From `docs/HANDOFF.md`, `src/lib/memoir/copy.ts`, `filter-tabs.tsx`, `keep-form.tsx`, `routes/index.tsx`:

1. **21 peer kinds, no hierarchy.** `FILTERS` = All + every plural in one horizontal chip row. Same flat map on the Keep form (`ENTRY_KINDS.map`). Taxonomy is the UI.
2. **Browse = type OR search only.** No status / season / proud zone. Everything shares one album page or cork grid.
3. **Equal weight.** A wifi password Note and a Win sit as siblings; nothing like Proud shelf to celebrate, nothing like Resting to soft-park.
4. **Chip scroll fatigue.** 22 chips (All + 21) on Shelf + again on Add. Feels broad and unorganized even when the scrapbook/cork chrome is cute.
5. **Looks carry more personality than IA.** Scrapbook + corkboard metaphors are locked and good; without shelf buckets they can’t save the “random junk pile” feeling Stefanie called out.

What *not* to blame: lean nav, one Add screen, cartoon chrome + real photos, default Note — those stay.

---

## 3. Proposed tighter IA (docs proposal only)

Keep **Scrapbook** + **Corkboard** Looks, same data, same Stick it in / Pin it.

### A. Group the 21 kinds into 6 shelf buckets (chips browse by bucket)

| Bucket | Kinds | Browse label (scrapbook / cork) |
|--------|-------|----------------------------------|
| **Scraps** | note, idea, list, quote | Scraps / Notes |
| **People** | person, pet | People / Faces |
| **Out & about** | place, trip, ticket, event, moment | Out & about / Pins on the map |
| **Everyday** | thing, food, recipe, work, money, health, song | Everyday / Desk pile |
| **Proud** | win, lesson | Proud / Gold pins |
| **Dreams** | dream | Dreams / Soft pins |

Optional collapse: merge Dreams → Proud (5 buckets). Calendar-worthy kinds stay `event, moment, trip, health` under the hood.

Add flow: show **bucket first** (6 chips), then kind stickers inside the bucket — or keep kind chip but group visually. Default still **Note** under Scraps.

### B. Status shelves (FH In season / Proud energy)

Life-stage on entries (local, optional, default Fresh):

| Status | FH cousin | Scrapbook copy | Corkboard copy |
|--------|-----------|----------------|----------------|
| **Fresh** | In season | On the page | Up on the board |
| **Soft pile** | Resting | Soft pile | Quiet corner |
| **Keepsakes** | Proud shelf | Keepsakes ♡ | Proud pins ♡ |
| **Tucked** | Archive | Tucked away | Boxed up |

Shelf Home: wood-sign / washi-lane sections (or cork lanes) for Fresh · Soft pile · Keepsakes; Tucked behind a fold. Filter chips become **bucket** (6) not 21 kinds. Kind remains a sticker on the card + detail.

### C. What stays locked
- Nav: Shelf · Calendar · Look (no Home/Favorites/Me bear tab).
- One Add screen; no separate “what kind?” page.
- Cartoon scrapbook + corkboard Looks; no 3D host resurrection.
- Warm short voice.

### D. Small craft cues from FH refs
- Named shelf plaques (washi strip / wood tag), not only chips.
- Empty rings / ghost index cards per zone (already started on EmptyShelf — extend when filled).
- One clear “Stick / Pin” seal as the potting-bench equivalent.

---

## 4. Suggested next build steps (for George / Build)

1. Add `bucket` (derived from kind) + optional `status` on entries; migrate existing → Fresh.
2. Replace Shelf `FILTERS` chip row with 6 buckets (+ All); keep kind on card sticker.
3. Section Shelf by status (Fresh / Soft pile / Keepsakes); Tucked collapsed.
4. Keep-form: bucket → kind chips (default Scraps / Note).
5. Screenshot Shelf with seeds in both Looks against `fh-refs/` for Stefanie.

