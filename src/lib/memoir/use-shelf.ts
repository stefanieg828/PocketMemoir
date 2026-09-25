import { useMemo } from "react";
import {
  categoryForEntry,
  countByCategory,
  resolveShelf,
  type ResolvedCategory,
} from "./categories";
import { useMemoir } from "./store";
import type { MemoirEntry } from "./types";

/** Visible shelf categories for the current unlock + config + scraps. */
export function useShelfCategories(): ResolvedCategory[] {
  const unlocked = useMemoir((s) => s.unlocked);
  const categories = useMemoir((s) => s.categories);
  const mode = useMemoir((s) => s.mode);
  const entries = useMemoir((s) => s.entries);

  return useMemo(() => {
    const counts = countByCategory(entries);
    return resolveShelf(categories, { unlocked, mode, counts });
  }, [unlocked, categories, mode, entries]);
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
