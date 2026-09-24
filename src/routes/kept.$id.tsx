import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { KeepForm } from "@/components/keep-form";
import { StatusMover } from "@/components/status-mover";
import { KindMark } from "@/components/kind-mark";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { KIND_META } from "@/lib/memoir/copy";
import { formatHappenedOn } from "@/lib/memoir/dates";
import { MODE_META } from "@/lib/memoir/jackets";
import { useMemoir } from "@/lib/memoir/store";
import { bucketForKind } from "@/lib/memoir/types";

export const Route = createFileRoute("/kept/$id")({
  component: KeptPage,
});

function KeptPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const jacket = useMemoir((s) => s.mode);
  const look = MODE_META[jacket];
  const entry = useMemoir((s) => s.entries.find((item) => item.id === id));
  const updateEntry = useMemoir((s) => s.updateEntry);
  const removeEntry = useMemoir((s) => s.removeEntry);
  const [changing, setChanging] = useState(false);

  if (!hasHydrated) {
    return <div className="scrap-card mx-auto h-80 max-w-lg" />;
  }

  if (!entry) {
    return (
      <section className="flex flex-col items-center py-10 text-center">
        <h1 className="font-display text-3xl">This one isn’t stuck in.</h1>
        <p className="mt-2 text-muted">It wandered off, or it was never kept.</p>
        <Link to="/" search={{}} className="sticker-cta mt-6">
          Back to the shelf
        </Link>
      </section>
    );
  }

  const meta = KIND_META[entry.kind];

  if (changing) {
    return (
      <section className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => setChanging(false)}
          className="on-cork font-display min-h-11 text-sm text-muted hover:text-ink"
        >
          never mind
        </button>
        <h1 className="on-cork mt-3 font-display text-title font-semibold">Change this</h1>
        <div className="scrap-card relative mt-6 px-5 py-8 sm:px-8">
          <span className={jacket === "corkboard" ? "pin" : "washi"} aria-hidden="true" />
          <KeepForm
            initial={entry}
            onCancel={() => setChanging(false)}
            onKeep={(draft) => {
              updateEntry(entry.id, draft);
              toast(jacket === "corkboard" ? "Pinned the change." : "Stuck the change in.");
              setChanging(false);
            }}
          />
        </div>
      </section>
    );
  }

  const when = formatHappenedOn(entry.happenedOn);

  return (
    <section className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2 md:items-start">
      <Link
        to="/"
        search={{ spread: bucketForKind(entry.kind) }}
        className="on-cork font-display inline-flex min-h-11 w-fit items-center text-sm text-muted no-underline hover:text-ink md:col-span-2"
      >
        {jacket === "scrapbook" ? "Back to the album" : "Back to the board"}
      </Link>

      <article className="scrap-card relative mx-auto w-full max-w-sm p-4 md:mx-0">
        <span className={jacket === "corkboard" ? "pin" : "washi"} aria-hidden="true" />
        {entry.photo ? (
          <span className="drawn-frame mb-3 block overflow-hidden">
            <img src={entry.photo} alt="" className="aspect-[4/3] w-full object-cover" />
          </span>
        ) : (
          <KindMark kind={entry.kind} size="lg" className="mb-4" />
        )}
        <p className="font-display text-3xl leading-snug font-semibold">{entry.title}</p>
        <p className="mt-1 font-display text-sm text-muted">{meta.label}</p>
        <StatusMover
          entryId={entry.id}
          status={entry.status ?? "fresh"}
          size="detail"
          className="mt-4"
        />
      </article>

      <div className="cork-sheet min-w-0">
        <LetterLine label="Details" value={entry.how} />
        <LetterLine label="Also" value={entry.facts} />
        <LetterLine label="A scrap of a line" value={entry.note} />
        {when ? <LetterLine label="The day" value={when} /> : null}
        {entry.kind === "thing" && entry.wouldBuyAgain ? (
          <p className="kind-chip mt-5 bg-gold">would buy again</p>
        ) : null}
        <time
          dateTime={new Date(entry.createdAt).toISOString()}
          className="mt-6 block text-sm text-faint"
        >
          kept {format(entry.createdAt, "d MMMM yyyy")}
        </time>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="button" variant="tape" onClick={() => setChanging(true)}>
            Change
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="danger">
                Let it go
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Let this one go?</AlertDialogTitle>
                <AlertDialogDescription>
                  {entry.title} leaves the {look.name.toLowerCase()}. You can keep it if you’d rather.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    removeEntry(entry.id);
                    toast("Let go.");
                    void navigate({ to: "/" });
                  }}
                >
                  Let it go
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}

function LetterLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="kept-row py-3">
      <p className="font-display text-sm text-muted">{label}</p>
      <p className="mt-1 text-base leading-relaxed">{value}</p>
    </div>
  );
}
