import { FILTERS } from "@/lib/memoir/copy";
import type { EntryBucket } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

export type FilterId = "all" | EntryBucket;

export function FilterTabs({
  value,
  onChange,
}: {
  value: FilterId;
  onChange: (next: FilterId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter the shelf by bucket"
      className="filter-row flex gap-2 overflow-x-auto pb-1"
    >
      {FILTERS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn("kind-chip shrink-0", active && "bg-gold")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
