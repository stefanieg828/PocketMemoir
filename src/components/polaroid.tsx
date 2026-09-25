import { Link } from "@tanstack/react-router";
import { KIND_META } from "@/lib/memoir/copy";
import { formatHappenedOn } from "@/lib/memoir/dates";
import { useMemoir } from "@/lib/memoir/store";
import type { MemoirEntry } from "@/lib/memoir/types";
import { cn, hashSeed, tiltFor } from "@/lib/utils";
import { KindMark } from "@/components/kind-mark";
import { StatusMover } from "@/components/status-mover";

type PolaroidProps = {
  entry: MemoirEntry;
  className?: string;
};

export function scrapIsWide(entry: MemoirEntry) {
  return (
    !entry.photo &&
    (entry.how.length > 42 || entry.kind === "note" || entry.kind === "list" || entry.kind === "quote")
  );
}

function scrapSizeClass(entry: MemoirEntry) {
  const seed = hashSeed(entry.id) % 5;
  if (scrapIsWide(entry)) return "scrap-lg";
  if (seed === 0) return "scrap-sm";
  if (seed === 1 || seed === 2) return "scrap-lg";
  return "";
}

export function Polaroid({ entry, className }: PolaroidProps) {
  const look = useMemoir((s) => s.mode);
  const meta = KIND_META[entry.kind];
  const tilt = tiltFor(entry.id);
  const seed = hashSeed(entry.id);
  const tapeOptions = [
    "washi",
    "washi washi-b",
    "washi washi-c",
    "washi washi-d",
    "washi washi-e",
  ] as const;
  const pinOptions = ["pin", "pin pin-b", "pin pin-c", "pin pin-d"] as const;
  const cornerOptions = [
    "washi-corner",
    "washi-corner washi-corner-b",
    "washi-corner washi-corner-c",
  ] as const;
  const tape = tapeOptions[seed % tapeOptions.length];
  const pin = pinOptions[seed % pinOptions.length];
  const corner = cornerOptions[seed % cornerOptions.length];
  const showSeal = look === "scrapbook" && seed % 3 === 0;
  const doodle =
    look === "scrapbook"
      ? (["heart", "star", "heart-b", "star-b", null, "heart"] as const)[seed % 6]
      : null;
  const when = formatHappenedOn(entry.happenedOn);
  const caption = entry.how || entry.note || entry.facts;
  const size = scrapSizeClass(entry);
  const tone = `scrap-tone-${(seed >>> 3) % 4}`;

  return (
    <Link
      to="/kept/$id"
      params={{ id: entry.id }}
      className={cn(
        "scrap-card scrap-tilt is-link group block p-4 text-ink no-underline",
        look === "scrapbook" && "scrap-on-page",
        size,
        tone,
        `tear-${(seed >>> 5) % 12}`,
        className,
      )}
      style={{ ["--scrap-tilt" as string]: `${tilt}deg` }}
    >
      {look === "corkboard" ? (
        <span className={pin} aria-hidden="true" />
      ) : (
        <>
          <span className={tape} aria-hidden="true" />
          <span className={corner} aria-hidden="true" />
          {showSeal ? <span className="wax-on-scrap" aria-hidden="true" /> : null}
          {doodle === "heart" ? (
            <span className="doodle doodle-heart" aria-hidden="true" />
          ) : null}
          {doodle === "heart-b" ? (
            <span className="doodle doodle-heart doodle-b" aria-hidden="true" />
          ) : null}
          {doodle === "star" ? (
            <span className="doodle doodle-star" aria-hidden="true" />
          ) : null}
          {doodle === "star-b" ? (
            <span className="doodle doodle-star doodle-b" aria-hidden="true" />
          ) : null}
        </>
      )}
      {entry.photo ? (
        <span className="drawn-frame mb-3 block overflow-hidden">
          <img src={entry.photo} alt="" className="aspect-[4/3] w-full object-cover" />
        </span>
      ) : (
        <KindMark kind={entry.kind} className="mb-3" />
      )}
      <p className="scrap-title font-display text-xl font-semibold leading-snug">{entry.title}</p>
      {caption ? <p className="scrap-caption mt-1 text-sm leading-relaxed text-muted">{caption}</p> : null}
      <p className="scrap-meta mt-2 text-xs font-display text-faint">
        {meta.label}
        {when ? ` · ${when}` : ""}
      </p>
      <div className="mt-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <StatusMover entryId={entry.id} status={entry.status ?? "fresh"} size="card" />
      </div>
    </Link>
  );
}
