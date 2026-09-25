import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Download, FolderOpen, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Title as AlertTitle } from "@radix-ui/react-alert-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { parseBackup, planRestore, type ParsedBackup, type RestoreStrategy } from "@/lib/memoir/backup";
import {
  MAX_BACKUP_BYTES,
  canShareBackupFile,
  readFileText,
  saveBackup,
  savedToast,
  shareBackup,
} from "@/lib/memoir/backup-io";
import { MODE_META } from "@/lib/memoir/jackets";
import { LOOK_SKINS } from "@/lib/memoir/looks";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { isStarterShelf, normalizeStoredEntry, useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

type ReadyBackup = Extract<ParsedBackup, { ok: true }>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function shortDate(d: Date) {
  return format(d, d.getFullYear() === new Date().getFullYear() ? "MMM d" : "MMM d, yyyy");
}

/** "Keep them safe" section in the Make it yours sheet. */
export function BackupSection() {
  const mode = useMemoir((s) => s.mode);
  const entries = useMemoir((s) => s.entries);
  const lastBackupAt = useMemoir((s) => s.lastBackupAt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ReadyBackup | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(canShareBackupFile()), []);

  const onSave = () => {
    setError(null);
    try {
      savedToast(saveBackup());
    } catch {
      setError("Couldn't make the file just now. Try again in a moment.");
    }
  };

  const onShare = async () => {
    setError(null);
    try {
      const res = await shareBackup();
      if (res) savedToast(res);
    } catch {
      setError("Sharing didn't work here. Use Save a backup instead.");
    }
  };

  const onPick = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setError("That file is too big to be a PocketMemoir backup.");
      return;
    }
    try {
      const parsed = parseBackup(await readFileText(file), normalizeStoredEntry);
      if (parsed.ok) setPending(parsed);
      else setError(parsed.message);
    } catch {
      setError("Couldn't open that file. Try picking it again.");
    }
  };

  return (
    <section className="picker-section backup-section" id="keep-safe" aria-labelledby="keep-safe-title">
      <h3 className="picker-section-title" id="keep-safe-title">
        <span className="picker-step backup-step" aria-hidden="true">
          ♥
        </span>
        Keep them safe
      </h3>
      <p className="backup-lede">
        Your scraps live only in this browser.{" "}
        {mode === "corkboard"
          ? "Take a copy of the whole wall now and then, and you can pin it all back anywhere."
          : "Tuck a copy of the whole album away now and then, and you can bring it all back anywhere."}
      </p>
      <div className="backup-actions">
        <button type="button" className="sticker-cta backup-save" onClick={onSave}>
          <Download className="size-4" strokeWidth={2.4} aria-hidden="true" />
          Save a backup
        </button>
        {canShare ? (
          <button type="button" className="kind-chip backup-share" onClick={onShare}>
            <Share2 className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Share
          </button>
        ) : null}
        <button type="button" className="kind-chip backup-restore" onClick={() => fileRef.current?.click()}>
          <FolderOpen className="size-4" strokeWidth={2.2} aria-hidden="true" />
          Restore from a file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="backup-file"
          onChange={(e) => {
            void onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="backup-status">
        {lastBackupAt
          ? `Last saved ${shortDate(new Date(lastBackupAt))}. ${plural(entries.length, "scrap")} here now.`
          : `No backup yet. It takes a second. ${plural(entries.length, "scrap")} here now.`}
      </p>
      {error ? (
        <p className="backup-error" role="alert">
          {error}
        </p>
      ) : null}
      <RestoreConfirm pending={pending} onClose={() => setPending(null)} />
    </section>
  );
}

function RestoreConfirm({ pending, onClose }: { pending: ReadyBackup | null; onClose: () => void }) {
  const entries = useMemoir((s) => s.entries);
  const applyRestore = useMemoir((s) => s.applyRestore);
  const markBackedUp = useMemoir((s) => s.markBackedUp);
  const lastBackupAt = useMemoir((s) => s.lastBackupAt);
  const setPickerOpen = usePickerUi((s) => s.setOpen);
  const starterOnly = entries.length === 0 || isStarterShelf(entries);
  const [strategy, setStrategy] = useState<RestoreStrategy>("merge");

  useEffect(() => {
    if (pending) setStrategy(starterOnly ? "replace" : "merge");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!pending) return null;
  const count = pending.entries.length;
  const merge = planRestore(entries, pending.entries, "merge");
  const settingsName = `${MODE_META[pending.settings.mode].name} · ${LOOK_SKINS[pending.settings.look].name}`;
  const title = `Restore ${plural(count, "scrap")}${pending.exportedAt ? ` from ${shortDate(pending.exportedAt)}` : ""}?`;

  const onRestore = () => {
    const plan = planRestore(entries, pending.entries, strategy);
    applyRestore(plan.entries, strategy === "replace" ? pending.settings : undefined);
    const stamp = pending.exportedAt?.getTime() ?? 0;
    if (stamp > (lastBackupAt ?? 0)) markBackedUp(stamp);
    onClose();
    setPickerOpen(false);
    if (useMemoir.getState().storageFull) {
      toast.error("This browser ran out of room for all of them.", {
        description: "They're here for now, but may not stick after a refresh. Try fewer photos.",
      });
      return;
    }
    toast.success(
      strategy === "replace"
        ? `Welcome back. ${plural(count, "scrap")} restored.`
        : plan.added
          ? `Tucked in ${plural(plan.added, "scrap")} from your backup.`
          : "Everything in that backup is already here.",
    );
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="restore-dialog w-[min(92vw,26rem)] rounded-[var(--restore-radius,0.9rem)]">
        <AlertDialogHeader>
          <AlertTitle className="restore-title">{title}</AlertTitle>
          <AlertDialogDescription className="restore-desc">
            {pending.photos ? `${plural(pending.photos, "photo")} included. ` : ""}
            You have {plural(entries.length, "scrap")} here right now
            {starterOnly && entries.length ? " (just the starter ones)" : ""}.
            {pending.skipped ? ` ${plural(pending.skipped, "row")} in the file couldn't be read and will be skipped.` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div role="radiogroup" aria-label="How to restore" className="restore-choices">
          <button
            type="button"
            role="radio"
            aria-checked={strategy === "merge"}
            className={cn("restore-choice", strategy === "merge" && "is-selected")}
            onClick={() => setStrategy("merge")}
          >
            <span className="restore-choice-name">Add what's missing</span>
            <span className="restore-choice-line">
              {merge.added
                ? `Tucks in ${plural(merge.added, "scrap")} from the file.`
                : "Nothing new in the file."}{" "}
              {merge.alreadyHere ? `${merge.alreadyHere} already here. ` : ""}Nothing here gets removed.
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={strategy === "replace"}
            className={cn("restore-choice", strategy === "replace" && "is-selected")}
            onClick={() => setStrategy("replace")}
          >
            <span className="restore-choice-name">Replace everything</span>
            <span className="restore-choice-line">
              Your shelf becomes the backup: {plural(count, "scrap")} and its look ({settingsName}).
            </span>
          </button>
        </div>

        {strategy === "replace" && entries.length > 0 && !starterOnly ? (
          <p className="restore-warn" role="note">
            The {plural(entries.length, "scrap")} here now will go.{" "}
            <button
              type="button"
              className="restore-warn-link"
              onClick={() => savedToast(saveBackup())}
            >
              Save a copy of them first
            </button>
          </p>
        ) : null}

        <AlertDialogFooter className="restore-footer">
          <AlertDialogCancel className="restore-cancel">Not now</AlertDialogCancel>
          <button
            type="button"
            className={cn("sticker-cta restore-go", strategy === "replace" && "is-replace")}
            onClick={onRestore}
          >
            {strategy === "replace"
              ? `Replace with ${plural(count, "scrap")}`
              : merge.added
                ? `Add ${plural(merge.added, "scrap")}`
                : "Done"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
