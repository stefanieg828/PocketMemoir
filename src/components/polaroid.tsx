import { Link } from "@tanstack/react-router";
import { KIND_META } from "@/lib/memoir/copy";
import { formatHappenedOn } from "@/lib/memoir/dates";
import { useMemoir } from "@/lib/memoir/store";
import type { MemoirEntry } from "@/lib/memoir/types";
import { cn, hashSeed, tiltFor } from "@/lib/utils";
import { KindMark } from "@/components/kind-mark";

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
  const look = useMemoir((s) => s.jacket);
  const meta = KIND_META[entry.kind];
  const tilt = tiltFor(entry.id);
  const tapeOptions = ["washi", "washi washi-b", "washi washi-c"] as const;
  const pinOptions = ["pin", "pin pin-b", "pin pin-c", "pin pin-d"] as const;
  const tape = tapeOptions[hashSeed(entry.id) % tapeOptions.length];
  const pin = pinOptions[hashSeed(entry.id) % pinOptions.length];
  const when = formatHappenedOn(entry.happenedOn);
  const caption = entry.how || entry.note || entry.facts;
  const size = scrapSizeClass(entry);

  return (
    <Link
      to="/kept/$id"
      params={{ id: entry.id }}
      className={cn("scrap-card scrap-tilt is-link group block p-4 text-ink no-underline", size, className)}
      style={{ ["--scrap-tilt" as string]: `${tilt}deg` }}
    >
      <span className={look === "corkboard" ? pin : tape} aria-hidden="true" />
      {entry.photo ? (
        <span className="drawn-frame mb-3 block overflow-hidden">
          <img src={entry.photo} alt="" className="aspect-[4/3] w-full object-cover" />
        </span>
      ) : (
        <KindMark kind={entry.kind} className="mb-3" />
      )}
      <p className="font-display text-xl font-semibold leading-snug">{entry.title}</p>
      {caption ? <p className="mt-1 text-sm leading-relaxed text-muted">{caption}</p> : null}
      <p className="mt-2 text-xs font-display text-faint">
        {meta.label}
        {when ? ` · ${when}` : ""}
      </p>
    </Link>
  );
}
