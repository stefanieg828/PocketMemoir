/**
 * Decorative scrapbook stickers (page / cork overlays).
 * Separate from category "sticker" chips on scraps (`stickerId` on entries).
 */

export type StickerMarkId =
  | "heart"
  | "heart-soft"
  | "star"
  | "spark"
  | "washi-rose"
  | "washi-mint"
  | "smile-wax"
  | "flower"
  | "leaf"
  | "bow"
  | "pin-dot"
  | "cloud"
  | "postage-stamp"
  | "foil-star"
  | "tiny-ticket"
  | "pressed-flower"
  | GulfCoastStickerId
  | CozyFallStickerId
  | HalloweenStickerId
  | BirdsStickerId;

export const GULF_COAST_IDS = [
  "gulf-pelican", "gulf-sand-dollar", "gulf-conch", "gulf-scallop", "gulf-starfish",
  "gulf-umbrella", "gulf-flip-flops", "gulf-sea-oats", "gulf-lighthouse", "gulf-blue-crab",
  "gulf-sea-turtle", "gulf-dolphin", "gulf-sunset", "gulf-sandcastle", "gulf-beach-chair",
  "gulf-shrimp-boil", "gulf-pier", "gulf-sailboat", "gulf-seagull", "gulf-sweet-tea-cooler",
] as const;
export type GulfCoastStickerId = (typeof GULF_COAST_IDS)[number];

export const COZY_FALL_IDS = [
  "fall-swirling-leaves",
  "fall-misty-pumpkin-patch",
  "fall-rainy-window",
  "fall-harvest-moon",
  "fall-geese-south",
  "fall-golden-path",
  "fall-red-barn",
  "fall-foggy-cloud",
  "fall-squirrel",
  "fall-smoky-cabin",
  "fall-leaf-pile-and-rake",
  "fall-scarecrow",
  "fall-crow-on-fence",
  "fall-lantern-porch",
  "fall-owl-at-dusk",
  "fall-dandelion-field",
  "fall-cornfield-sunset",
  "fall-leafy-puddle",
  "fall-sleepy-fox",
  "fall-crescent-moon",
] as const;
export type CozyFallStickerId = (typeof COZY_FALL_IDS)[number];

export const HALLOWEEN_IDS = [
  "hw-jack-o-lantern",
  "hw-spiral-moon-hill",
  "hw-haunted-house",
  "hw-black-cat",
  "hw-candy-corn",
  "hw-gravestone",
  "hw-bat",
  "hw-spooky-tree",
  "hw-cauldron",
  "hw-witch-hat",
  "hw-sheet-ghost",
  "hw-lamppost",
  "hw-spider",
  "hw-potion",
  "hw-candle",
  "hw-witch-boots",
  "hw-crescent-moon",
  "hw-iron-gate",
  "hw-crow-on-fence",
  "hw-skull",
] as const;
export type HalloweenStickerId = (typeof HALLOWEEN_IDS)[number];

export const BIRDS_IDS = [
  "bd-cardinal",
  "bd-blue-jay",
  "bd-robin",
  "bd-bald-eagle",
  "bd-owl",
  "bd-hummingbird",
  "bd-flamingo",
  "bd-puffin",
  "bd-penguin",
  "bd-peacock",
  "bd-parrot",
  "bd-toucan",
  "bd-chickadee",
  "bd-goldfinch",
  "bd-mallard",
  "bd-swan",
  "bd-woodpecker",
  "bd-bluebird",
  "bd-pigeon",
  "bd-ostrich",
] as const;
export type BirdsStickerId = (typeof BIRDS_IDS)[number];

export type StickerMark = {
  id: StickerMarkId;
  name: string;
  /** CSS modifier class suffix, e.g. `heart` → `.deco-sticker-heart` */
  mark: StickerMarkId;
  /** Painted raster art (public path). When set, rendered as an image instead of SVG. */
  src?: string;
};

export type StickerPack = {
  id: string;
  name: string;
  free: boolean;
  /**
   * When the pack drops (omit for always-on). Either a date `YYYY-MM-DD`
   * (= 00:00 UTC that day) or a full ISO instant with zone, e.g.
   * `2026-10-26T13:00:00Z`. Compared as an absolute instant, so it flips at the
   * same moment for every timezone. Before it, the pack is hidden from the tray
   * and can't be placed.
   */
  dropDate?: string;
  stickers: readonly StickerMark[];
};

