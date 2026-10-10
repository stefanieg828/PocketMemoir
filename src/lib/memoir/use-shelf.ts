import { useMemo } from "react";
import {
  categoryForEntry,
  countByCategory,
  resolveShelf,
  type ResolvedCategory,
} from "./categories";
import { useIsPeeking, usePeekSession } from "./peek-session";
import { useMemoir } from "./store";
import type { MemoirEntry } from "./types";

/** Visible shelf categories for the current unlock + config + scraps. */
export function useShelfCategories(): ResolvedCategory[] {
  const peeking = useIsPeeking();
  const unlocked = useMemoir((s) => s.unlocked);
  const categories = useMemoir((s) => s.categories);
  const mode = useMemoir((s) => s.mode);
  const entries = useMemoir((s) => s.entries);
  const peekCategories = usePeekSession((s) => s.categories);
  const peekMode = usePeekSession((s) => s.mode);
  const peekEntries = usePeekSession((s) => s.entries);

  return useMemo(() => {
    if (peeking) {
      // Show the friend's full shelf (presets / customs) without unlocking the owner.
      const counts = countByCategory(peekEntries);
      return resolveShelf(peekCategories, { unlocked: true, mode: peekMode, counts });
    }
    const counts = countByCategory(entries);
    return resolveShelf(categories, { unlocked, mode, counts });
  }, [peeking, unlocked, categories, mode, entries, peekCategories, peekMode, peekEntries]);
}

/** Group scraps by resolved category id (tucked scraps skipped for board peeks). */
export function groupEntriesByCategory(
  entries: readonly MemoirEntry[],
  shelfIds: readonly string[],
): Record<string, MemoirEntry[]> {
  const map: Record<string, MemoirEntry[]> = {};
  for (const id of shelfIds) map[id] = [];
  for (const entry of entries) {
    if ((entry.status ?? "fresh") === "tucked") continue;
    const id = categoryForEntry(entry);
    if (!map[id]) map[id] = [];
    map[id].push(entry);
  }
  return map;
}
