import { useMemo } from "react";
import { entryMatchesChip, hasSubcategories, kindsForBucket } from "@/lib/memoir/categories";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useMemoir } from "@/lib/memoir/store";
import { useViewCategories } from "@/lib/memoir/use-view";
import type { MemoirEntry } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

/**
 * big scraps: subcategory filter row on an open spread / zoomed board
 * ("all · outside to-dos · inside to-dos"). Only shows once a board has at
 * least one custom subcategory. Peeks show the sender's subcategories read-only.
 */
export function useSubFilter(bucket: string, entries: MemoirEntry[], value: string) {
  const peeking = useIsPeeking();
  const ownUnlocked = useMemoir((s) => s.unlocked);
  const config = useViewCategories();
  const unlocked = peeking || ownUnlocked;
  const chips = useMemo(() => {
    if (!unlocked || !hasSubcategories(config, bucket)) return [];
    // Only chips that actually hold something, plus every custom one (so new
    // subcategories show up right away).
    return kindsForBucket(config, bucket, true).filter(
      (c) => c.custom || entries.some((e) => entryMatchesChip(e, c.id)),
    );
  }, [config, bucket, unlocked, entries]);
  const active = chips.some((c) => c.id === value) ? value : "all";
  const filtered = useMemo(
    () => (active === "all" ? entries : entries.filter((e) => entryMatchesChip(e, active))),
    [entries, active],
  );
  return { chips, active, filtered };
}

export function SubFilter({
  chips,
  active,
  entries,
  onPick,
  className,
}: {
  chips: { id: string; label: string }[];
  active: string;
  entries: MemoirEntry[];
  onPick: (id: string) => void;
  className?: string;
}) {
  if (chips.length === 0) return null;
  const rows = [{ id: "all", label: "all" }, ...chips];
  return (
    <div role="radiogroup" aria-label="Subcategory" className={cn("sub-filter", className)}>
      {rows.map((c) => {
        const on = c.id === active;
        const n = c.id === "all" ? entries.length : entries.filter((e) => entryMatchesChip(e, c.id)).length;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={cn("kind-chip kind-chip-soft sub-filter-chip", on && "bg-gold")}
            onClick={() => onPick(c.id)}
          >
            {c.label}
            <span className="sub-filter-n">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
