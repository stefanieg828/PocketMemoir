/**
 * Browser side of peek share / open. Reuses hardened share patterns from
 * backup-io: cancel quiet, fail → download. Peek create reads the owner's
 * store only — never the active peek session.
 */
import { toast } from "sonner";
import {
  canShareBackupFile,
  downloadText,
  isShareAbort,
  readFileText,
} from "./backup-io";
import { createPeek, parsePeek, peekFileName, serializePeek } from "./peek";
import { usePeekSession } from "./peek-session";
import { normalizeStoredEntry, useMemoir } from "./store";

export const MAX_PEEK_BYTES = 60 * 1024 * 1024;

export type PeekSaveResult = {
  name: string;
  counts: { scraps: number; photos: number };
};

export type SharePeekOutcome =
  | ({ outcome: "shared" } & PeekSaveResult)
  | { outcome: "canceled" }
  | ({ outcome: "downloaded" } & PeekSaveResult);

export function buildPeekText(now = new Date()) {
  const { entries, mode, look, riso, categories, pageStickers } = useMemoir.getState();
  const peek = createPeek({ entries, mode, look, riso, categories, pageStickers }, now);
  return { text: serializePeek(peek), name: peekFileName(now), peek };
}

/** Download a peek file of the owner's album. Does not mark backup. */
export function savePeek(): PeekSaveResult {
  const { text, name, peek } = buildPeekText();
  downloadText(text, name);
  return { name, counts: peek.counts };
}

export function canSharePeekFile() {
  return canShareBackupFile();
}

/**
 * Try the system share sheet with the peek file. Cancel → quiet. Anything else
 * → download so they are never stuck.
 */
export async function sharePeek(): Promise<SharePeekOutcome> {
  const { text, name, peek } = buildPeekText();
  const counts = peek.counts;
  const file = new File([text], name, { type: "application/json" });

  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    downloadText(text, name);
    return { outcome: "downloaded", name, counts };
  }

  try {
    await navigator.share({ files: [file], title: "PocketMemoir peek" });
  } catch (err) {
    if (isShareAbort(err)) return { outcome: "canceled" };
    downloadText(text, name);
    return { outcome: "downloaded", name, counts };
  }

  return { outcome: "shared", name, counts };
}

export function peekSharedToast(res: PeekSaveResult) {
  const n = res.counts.scraps;
  toast.success(`shared a peek of ${n} ${n === 1 ? "scrap" : "scraps"}.`, {
    description: "friends can look — scraps stay with you.",
  });
}

export function peekSavedToast(res: PeekSaveResult) {
  const n = res.counts.scraps;
  toast.success(`peek ready · ${n} ${n === 1 ? "scrap" : "scraps"}.`, {
    description: `${res.name}. send it however you like.`,
  });
}

export function peekFallbackToast(res: PeekSaveResult) {
  toast("sharing isn’t available here — saved a peek you can send.", {
    description: `${res.name}. send it however you like.`,
  });
}

export type OpenPeekResult =
  | { ok: true; scraps: number }
  | { ok: false; message: string };

/**
 * Parse a picked peek file and start an in-memory session.
 * Never touches restore / unlocked / pocketmemoir.v1.
 */
export async function openPeekFromFile(file: File): Promise<OpenPeekResult> {
  if (file.size > MAX_PEEK_BYTES) {
    return { ok: false, message: "that file is too big to be a peek." };
  }
  const text = await readFileText(file);
  const parsed = parsePeek(text, normalizeStoredEntry);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  // Invariant: opening a peek must not mutate the owner's persisted store.
  const before = useMemoir.getState();
  const unlockedBefore = before.unlocked;
  const entriesBefore = before.entries;
  const lastBackupBefore = before.lastBackupAt;

  usePeekSession.getState().startPeek(parsed);

  const after = useMemoir.getState();
  if (
    after.unlocked !== unlockedBefore ||
    after.entries !== entriesBefore ||
    after.lastBackupAt !== lastBackupBefore
  ) {
    // Should never happen — roll back peek if store somehow changed.
    usePeekSession.getState().endPeek();
    return { ok: false, message: "couldn’t open that peek safely. try again." };
  }

  return { ok: true, scraps: parsed.entries.length };
}

export { readFileText };
