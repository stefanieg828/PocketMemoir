/**
 * Browser side of backup/restore: Save to… prefers the system folder picker
 * (`showSaveFilePicker`), then a file share sheet, then Blob + <a download>
 * (iOS Safari 13+ and in-app browsers). Share stays its own control: cancel is
 * quiet, hard fail downloads. Kept apart from backup.ts so the pure logic
 * stays testable.
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

/**
 * Save to… — picker wrote the file, share sheet took it, they dismissed a
 * dialog, or we downloaded. `via` is set only on download: `direct` was the
 * plan, `share` / `picker` means a nicer path failed and we still saved a file.
 */
export type SaveToOutcome =
  | ({ outcome: "picked" } & BackupSaveResult)
  | ({ outcome: "shared" } & BackupSaveResult)
  | { outcome: "canceled" }
  | ({ outcome: "downloaded"; via: "direct" | "share" | "picker" } & BackupSaveResult);

type SaveFilePickerOptions = {
  suggestedName?: string;
  /** Remembers the last folder they chose for the next Save to…. */
  id?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type WritableChunk = string | Blob | BufferSource;

type SaveWritable = {
  write: (data: WritableChunk) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
};

type SaveFileHandle = {
  name?: string;
  createWritable: () => Promise<SaveWritable>;
};

type SavePicker = (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;

/** Window/document via globalThis so a non-browser test host can stub them. */
function hostWindow(): (Window & { showSaveFilePicker?: unknown }) | null {
  const w = (globalThis as typeof globalThis & { window?: Window & { showSaveFilePicker?: unknown } }).window;
  return w ?? null;
}

function hostDocument(): Document | null {
  const doc = (globalThis as typeof globalThis & { document?: Document }).document;
  return doc ?? null;
}

function hostNavigator(): Navigator | null {
  const nav = (globalThis as typeof globalThis & { navigator?: Navigator }).navigator;
  return nav ?? null;
}

function saveFilePicker(): SavePicker | null {
  const fn = hostWindow()?.showSaveFilePicker;
  return typeof fn === "function" ? (fn as SavePicker) : null;
}

export function buildBackupText(now = new Date()) {
  const { entries, mode, look, riso, unlocked, categories, pageStickers } = useMemoir.getState();
  const backup = createBackup({ entries, mode, look, riso, unlocked, categories, pageStickers }, now);
  return { text: serializeBackup(backup), name: backupFileName(now), backup };
}

export function downloadText(text: string, name: string) {
  const doc = hostDocument();
  const win = hostWindow();
  if (!doc || !win) throw new Error("download unavailable");
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = doc.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  doc.body.appendChild(a);
  a.click();
  // Give Safari a moment to start the download before revoking.
  win.setTimeout(() => {
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

/** True when this browser can open a system save dialog (folder + filename). */
export function canPickSaveLocation() {
  return saveFilePicker() != null;
}

/**
 * True when the share sheet can take a file. Missing `canShare` still counts —
 * some phones open a file sheet even when the probe is absent. A probe that
 * returns false means this sheet will not carry the backup, so Save to… should
 * download instead of opening a dead sheet.
 */
export function canSharePreparedFile(file: File) {
  const nav = hostNavigator();
  if (!nav || typeof nav.share !== "function") return false;
  if (typeof nav.canShare !== "function") return true;
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

const BACKUP_PICKER_TYPES: NonNullable<SaveFilePickerOptions["types"]> = [
  {
    description: "pocket memoir backup",
    accept: { "application/json": [".json"] },
  },
];

/** Write the serialized backup through the system save dialog. Rejects on cancel. */
async function writeWithSavePicker(text: string, name: string): Promise<string> {
  const showSaveFilePicker = saveFilePicker();
  if (!showSaveFilePicker) throw new Error("save picker unavailable");
  const handle = await showSaveFilePicker({
    suggestedName: name,
    id: "pocketmemoir-backup",
    types: BACKUP_PICKER_TYPES,
  });
  const writable = await handle.createWritable();
  try {
    // Same JSON string the download blob is built from.
    await writable.write(text);
    await writable.close();
  } catch (err) {
    try {
      await writable.abort?.();
    } catch {
      /* keep the original write error */
    }
    throw err;
  }
  const picked = handle.name?.trim();
  return picked || name;
}

/**
 * Save to… — folder picker where the File System Access API exists, otherwise
 * the share sheet when it can take a file, otherwise the download save.
 * Cancel stays quiet. A failed picker or share still leaves a file behind.
 */
export async function saveBackupToChosenPlace(): Promise<SaveToOutcome> {
  const { text, name, backup } = buildBackupText();
  const counts = backup.counts;
  let pickerFailed = false;

  if (canPickSaveLocation()) {
    try {
      const pickedName = await writeWithSavePicker(text, name);
      useMemoir.getState().markBackedUp();
      return { outcome: "picked", name: pickedName, counts };
    } catch (err) {
      if (isShareAbort(err)) return { outcome: "canceled" };
      pickerFailed = true;
    }
  }

  const file = new File([text], name, { type: "application/json" });
  if (canSharePreparedFile(file)) {
    const shared = await shareBuilt(text, name, counts);
    if (shared.outcome === "downloaded") return { ...shared, via: "share" };
    return shared;
  }

  downloadText(text, name);
  useMemoir.getState().markBackedUp();
  return { outcome: "downloaded", via: pickerFailed ? "picker" : "direct", name, counts };
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
  const nav = hostNavigator();
  return !!nav && typeof nav.share === "function";
}

/**
 * Share one already-built backup. Cancel → quiet, no download. Anything else
 * (unsupported, NotAllowedError, etc.) → same download as a direct save so
 * they are never stuck on a dead-end error.
 */
async function shareBuilt(
  text: string,
  name: string,
  counts: BackupSaveResult["counts"],
): Promise<ShareBackupOutcome> {
  const file = new File([text], name, { type: "application/json" });
  const nav = hostNavigator();

  if (!nav || typeof nav.share !== "function") {
    downloadText(text, name);
    useMemoir.getState().markBackedUp();
    return { outcome: "downloaded", name, counts };
  }

  try {
    await nav.share({ files: [file], title: "pocket memoir backup" });
  } catch (err) {
    if (isShareAbort(err)) return { outcome: "canceled" };
    downloadText(text, name);
    useMemoir.getState().markBackedUp();
    return { outcome: "downloaded", name, counts };
  }

  useMemoir.getState().markBackedUp();
  return { outcome: "shared", name, counts };
}

/**
 * Try the system share sheet with the backup file. Cancel → quiet. Anything else
 * (unsupported, NotAllowedError, etc.) → same download as a direct save so they
 * are never stuck on a dead-end error.
 */
export async function shareBackup(): Promise<ShareBackupOutcome> {
  const { text, name, backup } = buildBackupText();
  return shareBuilt(text, name, backup.counts);
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

/** Tiny quiet ack when they dismiss the save dialog or the Save to… share sheet. */
export function saveCanceledToast() {
  toast("save canceled");
}

/** Picker failed closed — we already downloaded the same backup for them. */
export function saveFallbackToast(res: BackupSaveResult) {
  toast("couldn't open a folder picker — saved a backup you can move.", {
    description: `${res.name}. tuck it somewhere safe: files, drive, or an email to yourself.`,
  });
}

/** Toast for Save to…. Share's own button keeps shareFallbackToast / shareCanceledToast. */
export function presentSaveToOutcome(res: SaveToOutcome) {
  if (res.outcome === "canceled") {
    saveCanceledToast();
    return;
  }
  if (res.outcome === "downloaded" && res.via === "share") {
    shareFallbackToast(res);
    return;
  }
  if (res.outcome === "downloaded" && res.via === "picker") {
    saveFallbackToast(res);
    return;
  }
  savedToast(res);
}
