/**
 * Detect "already running as an installed app" so A2HS / install tips stay hidden.
 *
 * Covers:
 * - PWA display-mode: standalone | fullscreen | minimal-ui
 * - iOS Safari home-screen (`navigator.standalone`)
 * - Android Trusted Web Activity / Play wrapper (`document.referrer` starts with
 *   `android-app://`) — some TWA sessions report browser display-mode briefly or
 *   after reinstall while still launched from the Play package
 */

type MatchMediaLike = (query: string) => { matches: boolean };

export type InstalledDisplayEnv = {
  matchMedia?: MatchMediaLike;
  /** iOS `navigator.standalone` */
  navigatorStandalone?: boolean;
  /** `document.referrer` */
  referrer?: string;
};

function defaultMatchMedia(): MatchMediaLike | null {
  if (typeof window === "undefined") return null;
  return (q) => window.matchMedia(q);
}

/**
 * True when launched from an Android TWA / Play package
 * (`document.referrer` starts with `android-app://`).
 *
 * Used to namespace tour / shelf-lede dismiss flags so Chrome tab dismissals for
 * the same origin (shared cookie + localStorage partition) do not suppress the
 * first-open tour + sample-scraps lede inside the Play app.
 */
export function isAndroidTwaReferrer(referrer?: string): boolean {
  const r =
    referrer !== undefined
      ? referrer
      : typeof document !== "undefined"
        ? document.referrer
        : "";
  return typeof r === "string" && r.startsWith("android-app://");
}

/**
 * True when the page is already in an installed / TWA / home-screen shell.
 * Pure aside from optional env overrides (for tests).
 */
export function isRunningAsInstalledApp(env: InstalledDisplayEnv = {}): boolean {
  const mm = env.matchMedia ?? defaultMatchMedia();
  const displayStandalone = Boolean(
    mm?.("(display-mode: standalone)").matches ||
      mm?.("(display-mode: fullscreen)").matches ||
      mm?.("(display-mode: minimal-ui)").matches,
  );

  const iosStandalone =
    env.navigatorStandalone !== undefined
      ? env.navigatorStandalone
      : typeof navigator !== "undefined" &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const referrer =
    env.referrer !== undefined
      ? env.referrer
      : typeof document !== "undefined"
        ? document.referrer
        : "";
  const twaFromReferrer = isAndroidTwaReferrer(referrer);

  return displayStandalone || iosStandalone || twaFromReferrer;
}
