/**
 * Resolve `tourSeen` during zustand persist merge.
 *
 * Brand-new browser (no persisted object): keep current (false) so the tour shows.
 * Explicit boolean in save: use it.
 *
 * Pre-tour legacy save (real prior use, but no tourSeen field): treat as seen so
 * we don't re-nag existing users. Empty `{}` is not legacy. Factory defaults alone
 * (seed scraps / mode / look / jacket) are NOT legacy — every fresh install
 * persists those, and Android TWA can drop `tourSeen` from the big
 * `pocketmemoir.v1` blob while leaving them, which wrongly skipped the tour.
 *
 * When `alreadyHydrated` is true, keep the live value. That guards a race where
 * hasHydrated flipped early, the user skipped/finished (or reset via Look), then a
 * late rehydrate merge applied a stale storage read and clobbered tourSeen.
 *
 * Dual-write flag (`pocketmemoir.tourSeen` = "1"|"0"): on first hydrate (before the
 * alreadyHydrated guard returns), prefer this dedicated key over the zustand blob.
 * Android TWA / Play installs have seen the big `pocketmemoir.v1` JSON lose or lag
 * the tourSeen field across refresh while Chrome keeps skip — a tiny string key is
 * more durable. setTourSeen (and Look → show again) writes both.
 */

export const TOUR_SEEN_FLAG_KEY = "pocketmemoir.tourSeen";

type FlagStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): FlagStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Write the durable "1"/"0" flag. No-op when storage is unavailable. */
export function writeTourSeenFlag(
  seen: boolean,
  storage: FlagStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(TOUR_SEEN_FLAG_KEY, seen ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

/**
 * Read the durable flag. Returns `true`/`false` for "1"/"0", else `null`
 * (missing or unknown value → fall through to zustand merge).
 */
export function readTourSeenFlag(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): boolean | null {
  if (!storage) return null;
  try {
    const v = storage.getItem(TOUR_SEEN_FLAG_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

/** True when the persisted shelf has at least one non-seed scrap. */
function hasNonSeedEntries(entries: unknown): boolean {
  if (!Array.isArray(entries)) return false;
  return entries.some(
    (row) =>
      Boolean(row) &&
      typeof row === "object" &&
      typeof (row as { id?: unknown }).id === "string" &&
      !(row as { id: string }).id.startsWith("seed-"),
  );
}

/**
 * Pre-tour users who already used the shelf (beyond factory seeds / defaults).
 * Seed-only + mode/look/jacket matches a fresh install after TWA drops tourSeen
 * from the blob — that must still show the tour.
 */
export function isPreTourLegacySave(persisted: unknown): boolean {
  if (persisted == null || typeof persisted !== "object") return false;
  const incoming = persisted as {
    entries?: unknown;
    unlocked?: unknown;
    lastBackupAt?: unknown;
    backupNudgeDismissedAt?: unknown;
    pageStickers?: unknown;
    suggestions?: unknown;
    shelfLedeDismissed?: unknown;
    corkWallTipDismissed?: unknown;
    a2hsTipDismissed?: unknown;
    categories?: unknown;
  };

  if (hasNonSeedEntries(incoming.entries)) return true;
  if (incoming.unlocked === true) return true;
  if (typeof incoming.lastBackupAt === "number") return true;
  if (typeof incoming.backupNudgeDismissedAt === "number") return true;
  if (Array.isArray(incoming.pageStickers) && incoming.pageStickers.length > 0) return true;
  if (Array.isArray(incoming.suggestions) && incoming.suggestions.length > 0) return true;
  if (incoming.shelfLedeDismissed === true) return true;
  if (incoming.corkWallTipDismissed === true) return true;
  if (incoming.a2hsTipDismissed === true) return true;

  const cats = incoming.categories;
  if (cats && typeof cats === "object") {
    const c = cats as {
      customs?: unknown;
      names?: unknown;
    };
    if (Array.isArray(c.customs) && c.customs.length > 0) return true;
    if (c.names && typeof c.names === "object" && Object.keys(c.names).length > 0) return true;
  }

  return false;
}

/**
 * @param flagFromStorage — optional override for tests; when omitted, reads
 *   `pocketmemoir.tourSeen` from localStorage. Pass `null` to simulate no flag.
 */
export function resolveTourSeen(
  persisted: unknown,
  currentTourSeen: boolean,
  alreadyHydrated = false,
  flagFromStorage?: boolean | null,
): boolean {
  if (alreadyHydrated) return currentTourSeen;

  const flag =
    flagFromStorage !== undefined ? flagFromStorage : readTourSeenFlag();
  if (flag !== null) return flag;

  const incoming = (persisted ?? {}) as {
    tourSeen?: unknown;
  };

  if (typeof incoming.tourSeen === "boolean") return incoming.tourSeen;
  if (persisted == null || typeof persisted !== "object") return currentTourSeen;

  return isPreTourLegacySave(persisted) ? true : currentTourSeen;
}
