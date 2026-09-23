import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlbumPage } from "@/components/album-page";
import { KeepForm } from "@/components/keep-form";
import { hasDayDate } from "@/lib/memoir/dates";
import { LOOK_META } from "@/lib/memoir/jackets";
import { useMemoir } from "@/lib/memoir/store";
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
  const look = LOOK_META[useMemoir((s) => s.jacket)];

  return (
    <section className="mx-auto max-w-lg">
      <Link to="/" className="font-display text-sm text-muted no-underline hover:text-ink">
        Back to the shelf
      </Link>
      <h1 className="mt-3 font-display text-title font-semibold">{look.addHeading}</h1>
      <p className="mt-1 text-sm text-muted">Write first. The kind is just a sticker.</p>
      {look.id === "scrapbook" ? (
        <div className="mt-6">
          <AlbumPage seed="keep-form">
            <div className="scrap-card scrap-on-page relative px-4 py-6 sm:px-6">
              <span className="washi" aria-hidden="true" />
              <span className="washi-corner" aria-hidden="true" />
              <KeepForm
                key={`${kind ?? "note"}-${date ?? ""}`}
                initial={{ kind: kind ?? "note", happenedOn: date }}
                onKeep={(draft) => {
                  const entry = addEntry(draft);
                  if (useMemoir.getState().storageFull || storageFull) {
                    toast("Stuck in memory, but this browser is too full for the photo.");
                  } else {
                    toast(look.keptToast(entry.title));
                  }
                  void navigate({ to: "/kept/$id", params: { id: entry.id } });
                }}
              />
            </div>
          </AlbumPage>
        </div>
      ) : (
        <div className="scrap-card relative mt-6 px-4 py-6 sm:px-6">
          <span className="pin" aria-hidden="true" />
          <KeepForm
            key={`${kind ?? "note"}-${date ?? ""}`}
            initial={{ kind: kind ?? "note", happenedOn: date }}
            onKeep={(draft) => {
              const entry = addEntry(draft);
              if (useMemoir.getState().storageFull || storageFull) {
                toast("Stuck in memory, but this browser is too full for the photo.");
              } else {
                toast(look.keptToast(entry.title));
              }
              void navigate({ to: "/kept/$id", params: { id: entry.id } });
            }}
          />
        </div>
      )}
    </section>
  );
}