/** A sticker stuck on the current album page / cork wall. */
export type PlacedSticker = {
  /** Instance id */
  id: string;
  stickerId: StickerMarkId;
  /** Percent of overlay width / height (0–100). */
  x: number;
  y: number;
  /** Degrees */
  rot: number;
  scale?: number;
  /** User size multiplier from the size slider (0.5–2). Omitted = 1. */
  size?: number;
};

export const STICKER_SIZE_MIN = 0.5;
export const STICKER_SIZE_MAX = 2;

export const FREE_STARTER_PACK: StickerPack = {
  id: "free-starter",
  name: "free starter",
  free: true,
  stickers: [
    { id: "heart", name: "heart", mark: "heart" },
    { id: "heart-soft", name: "soft heart", mark: "heart-soft" },
    { id: "star", name: "star", mark: "star" },
    { id: "spark", name: "spark", mark: "spark" },
    { id: "washi-rose", name: "rose washi", mark: "washi-rose" },
    { id: "washi-mint", name: "mint washi", mark: "washi-mint" },
    { id: "smile-wax", name: "smile wax", mark: "smile-wax" },
    { id: "flower", name: "flower", mark: "flower" },
    { id: "leaf", name: "leaf", mark: "leaf" },
    { id: "bow", name: "bow", mark: "bow" },
    { id: "pin-dot", name: "pin dot", mark: "pin-dot" },
    { id: "cloud", name: "cloud", mark: "cloud" },
    { id: "postage-stamp", name: "postage", mark: "postage-stamp" },
    { id: "foil-star", name: "foil star", mark: "foil-star" },
    { id: "tiny-ticket", name: "ticket", mark: "tiny-ticket" },
    { id: "pressed-flower", name: "pressed bloom", mark: "pressed-flower" },
  ],
};

const GULF_NAMES: Record<GulfCoastStickerId, string> = {
  "gulf-pelican": "pelican", "gulf-sand-dollar": "sand dollar", "gulf-conch": "conch",
  "gulf-scallop": "scallop", "gulf-starfish": "starfish", "gulf-umbrella": "umbrella",
  "gulf-flip-flops": "flip-flops", "gulf-sea-oats": "sea oats", "gulf-lighthouse": "lighthouse",
  "gulf-blue-crab": "blue crab", "gulf-sea-turtle": "sea turtle", "gulf-dolphin": "dolphin",
  "gulf-sunset": "sunset", "gulf-sandcastle": "sandcastle", "gulf-beach-chair": "beach chair",
  "gulf-shrimp-boil": "shrimp boil", "gulf-pier": "pier", "gulf-sailboat": "sailboat",
  "gulf-seagull": "seagull", "gulf-sweet-tea-cooler": "sweet tea",
};

export const GULF_COAST_PACK: StickerPack = {
  id: "gulf-coast",
  name: "gulf coast beach",
  free: false,
  dropDate: "2026-10-12",
  stickers: GULF_COAST_IDS.map((id) => ({
    id,
    name: GULF_NAMES[id],
    mark: id,
    src: `/stickers/gulf-coast/${id.slice(5)}.webp`,
  })),
};

export const COZY_FALL_PACK: StickerPack = {
  id: "cozy-fall",
  name: "cozy fall",
  free: false,
  dropDate: "2026-10-21",
  stickers: COZY_FALL_IDS.map((id) => ({
    id,
    name: id.slice(5).replace(/-/g, " "),
    mark: id,
    src: `/stickers/cozy-fall/${id.slice(5)}.webp`,
  })),
};

const HW_NAMES: Partial<Record<HalloweenStickerId, string>> = { "hw-jack-o-lantern": "jack-o-lantern" };

export const HALLOWEEN_PACK: StickerPack = {
  id: "halloween",
  name: "halloween",
  free: false,
  // Mon Oct 26 2026, 8:00 AM America/Chicago (CDT, UTC-5).
  dropDate: "2026-10-26T13:00:00Z",
  stickers: HALLOWEEN_IDS.map((id) => ({
    id,
    name: HW_NAMES[id] ?? id.slice(3).replace(/-/g, " "),
    mark: id,
    src: `/stickers/halloween/${id.slice(3)}.webp`,
  })),
};

export const BIRDS_PACK: StickerPack = {
  id: "birds",
  name: "birds",
  free: false,
  // Mon Nov 2 2026, 8:00 AM America/Chicago (CST, UTC-6; DST ends Nov 1).
  dropDate: "2026-11-02T14:00:00Z",
  stickers: BIRDS_IDS.map((id) => ({
    id,
    name: id.slice(3).replace(/-/g, " "),
    mark: id,
    src: `/stickers/birds/${id.slice(3)}.webp`,
  })),
};

