import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Polaroid } from "@/components/polaroid";
import { BUCKET_META, statusLabel } from "@/lib/memoir/copy";
import {
  ENTRY_BUCKETS,
  bucketForKind,
  type EntryBucket,
  type MemoirEntry,
} from "@/lib/memoir/types";
import { paperClassName, paperFor, type ScrapbookPaper } from "@/lib/scrapbook-paper";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;
const TURN_MS = 420;
const WHOOSH_MS = 560;
const FLIP_IN_MS = 720;

type FlipAnim = "idle" | "turn-fwd" | "turn-back" | "whoosh-fwd" | "whoosh-back" | "flip-in";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bucketIndex(bucket: EntryBucket): number {
  const i = ENTRY_BUCKETS.indexOf(bucket);
  return i < 0 ? 0 : i;
}

function splitSpread(entries: MemoirEntry[]): { left: MemoirEntry[]; right: MemoirEntry[] } {
  const keepsakes = entries.filter((e) => (e.status ?? "fresh") === "keepsake");
  const rest = entries.filter((e) => (e.status ?? "fresh") !== "keepsake");
  // Left: fresh + soft (first half-ish). Right: remaining + keepsakes in the “proud” corner.
  const mid = Math.ceil(rest.length / 2);
  const left = rest.slice(0, mid);
  const right = [...rest.slice(mid), ...keepsakes];
  if (left.length === 0 && right.length > 0) {
    return { left: right.slice(0, 1), right: right.slice(1) };
  }
  return { left, right };
}

type FlipAlbumProps = {
  entries: MemoirEntry[];
  /** Bucket to open on (defaults to first non-empty, else scraps). */
  initialBucket?: EntryBucket;
  /** Animate opening from the cover after an add. */
  flipIn?: boolean;
  /** Called when the active spread changes (for URL sync). */
  onBucketChange?: (bucket: EntryBucket) => void;
  className?: string;
};

