import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { statusLabel } from "@/lib/memoir/copy";
import { categoryForEntry, categoryLabel } from "@/lib/memoir/categories";
import { LOOK_SKINS } from "@/lib/memoir/looks";
import { useMemoir } from "@/lib/memoir/store";
import { groupEntriesByCategory, useShelfCategories } from "@/lib/memoir/use-shelf";
import type { MemoirEntry } from "@/lib/memoir/types";
import { cn, hashSeed } from "@/lib/utils";

/** Board tone per bucket (0-3); each look maps tones to its own palette. */
const BOARD_TONES = [0, 1, 2, 3, 1, 0] as const;
const PIN_VARS = ["var(--pin-1)", "var(--pin-2)", "var(--pin-3)", "var(--pin-4)"] as const;
const PEEK_MAX = 3;
const ZOOM_MS = 480;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type CorkWallProps = {
  entries: MemoirEntry[];
  /** Open this board (from URL `spread`). Undefined = wall overview. */
  activeBucket?: string;
  /** Animate zoom-in after pin/add. */
  zoomIn?: boolean;
  onBucketChange?: (bucket: string) => void;
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
  const look = useMemoir((s) => s.look);
  const config = useMemoir((s) => s.categories);
  const mode = useMemoir((s) => s.mode);
  const shelf = useShelfCategories();
  const shelfIds = shelf.map((c) => c.id);

  useEffect(() => {
    if (!zoomIn || !activeBucket) return;
    setAnim("zoom-in");
    const ms = prefersReducedMotion() ? 0 : ZOOM_MS;
    const t = window.setTimeout(() => setAnim("idle"), ms || 16);
    return () => window.clearTimeout(t);
  }, [zoomIn, activeBucket]);

  const byCategory = useMemo(() => {
    const map = groupEntriesByCategory(entries, shelfIds);
    const tucked: MemoirEntry[] = [];
    for (const entry of entries) {
      if ((entry.status ?? "fresh") === "tucked") tucked.push(entry);
    }
    return { map, tucked };
  }, [entries, shelfIds]);

  const zoomed = Boolean(activeBucket);
  const boardEntries = activeBucket ? (byCategory.map[activeBucket] ?? []) : [];
  const activeLabel = activeBucket ? categoryLabel(config, activeBucket, mode) : "";

  function openBoard(bucket: string) {
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
            <p className="cork-wall-kicker font-display">{LOOK_SKINS[look].kicker}</p>
            <h1 className="cork-wall-title font-display">Wall of boards</h1>
            <p className="cork-wall-sub">
              Your boards — same sticky-note shelf as the scrapbook. Tap one to zoom in.
            </p>
          </header>

          <ul className="cork-wall-grid" role="list">
            {shelf.map((cat, i) => {
              const bucket = cat.id;
              const list = byCategory.map[bucket] ?? [];
              const tone = BOARD_TONES[i % BOARD_TONES.length] ?? 0;
              const pin = PIN_VARS[i % PIN_VARS.length]!;
              const tilt = ((hashSeed(bucket) % 9) - 4) * 0.55;
              const peeks = list.slice(0, PEEK_MAX);
              const label = cat.name;

              return (
                <li key={bucket} className="cork-wall-cell">
                  <button
                    type="button"
                    className={cn("cork-mini-board", `board-tone-${tone}`, `board-${i + 1}`, `tear-${(hashSeed(bucket) >>> 3) % 12}`)}
                    style={{ ["--board-tilt" as string]: `${tilt}deg` }}
                    aria-label={`${label}${list.length ? `, ${list.length} pinned` : ", empty board"}`}
                    onClick={() => openBoard(bucket)}
                  >
                    <span className="pin pin-center" style={{ ["--pin" as string]: pin }} aria-hidden="true" />
                    <span className={cn("cork-mini-label-scrap", `strip-${(hashSeed(bucket) >>> 5) % 8}`)} aria-hidden="true">
                      <span className="cork-mini-label">{label}</span>
                    </span>
                    {peeks.length === 0 ? (
                      <span className="cork-mini-empty font-display">nothing pinned</span>
                    ) : (
                      <ul className="cork-mini-peeks" aria-hidden="true">
                        {peeks.map((entry, pi) => (
                          <li
                            key={entry.id}
                            className={cn("cork-peek", `cork-peek-${(pi % 3) + 1}`, `strip-${hashSeed(entry.id) % 8}`)}
                          >
                            <span className="cork-peek-pin" />
                            <span className="cork-peek-title">{entry.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {list.length > 0 ? (
                      <span className="cork-mini-count">
                        <span className="cork-count-n">{list.length}</span>
                        <span className="cork-count-label">{list.length === 1 ? " scrap" : " scraps"}</span>
                      </span>
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
              {activeLabel}
            </p>
            <span className="cork-zoom-meta font-display">
              {boardEntries.length
                ? `${boardEntries.length} pinned`
                : "empty board"}
            </span>
          </div>

          <div className="cork-zoom-board">
            <span
              className="pin pin-center"
              style={{ ["--pin" as string]: PIN_VARS[Math.max(0, shelfIds.indexOf(activeBucket!)) % PIN_VARS.length] }}
              aria-hidden="true"
            />
            <span className="cork-zoom-plaque font-display" aria-hidden="true">
              {activeLabel}
            </span>

            {boardEntries.length === 0 ? (
              <div className="cork-zoom-empty">
                <span className="cork-zoom-empty-ghost" aria-hidden="true" />
                <p className="font-display text-xl">Nothing pinned here yet.</p>
                <p className="mt-1 text-sm text-muted">Plenty of cork, waiting for a scrap.</p>
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

      {byCategory.tucked.length > 0 ? (
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
              {byCategory.tucked.length}
              <span aria-hidden="true">{tuckedOpen ? " · open" : " · folded"}</span>
            </span>
          </button>
          {tuckedOpen ? (
            <ul className="shelf-grid">
              {byCategory.tucked.map((entry) => (
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
