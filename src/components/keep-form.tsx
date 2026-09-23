import { useRef, useState, type FormEvent } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { KeepSeal } from "@/components/keep-seal";
import { Button } from "@/components/ui/button";
import { KIND_META } from "@/lib/memoir/copy";
import { LOOK_META } from "@/lib/memoir/jackets";
import { compressPhoto } from "@/lib/memoir/photos";
import { useMemoir } from "@/lib/memoir/store";
import { ENTRY_KINDS, type EntryKind, type MemoirDraft } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

type KeepFormProps = {
  initial?: Partial<MemoirDraft>;
  onKeep: (draft: MemoirDraft) => void;
  onCancel?: () => void;
};

export function KeepForm({ initial, onKeep, onCancel }: KeepFormProps) {
  const look = useMemoir((s) => s.jacket);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<EntryKind>(initial?.kind ?? "note");
  const meta = KIND_META[kind];
  const [title, setTitle] = useState(initial?.title ?? "");
  const [how, setHow] = useState(initial?.how ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [happenedOn, setHappenedOn] = useState(initial?.happenedOn ?? "");
  const [wouldBuyAgain, setWouldBuyAgain] = useState(Boolean(initial?.wouldBuyAgain));
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [busy, setBusy] = useState(false);

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("That doesn’t look like a photo.");
      return;
    }
    setBusy(true);
    try {
      setPhoto(await compressPhoto(file));
    } catch {
      toast("Couldn’t keep that photo.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = title.trim();
    if (!next) {
      toast("A name is enough to stick it in.");
      return;
    }
    const formDate = event.currentTarget.elements.namedItem("happenedOn");
    const dateValue =
      happenedOn || (formDate instanceof HTMLInputElement ? formDate.value : "");
    if (meta.dateRequired && !dateValue) {
      toast("An event needs a day.");
      return;
    }
    onKeep({
      kind,
      title: next,
      how,
      facts: initial?.facts ?? "",
      note,
      happenedOn: dateValue || undefined,
      wouldBuyAgain: kind === "thing" ? wouldBuyAgain : undefined,
      photo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div role="radiogroup" aria-label="What kind of scrap" className="flex flex-wrap gap-2">
        {ENTRY_KINDS.map((id) => {
          const on = id === kind;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setKind(id)}
              className={cn("kind-chip", on && "bg-gold")}
            >
              {KIND_META[id].label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="drawn-frame relative mx-auto w-full max-w-56 p-2"
        disabled={busy}
      >
        <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-paper-deep/60">
          {photo ? (
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-muted">
              <Camera className="size-5" strokeWidth={2.25} />
              <span className="font-display text-sm">optional photo</span>
            </span>
          )}
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPickPhoto(e.target.files?.[0])}
      />
      {photo ? (
        <button
          type="button"
          onClick={() => setPhoto(undefined)}
          className="mx-auto -mt-4 flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2.25} />
          without a photo
        </button>
      ) : null}

      <label htmlFor="title" className="flex flex-col gap-1">
        <span className="font-display text-sm text-muted">What is it</span>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={meta.titleHint}
          required
          autoFocus
          maxLength={80}
          autoComplete="off"
          className="notebook-line"
        />
      </label>
      <label htmlFor="how" className="flex flex-col gap-1">
        <span className="font-display text-sm text-muted">Details</span>
        <input
          id="how"
          name="how"
          value={how}
          onChange={(e) => setHow(e.target.value)}
          placeholder={meta.detailHint}
          maxLength={200}
          autoComplete="off"
          className="notebook-line"
        />
      </label>
      <label htmlFor="note" className="flex flex-col gap-1">
        <span className="font-display text-sm text-muted">A scrap of a line</span>
        <input
          id="note"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="one more thing, if you want"
          maxLength={140}
          autoComplete="off"
          className="notebook-line"
        />
      </label>
      <label htmlFor="happenedOn" className="flex flex-col gap-1">
        <span className="font-display text-sm text-muted">
          {meta.dateRequired ? "The day" : "A date, if it matters"}
        </span>
        <input
          id="happenedOn"
          name="happenedOn"
          type="date"
          value={happenedOn}
          onChange={(e) => setHappenedOn(e.target.value)}
          required={meta.dateRequired}
          className="notebook-line"
        />
      </label>

      {kind === "thing" ? (
        <button
          type="button"
          aria-pressed={wouldBuyAgain}
          onClick={() => setWouldBuyAgain((v) => !v)}
          className={cn("kind-chip self-start", wouldBuyAgain && "bg-gold")}
        >
          would buy again
        </button>
      ) : null}

      <div className="flex items-center justify-between gap-4 pt-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            never mind
          </Button>
        ) : (
          <span />
        )}
        <KeepSeal type="submit" label={LOOK_META[look].keepLabel} size="lg" />
      </div>
    </form>
  );
}
