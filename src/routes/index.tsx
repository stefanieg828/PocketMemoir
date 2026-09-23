import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmptyShelf } from "@/components/empty-shelf";
import { FilterTabs, type FilterId } from "@/components/filter-tabs";
import { FlipAlbum } from "@/components/flip-album";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { SearchSlip } from "@/components/search-slip";
import { ShelfZone } from "@/components/shelf-zone";
import { SHELF_VISIBLE_STATUSES, statusLabel } from "@/lib/memoir/copy";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
import {
  ENTRY_BUCKETS,
  bucketForKind,
  type EntryBucket,
  type EntryStatus,
  type MemoirEntry,
} from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

function isBucket(value: unknown): value is EntryBucket {
  return typeof value === "string" && (ENTRY_BUCKETS as readonly string[]).includes(value);
}

function validateSearch(search: Record<string, unknown>): {
  spread?: EntryBucket;
  flipIn?: boolean;
} {
  const spread = isBucket(search.spread) ? search.spread : undefined;
  const raw = search.flipIn;
  const flipIn = raw === true || raw === 1 || raw === "1" || raw === "true";
  return {
    spread,
    flipIn: flipIn ? true : undefined,
  };
}

export const Route = createFileRoute("/")({
  validateSearch,
  component: Home,
});

function Home() {
  const { spread, flipIn } = Route.useSearch();
  const navigate = useNavigate();
  const entries = useMemoir((s) => s.entries);
  const jacket = useMemoir((s) => s.jacket);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [tuckedOpen, setTuckedOpen] = useState(false);

  const visible = useMemo(() => {
    return entries.filter((entry) => matchesQuery(entry, query));
  }, [entries, query]);

  const corkVisible = useMemo(() => {
    return visible.filter((entry) => {
      if (filter !== "all" && bucketForKind(entry.kind) !== filter) return false;
      return true;
    });
  }, [visible, filter]);

  const byStatus = useMemo(() => {
    const groups: Record<EntryStatus, MemoirEntry[]> = {
      fresh: [],
      soft: [],
      keepsake: [],
      tucked: [],
    };
    for (const entry of corkVisible) {
      groups[entry.status ?? "fresh"].push(entry);
    }
    return groups;
  }, [corkVisible]);

  const onBucketChange = useCallback(
    (bucket: EntryBucket) => {
      void navigate({
        to: "/",
        search: { spread: bucket },
        replace: true,
      });
    },
    [navigate],
  );

  // Drop flipIn from the URL after the open-from-cover animation plays once.
  useEffect(() => {
    if (!flipIn) return;
    const t = window.setTimeout(() => {
      void navigate({
        to: "/",
        search: spread ? { spread } : {},
        replace: true,
      });
    }, 780);
    return () => window.clearTimeout(t);
  }, [flipIn, spread, navigate]);

  if (entries.length === 0) {
    return <EmptyShelf />;
  }

  const searchTools = (
    <div className="flex items-end justify-between gap-3">
      {jacket === "corkboard" ? (
        <div className="min-w-0 flex-1">
          <FilterTabs value={filter} onChange={setFilter} />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          {isStarterShelf(entries) ? (
            <p className="text-sm text-muted">
              Starter scraps so the book isn’t shy. Flip the spreads — or search.
            </p>
          ) : (
            <p className="text-sm text-muted">Flip the spreads. Six buckets, one book.</p>
          )}
        </div>
      )}
      <SearchSlip
        value={query}
        onChange={setQuery}
        open={searchOpen || Boolean(query)}
        onOpenChange={setSearchOpen}
      />
    </div>
  );

  if (jacket === "scrapbook") {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="mb-4">{searchTools}</div>
        <FlipAlbum
          entries={visible}
          initialBucket={spread}
          flipIn={Boolean(flipIn)}
          onBucketChange={onBucketChange}
        />
      </section>
    );
  }

  function renderGrid(list: MemoirEntry[]) {
    return (
      <ul className="shelf-grid">
        {list.map((entry) => (
          <li key={entry.id} className={cn(scrapIsWide(entry) && "sm:col-span-2")}>
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
            className={cn("shelf-fold", "shelf-fold-wood", tuckedOpen && "is-open")}
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

  return (
    <section>
      {isStarterShelf(entries) ? (
        <p className="mb-4 text-sm text-muted">
          Starter scraps, so the board isn’t shy. Let them go when you want it to yourself.
        </p>
      ) : null}
      {searchTools}
      <div className="mt-6">{zones}</div>
    </section>
  );
}
