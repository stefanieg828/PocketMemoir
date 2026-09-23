import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlbumPage } from "@/components/album-page";
import { EmptyShelf } from "@/components/empty-shelf";
import { FilterTabs, type FilterId } from "@/components/filter-tabs";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { SearchSlip } from "@/components/search-slip";
import { ShelfZone } from "@/components/shelf-zone";
import { SHELF_VISIBLE_STATUSES, statusLabel } from "@/lib/memoir/copy";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
import {
  bucketForKind,
  type EntryStatus,
  type MemoirEntry,
} from "@/lib/memoir/types";
import { paperForShelf } from "@/lib/scrapbook-paper";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const entries = useMemoir((s) => s.entries);
  const jacket = useMemoir((s) => s.jacket);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [tuckedOpen, setTuckedOpen] = useState(false);

  const visible = useMemo(() => {
    return entries.filter((entry) => {
      if (filter !== "all" && bucketForKind(entry.kind) !== filter) return false;
      return matchesQuery(entry, query);
    });
  }, [entries, filter, query]);

  const byStatus = useMemo(() => {
    const groups: Record<EntryStatus, MemoirEntry[]> = {
      fresh: [],
      soft: [],
      keepsake: [],
      tucked: [],
    };
    for (const entry of visible) {
      groups[entry.status ?? "fresh"].push(entry);
    }
    return groups;
  }, [visible]);

  if (entries.length === 0) {
    return <EmptyShelf />;
  }

  const tools = (
    <>
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
    </>
  );

  function renderGrid(list: MemoirEntry[]) {
    return (
      <ul className={jacket === "scrapbook" ? "album-scraps" : "shelf-grid"}>
        {list.map((entry, index) => (
          <li
            key={entry.id}
            className={cn(
              scrapIsWide(entry) && jacket !== "scrapbook" && "sm:col-span-2",
              jacket === "scrapbook" &&
                `album-scrap album-scrap-${(index % 6) + 1}`,
            )}
          >
            <Polaroid entry={entry} />
          </li>
        ))}
      </ul>
    );
  }

  const hasVisible =
    SHELF_VISIBLE_STATUSES.some((status) => byStatus[status].length > 0) ||
    byStatus.tucked.length > 0;

  const zones = !hasVisible ? (
    <p className="py-12 text-center font-display text-xl">Nothing matches.</p>
  ) : (
    <div className="shelf-bays flex flex-col gap-7">
      {SHELF_VISIBLE_STATUSES.map((status) => (
        <ShelfZone
          key={status}
          status={status}
          jacket={jacket}
          count={byStatus[status].length}
        >
          {renderGrid(byStatus[status])}
        </ShelfZone>
      ))}

      {byStatus.tucked.length > 0 ? (
        <section className="shelf-zone shelf-zone-tucked" aria-label={statusLabel("tucked", jacket)}>
          <button
            type="button"
            className={cn(
              "shelf-fold",
              jacket === "corkboard" && "shelf-fold-wood",
              tuckedOpen && "is-open",
            )}
            aria-expanded={tuckedOpen}
            onClick={() => setTuckedOpen((v) => !v)}
          >
            <span className="shelf-plaque-text">{statusLabel("tucked", jacket)}</span>
            <span className="shelf-fold-meta">
              {byStatus.tucked.length}
              <span aria-hidden="true">{tuckedOpen ? " · open" : " · folded"}</span>
            </span>
          </button>
          {tuckedOpen ? renderGrid(byStatus.tucked) : null}
        </section>
      ) : null}
    </div>
  );

  if (jacket === "scrapbook") {
    const paper = paperForShelf(visible.map((entry) => entry.id));
    return (
      <section className="mx-auto max-w-3xl">
        <div className="mb-4">{tools}</div>
        <AlbumPage paper={paper}>{zones}</AlbumPage>
      </section>
    );
  }

  return (
    <section>
      {tools}
      <div className="mt-6">{zones}</div>
    </section>
  );
}
