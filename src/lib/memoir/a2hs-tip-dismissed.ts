/**
 * Resolve `a2hsTipDismissed` during zustand persist merge.
 *
 * Brand-new browser (no persisted object / no flag): keep current (false) so
 * the soft Add-to-Home tip can show after the tour.
 * Explicit boolean in save: use it.
 *
 * When `alreadyHydrated` is true, keep the live value. That guards a race where
 * hasHydrated flipped early, the user dismissed (X), then a late rehydrate merge
 * applied a stale storage read and clobbered a2hsTipDismissed.
 *
 * Dual-write flag (`pocketmemoir.a2hsTipDismissed` = "1"|"0"): on first hydrate
 * (before the alreadyHydrated guard returns), prefer this dedicated key over the
 * zustand blob. Android TWA / Play installs have seen the big `pocketmemoir.v1`
 * JSON lose or lag tip-dismiss fields across refresh — a tiny string key is more
 * durable. dismissA2hsTip writes both.
 */

export const A2HS_TIP_DISMISSED_FLAG_KEY = "pocketmemoir.a2hsTipDismissed";

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
export function writeA2hsTipDismissedFlag(
  dismissed: boolean,
  storage: FlagStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(A2HS_TIP_DISMISSED_FLAG_KEY, dismissed ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

/**
 * Read the durable flag. Returns `true`/`false` for "1"/"0", else `null`
 * (missing or unknown value → fall through to zustand merge).
 */
export function readA2hsTipDismissedFlag(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): boolean | null {
  if (!storage) return null;
  try {
    const v = storage.getItem(A2HS_TIP_DISMISSED_FLAG_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * @param flagFromStorage — optional override for tests; when omitted, reads
 *   `pocketmemoir.a2hsTipDismissed` from localStorage. Pass `null` to simulate
 *   no flag.
 */
export function resolveA2hsTipDismissed(
  persisted: unknown,
  currentDismissed: boolean,
  alreadyHydrated = false,
  flagFromStorage?: boolean | null,
): boolean {
  if (alreadyHydrated) return currentDismissed;

  const flag =
    flagFromStorage !== undefined ? flagFromStorage : readA2hsTipDismissedFlag();
  if (flag !== null) return flag;

  const incoming = (persisted ?? {}) as { a2hsTipDismissed?: unknown };
  if (typeof incoming.a2hsTipDismissed === "boolean") return incoming.a2hsTipDismissed;
  return currentDismissed;
}
