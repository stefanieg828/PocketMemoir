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
 *
 * TWA namespace: when `document.referrer` starts with `android-app://`, read/write
 * `pocketmemoir.twa.shelfLedeDismissed` instead. Chrome and the Play TWA share
 * origin localStorage, so a Chrome-era dismiss must not hide the sample-scraps
 * lede on first Play open. TWA keys start fresh — we do NOT copy Chrome dismiss
 * into the TWA namespace.
 */

import { isAndroidTwaReferrer } from "./installed-display";

export const SHELF_LEDE_DISMISSED_FLAG_KEY = "pocketmemoir.shelfLedeDismissed";
/** Play TWA / android-app referrer — isolated from Chrome tab dismissals. */
export const SHELF_LEDE_DISMISSED_TWA_FLAG_KEY = "pocketmemoir.twa.shelfLedeDismissed";

type FlagStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): FlagStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Flag key for the current shell (Chrome tab vs Play TWA). */
export function shelfLedeDismissedFlagKey(
  twa: boolean = isAndroidTwaReferrer(),
): string {
  return twa ? SHELF_LEDE_DISMISSED_TWA_FLAG_KEY : SHELF_LEDE_DISMISSED_FLAG_KEY;
}

/** Write the durable "1"/"0" flag. No-op when storage is unavailable. */
export function writeShelfLedeDismissedFlag(
  dismissed: boolean,
  storage: FlagStorage | null = defaultStorage(),
  twa: boolean = isAndroidTwaReferrer(),
): void {
  if (!storage) return;
  try {
    storage.setItem(shelfLedeDismissedFlagKey(twa), dismissed ? "1" : "0");
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
  twa: boolean = isAndroidTwaReferrer(),
): boolean | null {
  if (!storage) return null;
  try {
    const v = storage.getItem(shelfLedeDismissedFlagKey(twa));
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export type ResolveShelfLedeDismissedOptions = {
  /** Override TWA detection (tests). Defaults to android-app:// referrer. */
  twa?: boolean;
};

/**
 * @param flagFromStorage — optional override for tests; when omitted, reads the
 *   shell-scoped flag from localStorage. Pass `null` to simulate no flag.
 */
export function resolveShelfLedeDismissed(
  persisted: unknown,
  currentDismissed: boolean,
  alreadyHydrated = false,
  flagFromStorage?: boolean | null,
  options: ResolveShelfLedeDismissedOptions = {},
): boolean {
  if (alreadyHydrated) return currentDismissed;

  const twa = options.twa ?? isAndroidTwaReferrer();
  const flag =
    flagFromStorage !== undefined
      ? flagFromStorage
      : readShelfLedeDismissedFlag(undefined, twa);
  if (flag !== null) return flag;

  // Play TWA: Chrome-shared blob / pocketmemoir.shelfLedeDismissed must not
  // suppress first open. Missing TWA flag → fresh defaults (keep current).
  if (twa) return currentDismissed;

  const incoming = (persisted ?? {}) as { shelfLedeDismissed?: unknown };
  if (typeof incoming.shelfLedeDismissed === "boolean") return incoming.shelfLedeDismissed;
  return currentDismissed;
}
