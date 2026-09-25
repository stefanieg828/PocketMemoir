/**
 * Backup & restore: one self-contained JSON file with every scrap (photos are
 * already JPEG data URLs inside each entry, so they travel inline) plus the
 * Mode / Look / Riso settings. Pure functions only — no DOM, no store — so this
 * is unit-tested in scripts/backup.test.mjs.
 */
import {
  normalizeCategoryConfig,
  type CategoryConfig,
} from "./categories.ts";
import { normalizeRiso } from "./looks.ts";
import type { LookId, MemoirEntry, ModeId, RisoPrefs } from "./types.ts";
import { normalizeLook, normalizeMode } from "./types.ts";

export const BACKUP_FORMAT = "pocketmemoir-backup";
export const BACKUP_VERSION = 2;
/** Suggest a backup after this many new scraps since the last one (or last dismiss). */
export const BACKUP_NUDGE_AFTER = 10;

export type BackupSettings = {
  mode: ModeId;
  look: LookId;
  riso: RisoPrefs;
  /** Same gate as Comic / Riso. Older backups omit this → left as-is on restore. */
  unlocked?: boolean;
  categories?: CategoryConfig;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  app: "PocketMemoir";
  exportedAt: string;
  counts: { scraps: number; photos: number };
  settings: BackupSettings;
  entries: MemoirEntry[];
};

export type RestoreStrategy = "merge" | "replace";

export type ParsedBackup =
  | {
      ok: true;
      exportedAt: Date | null;
      settings: BackupSettings;
      entries: MemoirEntry[];
      photos: number;
      /** Rows in the file we couldn't read (kept out, never fatal). */
      skipped: number;
    }
  | { ok: false; reason: BackupError; message: string };

export type BackupError = "not-json" | "not-ours" | "too-new" | "broken";

const MESSAGES: Record<BackupError, string> = {
  "not-json": "That file isn't a PocketMemoir backup. Look for one named pocketmemoir-backup-….json.",
  "not-ours": "That file isn't a PocketMemoir backup. Look for one named pocketmemoir-backup-….json.",
  "too-new": "This backup came from a newer PocketMemoir. Refresh the page and try again.",
  broken: "That backup looks damaged, so nothing was changed. Try another copy.",
};

function fail(reason: BackupError): ParsedBackup {
  return { ok: false, reason, message: MESSAGES[reason] };
}

type EntryNormalizer = (raw: unknown) => MemoirEntry | null;

const isPhoto = (value: unknown): value is string =>
  typeof value === "string" && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value);

export function countPhotos(entries: readonly MemoirEntry[]) {
  return entries.reduce((n, e) => n + (e.photo ? 1 : 0), 0);
}

export function createBackup(
  data: {
    entries: readonly MemoirEntry[];
    mode: ModeId;
    look: LookId;
    riso: RisoPrefs;
    unlocked?: boolean;
    categories?: CategoryConfig;
  },
  now: Date = new Date(),
): BackupFile {
  const entries = data.entries.map((e) => ({ ...e }));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: "PocketMemoir",
    exportedAt: now.toISOString(),
    counts: { scraps: entries.length, photos: countPhotos(entries) },
    settings: {
      mode: data.mode,
      look: data.look,
      riso: { ...data.riso },
      unlocked: Boolean(data.unlocked),
      categories: normalizeCategoryConfig(data.categories),
    },
    entries,
  };
}

export function serializeBackup(backup: BackupFile) {
  return JSON.stringify(backup, null, 1);
}

/** pocketmemoir-backup-YYYY-MM-DD.json in the user's local date. */
export function backupFileName(now: Date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `pocketmemoir-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/**
 * Validate + normalize a backup file's text. Never throws. `normalizeEntry`
 * is the store's own migration so restored scraps get the same treatment as
 * saved ones.
 */
export function parseBackup(text: string, normalizeEntry: EntryNormalizer): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return fail("not-json");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("not-ours");
  const file = raw as Record<string, unknown>;
  if (file.format !== BACKUP_FORMAT) return fail("not-ours");
  if (typeof file.version !== "number" || !Number.isInteger(file.version) || file.version < 1) {
    return fail("broken");
  }
  if (file.version > BACKUP_VERSION) return fail("too-new");
  if (!Array.isArray(file.entries)) return fail("broken");

  const seen = new Set<string>();
  const entries: MemoirEntry[] = [];
  let skipped = 0;
  for (const row of file.entries) {
    const entry = normalizeEntry(row);
    if (!entry || seen.has(entry.id)) {
      skipped++;
      continue;
    }
    seen.add(entry.id);
    if (entry.photo !== undefined && !isPhoto(entry.photo)) entry.photo = undefined;
    entries.push(entry);
  }
  if (file.entries.length > 0 && entries.length === 0) return fail("broken");

  const s = (file.settings ?? {}) as Record<string, unknown>;
  const settings: BackupSettings = {
    mode: normalizeMode(s.mode),
    look: normalizeLook(s.look),
    riso: normalizeRiso(s.riso),
    unlocked: typeof s.unlocked === "boolean" ? s.unlocked : undefined,
    categories: s.categories !== undefined ? normalizeCategoryConfig(s.categories) : undefined,
  };
  const when = typeof file.exportedAt === "string" ? new Date(file.exportedAt) : null;
  return {
    ok: true,
    exportedAt: when && !Number.isNaN(when.getTime()) ? when : null,
    settings,
    entries,
    photos: countPhotos(entries),
    skipped,
  };
}

/**
 * merge: keep everything here, add scraps from the file whose id we don't have.
 * replace: the file's scraps become the whole shelf.
 */
export function planRestore(
  current: readonly MemoirEntry[],
  incoming: readonly MemoirEntry[],
  strategy: RestoreStrategy,
) {
  if (strategy === "replace") {
    return { entries: [...incoming], added: incoming.length, kept: 0, alreadyHere: 0, removed: current.length };
  }
  const have = new Set(current.map((e) => e.id));
  const fresh = incoming.filter((e) => !have.has(e.id));
  return {
    entries: [...fresh, ...current],
    added: fresh.length,
    kept: current.length,
    alreadyHere: incoming.length - fresh.length,
    removed: 0,
  };
}

/** New (non-starter) scraps since the last backup or the last "not now". */
export function scrapsSinceBackup(
  entries: readonly MemoirEntry[],
  lastBackupAt: number | null | undefined,
  dismissedAt?: number | null,
) {
  const since = Math.max(lastBackupAt ?? 0, dismissedAt ?? 0);
  return entries.filter((e) => !e.id.startsWith("seed-") && e.createdAt > since).length;
}

export function shouldNudgeBackup(
  entries: readonly MemoirEntry[],
  lastBackupAt: number | null | undefined,
  dismissedAt?: number | null,
) {
  return scrapsSinceBackup(entries, lastBackupAt, dismissedAt) >= BACKUP_NUDGE_AFTER;
}
