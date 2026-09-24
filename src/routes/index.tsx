import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CorkWall } from "@/components/cork-wall";
import { EmptyShelf } from "@/components/empty-shelf";
import { FlipAlbum } from "@/components/flip-album";
import { SearchSlip } from "@/components/search-slip";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
import {
  ENTRY_BUCKETS,
  type EntryBucket,
} from "@/lib/memoir/types";

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
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(() => {
    return entries.filter((entry) => matchesQuery(entry, query));
  }, [entries, query]);

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

  const onBackToWall = useCallback(() => {
    void navigate({
      to: "/",
      search: {},
      replace: true,
    });
  }, [navigate]);

  // Drop flipIn from the URL after the open-from-cover / zoom-in animation plays once.
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
      <div className="min-w-0 flex-1">
        {jacket === "corkboard" ? (
          isStarterShelf(entries) ? (
            <p className="text-sm text-muted">
              Starter scraps on soft cork. Tap a board to zoom — or search.
            </p>
          ) : (
            <p className="text-sm text-muted">Six boards on the wall. Same buckets as the book.</p>
          )
        ) : isStarterShelf(entries) ? (
          <p className="text-sm text-muted">
            Starter scraps so the book isn’t shy. Flip the spreads — or search.
          </p>
        ) : (
          <p className="text-sm text-muted">Flip the spreads. Six buckets, one book.</p>
        )}
      </div>
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

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-4">{searchTools}</div>
      <CorkWall
        entries={visible}
        activeBucket={spread}
        zoomIn={Boolean(flipIn)}
        onBucketChange={onBucketChange}
        onBackToWall={onBackToWall}
      />
    </section>
  );
}
