/**
 * Display selectors that overlay an active peek session on top of the owner's
 * store — without mutating pocketmemoir.v1.
 */
import { useIsPeeking, usePeekSession } from "./peek-session";
import { useMemoir } from "./store";
import type { CategoryConfig } from "./categories";
import type { LookId, MemoirEntry, ModeId, RisoPrefs } from "./types";

export function useViewMode(): ModeId {
  const peeking = useIsPeeking();
  const own = useMemoir((s) => s.mode);
  const peek = usePeekSession((s) => s.mode);
  return peeking ? peek : own;
}

export function useViewLook(): LookId {
  const peeking = useIsPeeking();
  const own = useMemoir((s) => s.look);
  const peek = usePeekSession((s) => s.look);
  return peeking ? peek : own;
}

export function useViewRiso(): RisoPrefs {
  const peeking = useIsPeeking();
  const own = useMemoir((s) => s.riso);
  const peek = usePeekSession((s) => s.riso);
  return peeking ? peek : own;
}

export function useViewCategories(): CategoryConfig {
  const peeking = useIsPeeking();
  const own = useMemoir((s) => s.categories);
  const peek = usePeekSession((s) => s.categories);
  return peeking ? peek : own;
}

export function useViewEntries(): MemoirEntry[] {
  const peeking = useIsPeeking();
  const own = useMemoir((s) => s.entries);
  const peek = usePeekSession((s) => s.entries);
  return peeking ? peek : own;
}
