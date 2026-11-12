/**
 * GA4 signals for the Play / Trusted Web Activity shell.
 *
 * Detection reuses `isTwaSession()` (see play-billing.ts):
 * - `document.referrer` starts with `android-app://` on the Play launch
 *   navigation (package `fun.pocketmemoir.app` → `android-app://fun.pocketmemoir.app`).
 * - That referrer is only present on the first document of the tab, so the
 *   helper latches `sessionStorage` `pm.twaSession` for later loads in the
 *   same WebView (reload, in-app full navigation).
 * Home-screen PWAs (`display-mode: standalone` / iOS) are website sessions.
 * They hide the A2HS tip via `isRunningAsInstalledApp`, but they are not Play.
 *
 * Once per install: `pocketmemoir.twa.playAppFirstOpen` = "1".
 * Same durability idea as tourSeen — a tiny string key, not a field on the
 * `pocketmemoir.v1` zustand blob. Android TWA has dropped or lagged fields
 * inside that blob across refresh; a one-character key survives. Chrome and
 * the Play app share origin localStorage, so the key is TWA-namespaced and
 * we never copy a Chrome value in. Only the exact string "1" counts. A late
 * zustand rehydrate cannot clobber it, because nothing else reads or writes
 * this key. The flag is written synchronously after `play_app_first_open` is
 * queued, and only when analytics is actually enabled — a build with no
 * Measurement ID must not consume the one-shot. If storage throws (private
 * mode / quota), the event still queues and the next launch tries again.
 */

import {
  GA_APP_SOURCE,
  GA_APP_SOURCE_KEY,
  GA_EVENTS,
  initAnalytics,
  isAnalyticsEnabled,
  trackEvent,
  type GaAppSource,
  type GaEnv,
} from "@/lib/memoir/analytics";
import { isTwaSession } from "@/lib/memoir/play-billing";

/** Play TWA only. Chrome visits must not set or satisfy this flag. */
export const PLAY_APP_FIRST_OPEN_FLAG_KEY = "pocketmemoir.twa.playAppFirstOpen";

type FlagStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): FlagStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * True only when the durable flag is the exact string "1".
 * Missing, "0", or any other value → not yet fired (fall through, like a
 * tourSeen flag that isn't a known "1"/"0").
 */
export function readPlayAppFirstOpenFlag(
  storage: FlagStorage | null | undefined = undefined,
): boolean {
  const store = storage === undefined ? defaultStorage() : storage;
  if (!store) return false;
  try {
    return store.getItem(PLAY_APP_FIRST_OPEN_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

/** Write "1". Returns false when storage is missing or the write does not stick. */
export function writePlayAppFirstOpenFlag(
  storage: FlagStorage | null | undefined = undefined,
): boolean {
  const store = storage === undefined ? defaultStorage() : storage;
  if (!store) return false;
  try {
    store.setItem(PLAY_APP_FIRST_OPEN_FLAG_KEY, "1");
    return store.getItem(PLAY_APP_FIRST_OPEN_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export type ReportPlayAppAnalyticsOptions = {
  /** Defaults to Vite env. Tests pass an explicit bag. */
  env?: GaEnv;
  /**
   * Override TWA detection (tests). Omit to use `isTwaSession()`
   * (android-app:// referrer, then the sessionStorage latch).
   */
  inTwa?: boolean;
  /**
   * Override for tests. Omit to use localStorage.
   * `null` simulates storage unavailable: events still queue, flag is not saved.
   */
  storage?: FlagStorage | null;
};

export type PlayAppAnalyticsResult = {
  /** True when this call queued the user property (and any Play events). */
  sent: boolean;
  source: GaAppSource | null;
  /** True when `play_app_first_open` was queued on this call. */
  firstOpen: boolean;
  /** True when `play_app_open` was queued on this call. */
  open: boolean;
};

const idle: PlayAppAnalyticsResult = {
  sent: false,
  source: null,
  firstOpen: false,
  open: false,
};

/** One report per document load so React strict-mode remounts don't double-count. */
let reportedThisDocument = false;

/** Test helper — allow another document-load report in the same module instance. */
export function __resetPlayAppAnalyticsForTests() {
  reportedThisDocument = false;
}

function storageFrom(options: ReportPlayAppAnalyticsOptions): FlagStorage | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(options, "storage")) return undefined;
  return options.storage ?? null;
}

/**
 * Once per page load: set user property `app_source` to `play_twa` or `web`.
 * In the Play/TWA shell, also queue `play_app_open`, and on the first such
 * open on this device queue `play_app_first_open` (param `app_source: play_twa`).
 *
 * No-op when the Measurement ID is missing or there is no window — and in
 * that case the first-open flag is left unset. A second call in the same
 * document does not send again.
 */
export function reportPlayAppAnalytics(
  options: ReportPlayAppAnalyticsOptions = {},
): PlayAppAnalyticsResult {
  const env = options.env;
  if (!isAnalyticsEnabled(env) || typeof window === "undefined") return { ...idle };
  if (reportedThisDocument) return { ...idle };

  const inTwa = options.inTwa !== undefined ? options.inTwa : isTwaSession();
  const source = inTwa ? GA_APP_SOURCE.playTwa : GA_APP_SOURCE.web;
  const ready = initAnalytics(env, { [GA_APP_SOURCE_KEY]: source });
  if (!ready) return { ...idle };
  reportedThisDocument = true;

  let firstOpen = false;
  let open = false;
  if (inTwa) {
    const storage = storageFrom(options);
    // Queue first, then persist. A failed write retries next launch; a
    // successful write before the next line means a crash cannot duplicate
    // the one-shot if play_app_open hasn't flushed yet.
    if (!readPlayAppFirstOpenFlag(storage)) {
      trackEvent(GA_EVENTS.playAppFirstOpen, { [GA_APP_SOURCE_KEY]: source }, env);
      writePlayAppFirstOpenFlag(storage);
      firstOpen = true;
    }
    trackEvent(GA_EVENTS.playAppOpen, { [GA_APP_SOURCE_KEY]: source }, env);
    open = true;
  }

  return { sent: true, source, firstOpen, open };
}
