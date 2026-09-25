import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CorkWall } from "@/components/cork-wall";
import { EmptyShelf } from "@/components/empty-shelf";
import { FlipAlbum } from "@/components/flip-album";
import { SearchSlip } from "@/components/search-slip";
import { isStarterShelf, matchesQuery, useMemoir } from "@/lib/memoir/store";
function validateSearch(search: Record<string, unknown>): {
  spread?: string;
  flipIn?: boolean;
} {
  const spread = typeof search.spread === "string" && search.spread.trim() ? search.spread.trim() : undefined;
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
  const jacket = useMemoir((s) => s.mode);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(() => {
    return entries.filter((entry) => matchesQuery(entry, query));
  }, [entries, query]);

  const onBucketChange = useCallback(
    (bucket: string) => {
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
            <p className="shelf-lede text-sm text-muted">
              A few sample scraps are already pinned so you can peek around. Stick your own in whenever you’re ready — or search.
            </p>
          ) : (
            <p className="shelf-lede text-sm text-muted">Boards on the wall. Same sticky-note shelf as the book.</p>
          )
        ) : isStarterShelf(entries) ? (
          <p className="shelf-lede text-sm text-muted">
            A few sample scraps are already stuck in so you can flip around. Stick your own in whenever you’re ready — or search.
          </p>
        ) : (
          <p className="shelf-lede text-sm text-muted">Flip the spreads. Your shelf, one book.</p>
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
