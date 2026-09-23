import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LOOK_META } from "@/lib/memoir/jackets";
import { LOOKS, type JacketId } from "@/lib/memoir/types";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

export function JacketPicker() {
  const jacket = useMemoir((s) => s.jacket);
  const setJacket = useMemoir((s) => s.setJacket);
  const [open, setOpen] = useState(false);
  const current = LOOK_META[jacket];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="font-display inline-flex min-h-11 items-center px-1 text-base text-muted hover:text-ink"
          aria-label={`Look, currently ${current.name}`}
        >
          Look
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="jacket-dialog fixed top-1/2 left-1/2 z-50 max-h-[min(90dvh,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-card p-5 text-ink sm:p-6">
          <Dialog.Title className="font-display text-2xl">Choose a look</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Same scraps. Different paper.
          </Dialog.Description>
          <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
            {LOOKS.map((id) => (
              <li key={id}>
                <LookCard
                  id={id}
                  selected={id === jacket}
                  onPick={() => {
                    setJacket(id);
                    setOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="font-display text-sm text-faint">Using {current.name}</p>
            <Dialog.Close asChild>
              <button type="button" className="kind-chip">
                never mind
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LookCard({
  id,
  selected,
  onPick,
}: {
  id: JacketId;
  selected: boolean;
  onPick: () => void;
}) {
  const meta = LOOK_META[id];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "flex h-full w-full flex-col gap-2 rounded-xl border-[3px] border-ink bg-card p-3 text-left shadow-paper",
        selected && "bg-gold",
      )}
    >
      <span className={cn("look-swatch", id === "scrapbook" ? "swatch-book" : "swatch-cork")} />
      <span className="font-display text-xl">{meta.name}</span>
      <span className="text-sm leading-relaxed text-muted">{meta.line}</span>
    </button>
  );
}
