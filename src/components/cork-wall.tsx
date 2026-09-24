import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { BUCKET_META, bucketLabel, statusLabel } from "@/lib/memoir/copy";
import {
  ENTRY_BUCKETS,
  bucketForKind,
  type EntryBucket,
  type MemoirEntry,
} from "@/lib/memoir/types";
import { cn, hashSeed } from "@/lib/utils";

const BOARD_TONES = ["peach", "sage", "duck", "cream", "peach", "sage"] as const;
const PIN_TONES = ["soft-pin-teal", "soft-pin-rose", "soft-pin-tan", "soft-pin-sage"] as const;
const PEEK_MAX = 3;
const ZOOM_MS = 480;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type CorkWallProps = {
  entries: MemoirEntry[];
  /** Open this board (from URL `spread`). Undefined = wall overview. */
  activeBucket?: EntryBucket;
  /** Animate zoom-in after pin/add. */
  zoomIn?: boolean;
  onBucketChange?: (bucket: EntryBucket) => void;
  onBackToWall?: () => void;
  className?: string;
};

export function CorkWall({
  entries,
  activeBucket,
  zoomIn = false,
  onBucketChange,
  onBackToWall,
  className,
}: CorkWallProps) {
  const [anim, setAnim] = useState<"idle" | "zoom-in" | "zoom-out">(
    zoomIn && activeBucket ? "zoom-in" : "idle",
  );
  const [tuckedOpen, setTuckedOpen] = useState(false);

  useEffect(() => {
    if (!zoomIn || !activeBucket) return;
    setAnim("zoom-in");
    const ms = prefersReducedMotion() ? 0 : ZOOM_MS;
    const t = window.setTimeout(() => setAnim("idle"), ms || 16);
    return () => window.clearTimeout(t);
  }, [zoomIn, activeBucket]);

  const byBucket = useMemo(() => {
    const map: Record<EntryBucket, MemoirEntry[]> = {
      scraps: [],
      people: [],
      out: [],
      everyday: [],
      proud: [],
      dreams: [],
    };
    const tucked: MemoirEntry[] = [];
    for (const entry of entries) {
      if ((entry.status ?? "fresh") === "tucked") {
        tucked.push(entry);
        continue;
      }
      map[bucketForKind(entry.kind)].push(entry);
    }
    return { map, tucked };
  }, [entries]);

  const zoomed = Boolean(activeBucket);
  const boardEntries = activeBucket ? byBucket.map[activeBucket] : [];

  function openBoard(bucket: EntryBucket) {
    if (prefersReducedMotion()) {
      onBucketChange?.(bucket);
      return;
    }
    setAnim("zoom-in");
    onBucketChange?.(bucket);
  }

  function backToWall() {
    if (prefersReducedMotion()) {
      onBackToWall?.();
      return;
    }
    setAnim("zoom-out");
    window.setTimeout(() => {
      onBackToWall?.();
      setAnim("idle");
    }, ZOOM_MS * 0.55);
  }

  return (
    <section
      className={cn("cork-wall", zoomed && "is-zoomed", `is-${anim}`, className)}
      aria-label="Corkboard wall"
    >
      {!zoomed ? (
        <>
          <header className="cork-wall-intro">
            <p className="cork-wall-kicker font-display">Soft Storybook</p>
            <h1 className="cork-wall-title font-display">Wall of boards</h1>
            <p className="cork-wall-sub">
              Six gentle boards — same buckets as the scrapbook. Tap one to zoom in.
            </p>
          </header>

          <ul className="cork-wall-grid" role="list">
            {ENTRY_BUCKETS.map((bucket, i) => {
              const list = byBucket.map[bucket];
              const tone = BOARD_TONES[i] ?? "cream";
              const pin = PIN_TONES[i % PIN_TONES.length]!;
              const tilt = ((hashSeed(bucket) % 9) - 4) * 0.55;
              const peeks = list.slice(0, PEEK_MAX);
              const label = BUCKET_META[bucket].corkboard;

              return (
                <li key={bucket} className="cork-wall-cell">
                  <button
                    type="button"
                    className={cn("cork-mini-board", `tone-${tone}`)}
                    style={{ ["--board-tilt" as string]: `${tilt}deg` }}
                    aria-label={`${label}${list.length ? `, ${list.length} pinned` : ", empty board"}`}
                    onClick={() => openBoard(bucket)}
                  >
                    <span className={cn("soft-pin", pin)} aria-hidden="true" />
                    <span className="cork-mini-label-scrap" aria-hidden="true">
                      <span className="cork-mini-label">{label}</span>
                    </span>
                    {peeks.length === 0 ? (
                      <span className="cork-mini-empty font-display">soft cork</span>
                    ) : (
                      <ul className="cork-mini-peeks" aria-hidden="true">
                        {peeks.map((entry, pi) => (
                          <li
                            key={entry.id}
                            className={cn("cork-peek", `cork-peek-${(pi % 3) + 1}`)}
                          >
                            <span className="cork-peek-pin" />
                            <span className="cork-peek-title">{entry.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {list.length > PEEK_MAX ? (
                      <span className="cork-mini-more">+{list.length - PEEK_MAX}</span>
                    ) : list.length > 0 ? (
                      <span className="cork-mini-count">{list.length}</span>
                    ) : null}
                    <span className="cork-mini-washi" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="cork-zoom" data-bucket={activeBucket}>
          <div className="cork-zoom-toolbar">
            <button type="button" className="cork-back-btn" onClick={backToWall}>
              <ChevronLeft className="size-5" strokeWidth={2.5} />
              <span>Back to wall</span>
            </button>
            <p className="cork-zoom-title font-display" aria-live="polite">
              {activeBucket ? bucketLabel(activeBucket, "corkboard") : ""}
            </p>
            <span className="cork-zoom-meta font-display">
              {boardEntries.length
                ? `${boardEntries.length} pinned`
                : "empty board"}
            </span>
          </div>

          <div className="cork-zoom-board">
            <span
              className={cn(
                "soft-pin",
                PIN_TONES[ENTRY_BUCKETS.indexOf(activeBucket!) % PIN_TONES.length],
              )}
              aria-hidden="true"
            />
            <span className="cork-zoom-plaque font-display" aria-hidden="true">
              {activeBucket ? BUCKET_META[activeBucket].corkboard : ""}
            </span>

            {boardEntries.length === 0 ? (
              <div className="cork-zoom-empty">
                <span className="cork-zoom-empty-ghost" aria-hidden="true" />
                <p className="font-display text-xl">Nothing pinned here yet.</p>
                <p className="mt-1 text-sm text-muted">Soft cork, waiting for a scrap.</p>
              </div>
            ) : (
              <ul className="cork-zoom-grid">
                {boardEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(scrapIsWide(entry) && "sm:col-span-2")}
                  >
                    <Polaroid entry={entry} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {byBucket.tucked.length > 0 ? (
        <section
          className="shelf-zone shelf-zone-tucked mt-5"
          aria-label={statusLabel("tucked", "corkboard")}
        >
          <button
            type="button"
            className={cn("shelf-fold", "shelf-fold-wood", tuckedOpen && "is-open")}
            aria-expanded={tuckedOpen}
            onClick={() => setTuckedOpen((v) => !v)}
          >
            <span className="shelf-plaque-text">{statusLabel("tucked", "corkboard")}</span>
            <span className="shelf-fold-meta">
              {byBucket.tucked.length}
              <span aria-hidden="true">{tuckedOpen ? " · open" : " · folded"}</span>
            </span>
          </button>
          {tuckedOpen ? (
            <ul className="shelf-grid">
              {byBucket.tucked.map((entry) => (
                <li key={entry.id} className={cn(scrapIsWide(entry) && "sm:col-span-2")}>
                  <Polaroid entry={entry} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
