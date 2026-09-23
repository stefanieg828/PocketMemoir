import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FilterTabs } from "@/components/filter-tabs";
import { KeepSeal } from "@/components/keep-seal";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { SearchSlip } from "@/components/search-slip";
import { LOOK_META } from "@/lib/memoir/jackets";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
import type { EntryKind } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const entries = useMemoir((s) => s.entries);
  const jacket = useMemoir((s) => s.jacket);
  const look = LOOK_META[jacket];
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
    return (
      <section className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
        <h1 className="font-display text-title font-semibold">{look.emptyTitle}</h1>
        <p className="mt-2 text-muted">{look.emptyBody}</p>
        <div className="mt-8">
          <KeepSeal toKeep size="lg" />
        </div>
      </section>
    );
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
        <ul className="mt-8 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 sm:gap-6">
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
