import { useRef, useState, type FormEvent, useEffect, useMemo } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { KeepSeal } from "@/components/keep-seal";
import { Button } from "@/components/ui/button";
import { KIND_META } from "@/lib/memoir/copy";
import {
  defaultKindForCategory,
  isCustomKindId,
  isStarterId,
  kindsForBucket,
  selectionFromSticker,
  type StickerChip,
} from "@/lib/memoir/categories";
import { MODE_META } from "@/lib/memoir/jackets";
import { compressPhoto } from "@/lib/memoir/photos";
import { useMemoir } from "@/lib/memoir/store";
import { useShelfCategories } from "@/lib/memoir/use-shelf";
import {
  bucketForKind,
  type EntryKind,
  type MemoirDraft,
} from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

type KeepFormProps = {
  initial?: Partial<MemoirDraft>;
  onKeep: (draft: MemoirDraft) => void;
  onCancel?: () => void;
};

function chipIdFromInitial(initial?: Partial<MemoirDraft>): string {
  if (initial?.stickerId && isCustomKindId(initial.stickerId)) return initial.stickerId;
  return initial?.kind ?? "note";
}

export function KeepForm({ initial, onKeep, onCancel }: KeepFormProps) {
  const look = useMemoir((s) => s.mode);
  const unlocked = useMemoir((s) => s.unlocked);
  const categories = useMemoir((s) => s.categories);
  const shelf = useShelfCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Focus the title without scrolling the page down past categories.
    titleInputRef.current?.focus({ preventScroll: true });
  }, []);

  const [kind, setKind] = useState<EntryKind>(initial?.kind ?? "note");
  const [bucket, setBucket] = useState<string>(
    initial?.category
      ?? (initial?.kind ? bucketForKind(initial.kind) : shelf[0]?.id ?? "scraps"),
  );
  const [selectedChip, setSelectedChip] = useState<string>(chipIdFromInitial(initial));

  const chips = useMemo(
    () => kindsForBucket(categories, bucket, unlocked),
    [categories, bucket, unlocked],
  );

  const activeChip: StickerChip =
    chips.find((c) => c.id === selectedChip) ?? chips[0] ?? {
      id: kind,
      label: KIND_META[kind].label,
      custom: false,
      builtinKind: kind,
    };
  const meta = KIND_META[activeChip.builtinKind];

  const [title, setTitle] = useState(initial?.title ?? "");
  const [how, setHow] = useState(initial?.how ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [happenedOn, setHappenedOn] = useState(initial?.happenedOn ?? "");
  const [wouldBuyAgain, setWouldBuyAgain] = useState(Boolean(initial?.wouldBuyAgain));
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [busy, setBusy] = useState(false);

  function applyChip(chip: StickerChip) {
    const sel = selectionFromSticker(chip);
    setKind(sel.kind);
    setSelectedChip(chip.id);
  }

  function pickBucket(next: string) {
    setBucket(next);
    const nextChips = kindsForBucket(categories, next, unlocked);
    const first = nextChips[0];
    if (first) applyChip(first);
    else {
      const k = defaultKindForCategory(next);
      setKind(k);
      setSelectedChip(k);
    }
  }

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
    const sel = selectionFromSticker(activeChip);
    onKeep({
      kind: sel.kind,
      stickerId: sel.stickerId,
      title: next,
      how,
      facts: initial?.facts ?? "",
      note,
      happenedOn: dateValue || undefined,
      wouldBuyAgain: sel.kind === "thing" ? wouldBuyAgain : undefined,
      photo,
      category: bucket,
    });
  }

  const showKindRow = isStarterId(bucket) || chips.length > 1;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div
          role="radiogroup"
          aria-label="Shelf category"
          className="flex flex-wrap gap-2"
        >
          {shelf.map((cat) => {
            const on = cat.id === bucket;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pickBucket(cat.id)}
                className={cn("kind-chip", on && "bg-gold")}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {showKindRow ? (
          <div
            role="radiogroup"
            aria-label="What kind of scrap"
            className="keep-kind-row flex flex-wrap gap-2"
          >
            {chips.map((chip) => {
              const on = chip.id === activeChip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => applyChip(chip)}
                  className={cn("kind-chip kind-chip-soft", on && "bg-gold")}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        ) : null}
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
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={meta.titleHint}
          required
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
        <KeepSeal type="submit" label={MODE_META[look].keepLabel} size="lg" />
      </div>
    </form>
  );
}
