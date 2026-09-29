/**
 * Resolve `shelfLedeDismissed` during zustand persist merge.
 *
 * Brand-new browser (no persisted object / no flag): keep current (false) so
 * the sample-scraps shelf lede can show after hydrate.
 * Explicit boolean in save: use it.
 *
 * When `alreadyHydrated` is true, keep the live value. That guards a race where
 * hasHydrated flipped early, the user dismissed (X), then a late rehydrate merge
 * applied a stale storage read and clobbered shelfLedeDismissed.
 *
 * Dual-write flag (`pocketmemoir.shelfLedeDismissed` = "1"|"0"): on first hydrate
 * (before the alreadyHydrated guard returns), prefer this dedicated key over the
 * zustand blob. Android TWA / Play installs have seen the big `pocketmemoir.v1`
 * JSON lose or lag tip-dismiss fields across refresh — a tiny string key is more
 * durable. dismissShelfLede writes both.
 */

export const SHELF_LEDE_DISMISSED_FLAG_KEY = "pocketmemoir.shelfLedeDismissed";

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
export function writeShelfLedeDismissedFlag(
  dismissed: boolean,
  storage: FlagStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(SHELF_LEDE_DISMISSED_FLAG_KEY, dismissed ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

/**
 * Read the durable flag. Returns `true`/`false` for "1"/"0", else `null`
 * (missing or unknown value → fall through to zustand merge).
 */
export function readShelfLedeDismissedFlag(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): boolean | null {
  if (!storage) return null;
  try {
    const v = storage.getItem(SHELF_LEDE_DISMISSED_FLAG_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * @param flagFromStorage — optional override for tests; when omitted, reads
 *   `pocketmemoir.shelfLedeDismissed` from localStorage. Pass `null` to simulate
 *   no flag.
 */
export function resolveShelfLedeDismissed(
  persisted: unknown,
  currentDismissed: boolean,
  alreadyHydrated = false,
  flagFromStorage?: boolean | null,
): boolean {
  if (alreadyHydrated) return currentDismissed;

  const flag =
    flagFromStorage !== undefined ? flagFromStorage : readShelfLedeDismissedFlag();
  if (flag !== null) return flag;

  const incoming = (persisted ?? {}) as { shelfLedeDismissed?: unknown };
  if (typeof incoming.shelfLedeDismissed === "boolean") return incoming.shelfLedeDismissed;
  return currentDismissed;
}
