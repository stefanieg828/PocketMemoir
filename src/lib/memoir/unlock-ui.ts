import { create } from "zustand";

/** Open state for the soft unlock / paywall sheet. */
export const useUnlockUi = create<{
  open: boolean;
  /** Open straight to the "restore with your email" form. */
  restore: boolean;
  setOpen: (open: boolean) => void;
  openRestore: () => void;
}>((set) => ({
  open: false,
  restore: false,
  setOpen: (open) => set(open ? { open } : { open, restore: false }),
  openRestore: () => set({ open: true, restore: true }),
}));
