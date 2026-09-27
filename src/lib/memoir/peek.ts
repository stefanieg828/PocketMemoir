/**
 * Peek share: a read-only snapshot a friend can browse without merging into
 * their album or stealing unlock. Distinct from pocketmemoir-backup so
 * "Open a peek" never calls restore. Pure functions only — unit-tested in
 * scripts/peek.test.mjs.
 */
import {
  normalizeCategoryConfig,
  type CategoryConfig,
} from "./categories.ts";
import { normalizeRiso } from "./looks.ts";
import { normalizePageStickers, type PlacedSticker } from "./stickers.ts";
import type { LookId, MemoirEntry, ModeId, RisoPrefs } from "./types.ts";
import { normalizeLook, normalizeMode } from "./types.ts";

export const PEEK_KIND = "pocketmemoir-peek";
export const PEEK_VERSION = 1;

export type PeekLook = {
  mode: ModeId;
  look: LookId;
  riso: RisoPrefs;
  categories?: CategoryConfig;
};

export type PeekFile = {
  kind: typeof PEEK_KIND;
  version: number;
  app: "PocketMemoir";
  createdAt: string;
  mode: ModeId;
  look: LookId;
  riso: RisoPrefs;
  categories: CategoryConfig;
  entries: MemoirEntry[];
  counts: { scraps: number; photos: number };
  /** Optional decorative stickers (v1+ optional; older peeks omit). */
  pageStickers?: PlacedSticker[];
};

export type ParsedPeek =
  | {
      ok: true;
      createdAt: Date | null;
      mode: ModeId;
      look: LookId;
      riso: RisoPrefs;
      categories: CategoryConfig;
      entries: MemoirEntry[];
      photos: number;
      skipped: number;
      pageStickers: PlacedSticker[];
    }
  | { ok: false; reason: PeekError; message: string };

export type PeekError = "not-json" | "not-ours" | "too-new" | "broken" | "is-backup";

const MESSAGES: Record<PeekError, string> = {
  "not-json": "that file isn’t a peek. look for one named pocketmemoir-peek-….json.",
  "not-ours": "that file isn’t a peek. look for one named pocketmemoir-peek-….json.",
  "too-new": "this peek came from a newer pocketmemoir. refresh the page and try again.",
  broken: "that peek looks damaged, so nothing was opened. try another copy.",
  "is-backup":
    "that’s a full backup, not a peek. use restore from a file under keep them safe if you meant to bring scraps into your album.",
};

type EntryNormalizer = (raw: unknown) => MemoirEntry | null;

const isPhoto = (value: unknown): value is string =>
  typeof value === "string" &&
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value);

export function countPeekPhotos(entries: readonly MemoirEntry[]) {
  return entries.reduce((n, e) => n + (e.photo ? 1 : 0), 0);
}

/**
 * Build a peek payload. Never includes unlocked — peek cannot grant unlock.
 */
export function createPeek(
  data: {
    entries: readonly MemoirEntry[];
    mode: ModeId;
    look: LookId;
    riso: RisoPrefs;
    categories?: CategoryConfig;
    pageStickers?: readonly PlacedSticker[];
  },
  now: Date = new Date(),
): PeekFile {
  const entries = data.entries.map((e) => ({ ...e }));
  const pageStickers = normalizePageStickers(data.pageStickers);
  return {
    kind: PEEK_KIND,
    version: PEEK_VERSION,
    app: "PocketMemoir",
    createdAt: now.toISOString(),
    mode: data.mode,
    look: data.look,
    riso: { ...data.riso },
    categories: normalizeCategoryConfig(data.categories),
    entries,
    counts: { scraps: entries.length, photos: countPeekPhotos(entries) },
    ...(pageStickers.length ? { pageStickers } : {}),
  };
}

export function serializePeek(peek: PeekFile) {
  return JSON.stringify(peek, null, 1);
}

/** pocketmemoir-peek-YYYY-MM-DD.json in the user's local date. */
export function peekFileName(now: Date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `pocketmemoir-peek-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

function fail(reason: PeekError): ParsedPeek {
  return { ok: false, reason, message: MESSAGES[reason] };
}

/**
 * Validate + normalize a peek file's text. Never throws. Rejects backup files
 * with a distinct reason so Open peek ≠ Restore backup.
 */
export function parsePeek(text: string, normalizeEntry: EntryNormalizer): ParsedPeek {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return fail("not-json");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("not-ours");
  const file = raw as Record<string, unknown>;

  if (file.format === "pocketmemoir-backup") return fail("is-backup");
  if (file.kind !== PEEK_KIND) return fail("not-ours");
  if (typeof file.version !== "number" || !Number.isInteger(file.version) || file.version < 1) {
    return fail("broken");
  }
  if (file.version > PEEK_VERSION) return fail("too-new");
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

  const when = typeof file.createdAt === "string" ? new Date(file.createdAt) : null;
  return {
    ok: true,
    createdAt: when && !Number.isNaN(when.getTime()) ? when : null,
    mode: normalizeMode(file.mode),
    look: normalizeLook(file.look),
    riso: normalizeRiso(file.riso),
    categories: normalizeCategoryConfig(file.categories),
    entries,
    photos: countPeekPhotos(entries),
    skipped,
    pageStickers: normalizePageStickers(file.pageStickers),
  };
}

/** Peek must never carry or apply unlock. */
export function peekHasUnlockField(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  return Object.prototype.hasOwnProperty.call(raw, "unlocked");
}
