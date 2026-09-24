import { create } from "zustand";

/** Open state for the "Make it yours" sheet, so the footer / nudge can open it at a section. */
export const usePickerUi = create<{
  open: boolean;
  focus: "backup" | null;
  setOpen: (open: boolean) => void;
  openAt: (focus: "backup" | null) => void;
}>((set) => ({
  open: false,
  focus: null,
  setOpen: (open) => set(open ? { open } : { open, focus: null }),
  openAt: (focus) => set({ open: true, focus }),
}));