/** Epoch ms when a pack drops, or null if it has no (valid) drop date. */
export function packDropTime(pack: Pick<StickerPack, "dropDate">): number | null {
  if (!pack.dropDate) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(pack.dropDate) ? `${pack.dropDate}T00:00:00Z` : pack.dropDate;
  // Require an explicit zone so a local-time string can't flip early in some timezone.
  if (iso.length > 10 && !/(Z|[+-]\d{2}:\d{2})$/.test(iso)) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export function isPackReleased(pack: Pick<StickerPack, "dropDate">, now: number = Date.now()): boolean {
  const t = packDropTime(pack);
  return t === null || now >= t;
}

/** Packs the tray should show right now. */
export function releasedStickerPacks(now: number = Date.now()): StickerPack[] {
  return STICKER_PACKS.filter((p) => isPackReleased(p, now));
}

/** Newest drop last; tray shows them as tabs. */
export const STICKER_PACKS: readonly StickerPack[] = [
  FREE_STARTER_PACK,
  GULF_COAST_PACK,
  COZY_FALL_PACK,
  HALLOWEEN_PACK,
  BIRDS_PACK,
];

const STICKER_INDEX = new Map<string, { sticker: StickerMark; pack: StickerPack }>(
  STICKER_PACKS.flatMap((pack) => pack.stickers.map((sticker) => [sticker.id, { sticker, pack }] as const)),
);

export function packForSticker(id: string): StickerPack | undefined {
  return STICKER_INDEX.get(id)?.pack;
}

export const PAGE_STICKER_CAP = 24;

export function isStickerMarkId(value: unknown): value is StickerMarkId {
  return typeof value === "string" && STICKER_INDEX.has(value);
}

export function stickerById(id: string): StickerMark | undefined {
  return STICKER_INDEX.get(id)?.sticker;
}

export function clampStickerCoord(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizePlacedSticker(raw: unknown): PlacedSticker | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<PlacedSticker>;
  if (typeof row.id !== "string" || !row.id.trim()) return null;
  if (!isStickerMarkId(row.stickerId)) return null;
  const x =
    typeof row.x === "number" && Number.isFinite(row.x) ? clampStickerCoord(row.x, 4, 96) : 50;
  const y =
    typeof row.y === "number" && Number.isFinite(row.y) ? clampStickerCoord(row.y, 6, 94) : 50;
  const rot =
    typeof row.rot === "number" && Number.isFinite(row.rot) ? clampStickerCoord(row.rot, -24, 24) : 0;
  const scale =
    typeof row.scale === "number" && Number.isFinite(row.scale)
      ? clampStickerCoord(row.scale, 0.7, 1.4)
      : undefined;
  const size =
    typeof row.size === "number" && Number.isFinite(row.size) && row.size !== 1
      ? clampStickerCoord(row.size, STICKER_SIZE_MIN, STICKER_SIZE_MAX)
      : undefined;
  return { id: row.id.trim(), stickerId: row.stickerId, x, y, rot, scale, ...(size ? { size } : {}) };
}

/** Normalize a list from backup / peek / storage. */
export function normalizePageStickers(raw: unknown): PlacedSticker[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizePlacedSticker)
    .filter((s): s is PlacedSticker => Boolean(s))
    .slice(0, PAGE_STICKER_CAP);
}

/** Scatter a new placement so taps don’t stack in one spot. */
export function scatterPlacement(seed = Date.now()): Pick<PlacedSticker, "x" | "y" | "rot" | "scale"> {
  const n = seed >>> 0;
  const x = 12 + ((n * 17) % 76);
  const y = 14 + ((n * 31) % 70);
  const rot = ((n % 21) - 10) * 1.1;
  const scale = 0.85 + ((n % 7) * 0.05);
  return { x, y, rot, scale };
}

/**
 * Place at an exact percent point; keep a light random tilt/scale from seed
 * so first-place still feels handmade.
 */
export function placementAt(
  x: number,
  y: number,
  seed = Date.now(),
): Pick<PlacedSticker, "x" | "y" | "rot" | "scale"> {
  const n = seed >>> 0;
  const rot = ((n % 21) - 10) * 1.1;
  const scale = 0.85 + ((n % 7) * 0.05);
  return {
    x: clampStickerCoord(x, 4, 96),
    y: clampStickerCoord(y, 6, 94),
    rot,
    scale,
  };
}