export function FlipAlbum({
  entries,
  initialBucket,
  flipIn = false,
  onBucketChange,
  className,
}: FlipAlbumProps) {
  const startIndex = useMemo(() => {
    if (initialBucket) return bucketIndex(initialBucket);
    const firstFilled = ENTRY_BUCKETS.findIndex((b) =>
      entries.some((e) => bucketForKind(e.kind) === b),
    );
    return firstFilled >= 0 ? firstFilled : 0;
  }, [initialBucket, entries]);

  const [index, setIndex] = useState(startIndex);
  const [anim, setAnim] = useState<FlipAnim>(flipIn ? "flip-in" : "idle");
  const [tuckedOpen, setTuckedOpen] = useState(false);
  const animTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);

  // Sync when parent pushes a new initialBucket (e.g. after add).
  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!flipIn) return;
    setAnim("flip-in");
    const ms = prefersReducedMotion() ? 0 : FLIP_IN_MS;
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnim("idle"), ms || 16);
    return () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
  }, [flipIn, startIndex]);

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

  const bucket = ENTRY_BUCKETS[index] ?? "scraps";
  const spreadEntries = byBucket.map[bucket];
  const { left, right } = useMemo(() => splitSpread(spreadEntries), [spreadEntries]);
  const paper: ScrapbookPaper = paperFor(`spread-${bucket}-${spreadEntries.map((e) => e.id).join("+") || "empty"}`);

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(ENTRY_BUCKETS.length - 1, nextIndex));
      if (clamped === index || locked.current) return;

      const delta = clamped - index;
      const reduce = prefersReducedMotion();
      if (reduce) {
        setIndex(clamped);
        onBucketChange?.(ENTRY_BUCKETS[clamped]!);
        return;
      }

      locked.current = true;
      const abs = Math.abs(delta);
      const kind: FlipAnim =
        abs > 1
          ? delta > 0
            ? "whoosh-fwd"
            : "whoosh-back"
          : delta > 0
            ? "turn-fwd"
            : "turn-back";
      setAnim(kind);
      const ms = abs > 1 ? WHOOSH_MS : TURN_MS;
      if (animTimer.current) window.clearTimeout(animTimer.current);
      animTimer.current = window.setTimeout(() => {
        setIndex(clamped);
        onBucketChange?.(ENTRY_BUCKETS[clamped]!);
        setAnim("idle");
        locked.current = false;
      }, ms);
    },
    [index, onBucketChange],
  );

  useEffect(() => {
    return () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
  }, []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || locked.current) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goTo(index + 1);
    else goTo(index - 1);
  }

  const counts = ENTRY_BUCKETS.map((b) => byBucket.map[b].length);

  return (
    <section className={cn("flip-album", className)} aria-label="Scrapbook album">
      <nav className="flip-tabs" aria-label="Album spreads">
        {ENTRY_BUCKETS.map((b, i) => {
          const active = i === index;
          const meta = BUCKET_META[b];
          return (
            <button
              key={b}
              type="button"
              className={cn("flip-tab", active && "is-active")}
              aria-current={active ? "page" : undefined}
              aria-label={`${meta.label}${counts[i] ? `, ${counts[i]} scraps` : ", empty"}`}
              onClick={() => goTo(i)}
            >
              <span className="flip-tab-dot" aria-hidden="true" />
              <span className="flip-tab-label">{meta.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={cn("flip-stage", `is-${anim}`)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        <div className="flip-whoosh" aria-hidden="true">
          <span className="flip-whoosh-sheet" />
          <span className="flip-whoosh-sheet" />
          <span className="flip-whoosh-sheet" />
        </div>

        <div className={cn("flip-book", paperClassName(paper))} data-paper={paper}>
          <div className="flip-spine" aria-hidden="true">
            <span className="album-spine-ring" />
            <span className="album-spine-ring" />
            <span className="album-spine-ring" />
          </div>

          <div className="flip-spread">
            <SpreadPage side="left" title={BUCKET_META[bucket].label} entries={left} emptyHint="Left page waiting." />
            <SpreadPage
              side="right"
              title=" "
              entries={right}
              emptyHint={spreadEntries.length === 0 ? "Nothing stuck here yet." : "Room for more."}
              keepsakeCorner
            />
          </div>

          <div className="flip-curl" aria-hidden="true" />
          <div className="flip-turn-sheet" aria-hidden="true" />
        </div>
      </div>

      <div className="flip-controls">
        <button
          type="button"
          className="flip-nav-btn"
          aria-label="Previous spread"
          disabled={index <= 0 || anim !== "idle"}
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
          <span>Back</span>
        </button>
        <p className="flip-index font-display" aria-live="polite">
          {BUCKET_META[bucket].label}
          <span className="flip-index-meta">
            {" "}
            · {index + 1}/{ENTRY_BUCKETS.length}
          </span>
        </p>
        <button
          type="button"
          className="flip-nav-btn"
          aria-label="Next spread"
          disabled={index >= ENTRY_BUCKETS.length - 1 || anim !== "idle"}
          onClick={() => goTo(index + 1)}
        >
          <span>Next</span>
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      {byBucket.tucked.length > 0 ? (
        <section className="shelf-zone shelf-zone-tucked mt-5" aria-label={statusLabel("tucked", "scrapbook")}>
          <button
            type="button"
            className={cn("shelf-fold", tuckedOpen && "is-open")}
            aria-expanded={tuckedOpen}
            onClick={() => setTuckedOpen((v) => !v)}
          >
            <span className="shelf-plaque-text">{statusLabel("tucked", "scrapbook")}</span>
            <span className="shelf-fold-meta">
              {byBucket.tucked.length}
              <span aria-hidden="true">{tuckedOpen ? " · open" : " · folded"}</span>
            </span>
          </button>
          {tuckedOpen ? (
            <ul className="album-scraps mt-3">
              {byBucket.tucked.map((entry, i) => (
                <li key={entry.id} className={cn("album-scrap", `album-scrap-${(i % 6) + 1}`)}>
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

function SpreadPage({
  side,
  title,
  entries,
  emptyHint,
  keepsakeCorner = false,
}: {
  side: "left" | "right";
  title: string;
  entries: MemoirEntry[];
  emptyHint: string;
  keepsakeCorner?: boolean;
}) {
  return (
    <div className={cn("flip-page", side === "left" ? "flip-page-left" : "flip-page-right")}>
      {title.trim() ? (
        <header className="flip-page-banner">
          <span className="flip-page-banner-tape" aria-hidden="true" />
          <h2 className="flip-page-title">{title}</h2>
        </header>
      ) : (
        <div className="flip-page-banner flip-page-banner-quiet" aria-hidden="true">
          <span className="flip-page-banner-tape" />
        </div>
      )}

      {entries.length === 0 ? (
        <p className="flip-empty font-display">{emptyHint}</p>
      ) : (
        <ul className="flip-scraps">
          {entries.map((entry, i) => {
            const keepsake = (entry.status ?? "fresh") === "keepsake";
            const soft = (entry.status ?? "fresh") === "soft";
            return (
              <li
                key={entry.id}
                className={cn(
                  "flip-scrap",
                  `flip-scrap-${(i % 4) + 1}`,
                  keepsake && keepsakeCorner && "is-keepsake",
                  soft && "is-soft",
                )}
              >
                {keepsake ? (
                  <span className="flip-keepsake-badge" aria-label="Keepsake">
                    ♡
                  </span>
                ) : null}
                <Polaroid entry={entry} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
