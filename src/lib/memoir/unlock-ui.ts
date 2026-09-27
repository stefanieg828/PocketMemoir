import { create } from "zustand";

/** Open state for the soft unlock / paywall sheet. */
export const useUnlockUi = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
