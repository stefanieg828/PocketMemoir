import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyShelf } from "@/components/empty-shelf";
import { FilterTabs } from "@/components/filter-tabs";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { SearchSlip } from "@/components/search-slip";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
import type { EntryKind } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const entries = useMemoir((s) => s.entries);
  const [filter, setFilter] = useState<"all" | EntryKind>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(() => {
    return entries.filter((entry) => {
      if (filter !== "all" && entry.kind !== filter) return false;
      return matchesQuery(entry, query);
    });
  }, [entries, filter, query]);

  if (entries.length === 0) {
    return <EmptyShelf />;
  }

  return (
    <section>
      {isStarterShelf(entries) ? (
        <p className="mb-4 text-sm text-muted">
          Starter scraps, so the page isn’t shy. Let them go when you want it to yourself.
        </p>
      ) : null}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <FilterTabs value={filter} onChange={setFilter} />
        </div>
        <SearchSlip
          value={query}
          onChange={setQuery}
          open={searchOpen || Boolean(query)}
          onOpenChange={setSearchOpen}
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center font-display text-xl">Nothing matches.</p>
      ) : (
        <ul className="shelf-grid">
          {visible.map((entry) => (
            <li key={entry.id} className={cn(scrapIsWide(entry) && "sm:col-span-2")}>
              <Polaroid entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
