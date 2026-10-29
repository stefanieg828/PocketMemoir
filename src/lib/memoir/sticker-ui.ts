import { create } from "zustand";
import type { StickerMarkId } from "./stickers";

/**
 * Transient place-mode: pick a mark in the tray, then tap the page/cork.
 * Not persisted.
 */
export const useStickerUi = create<{
  armed: StickerMarkId | null;
  arm: (id: StickerMarkId) => void;
  disarm: () => void;
  /** Same chip again → cancel; otherwise arm that mark. */
  toggleArm: (id: StickerMarkId) => void;
}>((set, get) => ({
  armed: null,
  arm: (id) => set({ armed: id }),
  disarm: () => set({ armed: null }),
  toggleArm: (id) => set({ armed: get().armed === id ? null : id }),
}));
