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
  | "pressed-flower";

export type StickerMark = {
  id: StickerMarkId;
  name: string;
  /** CSS modifier class suffix, e.g. `heart` → `.deco-sticker-heart` */
  mark: StickerMarkId;
};

export type StickerPack = {
  id: string;
  name: string;
  free: boolean;
  /** ISO date when the pack drops (omit for always-on free). */
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
};

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

export const STICKER_PACKS: readonly StickerPack[] = [FREE_STARTER_PACK];

export const PAGE_STICKER_CAP = 24;

const MARK_SET = new Set<string>(FREE_STARTER_PACK.stickers.map((s) => s.id));

export function isStickerMarkId(value: unknown): value is StickerMarkId {
  return typeof value === "string" && MARK_SET.has(value);
}

export function stickerById(id: string): StickerMark | undefined {
  return FREE_STARTER_PACK.stickers.find((s) => s.id === id);
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
  return { id: row.id.trim(), stickerId: row.stickerId, x, y, rot, scale };
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
