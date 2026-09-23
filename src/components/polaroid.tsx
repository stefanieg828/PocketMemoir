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

export function Polaroid({ entry, className }: PolaroidProps) {
  const look = useMemoir((s) => s.jacket);
  const meta = KIND_META[entry.kind];
  const tilt = tiltFor(entry.id);
  const tape = hashSeed(entry.id) % 2 === 0 ? "washi" : "washi washi-b";
  const pin = ["pin", "pin pin-b", "pin pin-c"][hashSeed(entry.id) % 3];
  const when = formatHappenedOn(entry.happenedOn);
  const caption = entry.how || entry.note || entry.facts;

  return (
    <Link
      to="/kept/$id"
      params={{ id: entry.id }}
      className={cn(
        "scrap-card group block p-4 text-ink no-underline",
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
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
