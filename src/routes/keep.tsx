import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlbumCover } from "@/components/album-cover";
import { KeepForm } from "@/components/keep-form";
import { hasDayDate } from "@/lib/memoir/dates";
import { MODE_META } from "@/lib/memoir/jackets";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useMemoir } from "@/lib/memoir/store";
import { categoryForEntry } from "@/lib/memoir/categories";
import { isEntryKind, type EntryKind } from "@/lib/memoir/types";

function validateSearch(search: Record<string, unknown>): { kind?: EntryKind; date?: string } {
  const kind = isEntryKind(search.kind) ? search.kind : undefined;
  const date = typeof search.date === "string" && hasDayDate(search.date) ? search.date : undefined;
  return { kind, date };
}

export const Route = createFileRoute("/keep")({
  validateSearch,
  component: KeepPage,
});

function KeepPage() {
  const { kind, date } = Route.useSearch();
  const navigate = useNavigate();
  const addEntry = useMemoir((s) => s.addEntry);
  const storageFull = useMemoir((s) => s.storageFull);
  const jacket = useMemoir((s) => s.mode);
  const look = MODE_META[jacket];
  const peeking = useIsPeeking();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (peeking) void navigate({ to: "/", search: {}, replace: true });
  }, [peeking, navigate]);

  if (peeking) return null;

  function afterKeep(_entryId: string, entryKind: EntryKind, title: string) {
    if (useMemoir.getState().storageFull || storageFull) {
      toast("Stuck in memory, but this browser is too full for the photo.");
    } else {
      toast(look.keptToast(title));
    }

    const spread = categoryForEntry({ kind: entryKind });
    void navigate({
      to: "/",
      search: { spread, flipIn: true },
    });
  }

  if (jacket === "scrapbook") {
    return (
      <section className="mx-auto max-w-lg">
        <Link to="/" search={{}} className="font-display text-sm text-muted no-underline hover:text-ink">
          Back to the album
        </Link>
        <div className="mt-4">
          <AlbumCover heading={look.addHeading} sub="Build your memoir here.">
            <KeepForm
              key={`${kind ?? "note"}-${date ?? ""}`}
              initial={{ kind: kind ?? "note", happenedOn: date }}
              onKeep={(draft) => {
                const entry = addEntry(draft);
                afterKeep(entry.id, entry.kind, entry.title);
              }}
            />
          </AlbumCover>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg">
      <div className="cork-sheet">
        <Link to="/" search={{}} className="block w-fit font-display text-sm text-muted no-underline hover:text-ink">
          Back to the wall
        </Link>
        <h1 className="look-headline mt-2 font-display text-title">{look.addHeading}</h1>
        <p className="mt-1 text-sm text-muted">Build your memoir here.</p>
      </div>
      <div className="scrap-card tear-3 relative mt-6 px-4 py-6 sm:px-6">
        <span className="pin" aria-hidden="true" />
        <KeepForm
          key={`${kind ?? "note"}-${date ?? ""}`}
          initial={{ kind: kind ?? "note", happenedOn: date }}
          onKeep={(draft) => {
            const entry = addEntry(draft);
            afterKeep(entry.id, entry.kind, entry.title);
          }}
        />
      </div>
    </section>
  );
}
