/**
 * Browser side of backup/restore: save via Blob + <a download> (works in iOS
 * Safari 13+ and Android Chrome), optional Web Share with a file, and reading a
 * picked file. Kept apart from backup.ts so the pure logic stays testable.
 */
import { toast } from "sonner";
import { backupFileName, createBackup, serializeBackup } from "./backup";
import { useMemoir } from "./store";

export const MAX_BACKUP_BYTES = 60 * 1024 * 1024;

export type BackupSaveResult = {
  name: string;
  counts: { scraps: number; photos: number };
};

/** Result of tapping Share — cancel is quiet; hard fail downloads for them. */
export type ShareBackupOutcome =
  | ({ outcome: "shared" } & BackupSaveResult)
  | { outcome: "canceled" }
  | ({ outcome: "downloaded" } & BackupSaveResult);

export function buildBackupText(now = new Date()) {
  const { entries, mode, look, riso, unlocked, categories, pageStickers } = useMemoir.getState();
  const backup = createBackup({ entries, mode, look, riso, unlocked, categories, pageStickers }, now);
  return { text: serializeBackup(backup), name: backupFileName(now), backup };
}

export function downloadText(text: string, name: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Give Safari a moment to start the download before revoking.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 4000);
}

/** Save a backup file now; returns the file name + counts for the toast. */
export function saveBackup(): BackupSaveResult {
  const { text, name, backup } = buildBackupText();
  downloadText(text, name);
  useMemoir.getState().markBackedUp();
  return { name, counts: backup.counts };
}

/**
 * User dismissed the share sheet (not a real failure). Browsers vary: AbortError
 * is standard; some WebViews use CancellationError; accept either name even when
 * the throw isn't a DOMException.
 */
export function isShareAbort(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;
  const name = "name" in err ? String((err as { name: unknown }).name) : "";
  return name === "AbortError" || name === "CancellationError";
}

/**
 * Offer the Share button when Web Share exists. `canShare({ files })` can be true
 * then `share` still throws, or false on phones that can still open a sheet — so
 * we don't gate the button on the file probe alone.
 */
export function canShareBackupFile() {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.share === "function";
}

/**
 * Try the system share sheet with the backup file. Cancel → quiet. Anything else
 * (unsupported, NotAllowedError, etc.) → same download as Save a backup so they
 * are never stuck on a dead-end error.
 */
export async function shareBackup(): Promise<ShareBackupOutcome> {
  const { text, name, backup } = buildBackupText();
  const counts = backup.counts;
  const file = new File([text], name, { type: "application/json" });

  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    downloadText(text, name);
    useMemoir.getState().markBackedUp();
    return { outcome: "downloaded", name, counts };
  }

  try {
    await navigator.share({ files: [file], title: "PocketMemoir backup" });
  } catch (err) {
    if (isShareAbort(err)) return { outcome: "canceled" };
    downloadText(text, name);
    useMemoir.getState().markBackedUp();
    return { outcome: "downloaded", name, counts };
  }

  useMemoir.getState().markBackedUp();
  return { outcome: "shared", name, counts };
}

export function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsText(file);
  });
}

/** Warm confirmation after a save / successful share. */
export function savedToast(res: BackupSaveResult) {
  const n = res.counts.scraps;
  toast.success(`Saved ${n} ${n === 1 ? "scrap" : "scraps"}.`, {
    description: `${res.name}. Tuck it somewhere safe: Files, Drive, or an email to yourself.`,
  });
}

/** Soft note when Share couldn't open a sheet — we already saved the file for them. */
export function shareFallbackToast(res: BackupSaveResult) {
  toast("sharing isn’t available here — saved a backup you can send.", {
    description: `${res.name}. tuck it somewhere safe: files, drive, or an email to yourself.`,
  });
}

/** Tiny quiet ack when they dismiss the share sheet. */
export function shareCanceledToast() {
  toast("share canceled");
}
