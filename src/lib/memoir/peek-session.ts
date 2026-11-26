/**
 * In-memory peek session. Never persisted — friend's scraps stay in RAM only.
 * Opening a peek does NOT call applyRestore, does NOT set unlocked, does NOT
 * overwrite pocketmemoir.v1.
 */
import { create } from "zustand";
import type { CategoryConfig } from "./categories";
import { DEFAULT_CATEGORY_CONFIG } from "./categories";
import { DEFAULT_RISO } from "./looks";
import type { ParsedPeek } from "./peek";
import type { PlacedSticker } from "./stickers";
import type { LookId, MemoirEntry, ModeId, RisoPrefs } from "./types";

export type PeekSessionState = {
  active: boolean;
  createdAt: string | null;
  mode: ModeId;
  look: LookId;
  riso: RisoPrefs;
  categories: CategoryConfig;
  entries: MemoirEntry[];
  /** Decorative stickers from the peek file (read-only). */
  pageStickers: PlacedSticker[];
  /** Start a peek from a successfully parsed file. */
  startPeek: (parsed: Extract<ParsedPeek, { ok: true }>) => void;
  /** Clear session and return to the owner's album. */
  endPeek: () => void;
};

const emptyCategories = (): CategoryConfig => ({
  ...DEFAULT_CATEGORY_CONFIG,
  order: [...DEFAULT_CATEGORY_CONFIG.order],
  names: {},
  customs: [],
});

export const usePeekSession = create<PeekSessionState>((set) => ({
  active: false,
  createdAt: null,
  mode: "scrapbook",
  look: "storybook",
  riso: { ...DEFAULT_RISO },
  categories: emptyCategories(),
  entries: [],
  pageStickers: [],
  startPeek: (parsed) =>
    set({
      active: true,
      createdAt: parsed.createdAt ? parsed.createdAt.toISOString() : null,
      mode: parsed.mode,
      look: parsed.look,
      riso: { ...parsed.riso },
      categories: parsed.categories,
      entries: parsed.entries.map((e) => ({ ...e })),
      pageStickers: (parsed.pageStickers ?? []).map((s) => ({ ...s })),
    }),
  endPeek: () =>
    set({
      active: false,
      createdAt: null,
      mode: "scrapbook",
      look: "storybook",
      riso: { ...DEFAULT_RISO },
      categories: emptyCategories(),
      entries: [],
      pageStickers: [],
    }),
}));

export function useIsPeeking() {
  return usePeekSession((s) => s.active);
}
