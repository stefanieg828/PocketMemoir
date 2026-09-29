/**
 * Resolve `tourSeen` during zustand persist merge.
 *
 * Brand-new browser (no persisted object): keep current (false) so the tour shows.
 * Explicit boolean in save: use it.
 * Pre-tour legacy save (object with shelf/settings but no tourSeen): treat as seen
 * so we don't re-nag existing users. Empty `{}` is not legacy.
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
    entries?: unknown;
    mode?: unknown;
    look?: unknown;
    jacket?: unknown;
  };

  if (typeof incoming.tourSeen === "boolean") return incoming.tourSeen;
  if (persisted == null || typeof persisted !== "object") return currentTourSeen;

  const legacy =
    Array.isArray(incoming.entries) ||
    incoming.mode != null ||
    incoming.look != null ||
    incoming.jacket != null;
  return legacy ? true : currentTourSeen;
}
