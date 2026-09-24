/**
 * Browser side of backup/restore: save via Blob + <a download> (works in iOS
 * Safari 13+ and Android Chrome), optional Web Share with a file, and reading a
 * picked file. Kept apart from backup.ts so the pure logic stays testable.
 */
import { toast } from "sonner";
import { backupFileName, createBackup, serializeBackup } from "./backup";
import { useMemoir } from "./store";

export const MAX_BACKUP_BYTES = 60 * 1024 * 1024;

export function buildBackupText(now = new Date()) {
  const { entries, mode, look, riso } = useMemoir.getState();
  const backup = createBackup({ entries, mode, look, riso }, now);
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
export function saveBackup() {
  const { text, name, backup } = buildBackupText();
  downloadText(text, name);
  useMemoir.getState().markBackedUp();
  return { name, counts: backup.counts };
}

export function canShareBackupFile() {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File(["{}"], "pocketmemoir-backup.json", { type: "application/json" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Share sheet (AirDrop / Files / Drive / email). Resolves false if the user backs out. */
export async function shareBackup() {
  const { text, name, backup } = buildBackupText();
  const file = new File([text], name, { type: "application/json" });
  try {
    await navigator.share({ files: [file], title: "PocketMemoir backup" });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
  useMemoir.getState().markBackedUp();
  return { name, counts: backup.counts };
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

/** Warm confirmation after a save / share. */
export function savedToast(res: { name: string; counts: { scraps: number; photos: number } }) {
  const n = res.counts.scraps;
  toast.success(`Saved ${n} ${n === 1 ? "scrap" : "scraps"}.`, {
    description: `${res.name}. Tuck it somewhere safe: Files, Drive, or an email to yourself.`,
  });
}
