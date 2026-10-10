/**
 * Soft Google Analytics 4 for Pocket Memoir.
 *
 * Off unless `VITE_GA_MEASUREMENT_ID` is set at build time (e.g. a `G-` Measurement ID).
 * Never hardcode a measurement ID — Stefanie creates the GA4 property for
 * pocketmemoir.fun and adds the ID as a GitHub Actions secret / local `.env`.
 *
 * Privacy-light: no scrap content, emails, or other PII in events.
 */

export const GA_MEASUREMENT_ENV = "VITE_GA_MEASUREMENT_ID";

/** Custom event names (engagement → Events in GA4). */
export const GA_EVENTS = {
  unlockSuccess: "unlock_success",
  tourComplete: "tour_complete",
  tourSkip: "tour_skip",
  a2hsDismiss: "a2hs_dismiss",
} as const;

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

type GaEnv = { [GA_MEASUREMENT_ENV]?: string | undefined };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let scriptRequested = false;

/** Read Measurement ID from a Vite-style env bag (empty → analytics off). */
export function readGaMeasurementId(env: GaEnv = viteEnv()): string {
  return String(env?.[GA_MEASUREMENT_ENV] ?? "").trim();
}

export function isAnalyticsEnabled(env: GaEnv = viteEnv()): boolean {
  return readGaMeasurementId(env).length > 0;
}

/**
 * Redact scrap ids from SPA paths so page views stay privacy-light.
 * `/kept/abc123` → `/kept/:id`
 */
export function analyticsPath(pathname: string): string {
  const path = pathname || "/";
  if (path.startsWith("/kept/")) return "/kept/:id";
  return path;
}

/**
 * Load gtag.js once when a Measurement ID is present. No-op when unset,
 * on the server, or after the first successful request.
 */
export function initAnalytics(env: GaEnv = viteEnv()): boolean {
  const id = readGaMeasurementId(env);
  if (!id || typeof window === "undefined") return false;
  if (scriptRequested) return true;
  scriptRequested = true;

  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag !== "function") {
    // gtag.js only reads real `arguments` objects from dataLayer; pushing a
    // plain array (rest args) is silently ignored and no hits are sent.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    } as (...args: unknown[]) => void;
  }

  // SPA: send page_view ourselves on route changes (see AnalyticsListener).
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false, anonymize_ip: true });

  const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }
  return true;
}

/** Fire a named custom event. No-op when analytics is off. */
export function trackEvent(
  name: GaEventName | string,
  params?: Record<string, string | number | boolean>,
  env: GaEnv = viteEnv(),
): void {
  if (!isAnalyticsEnabled(env) || typeof window === "undefined") return;
  initAnalytics(env);
  window.gtag?.("event", name, params ?? {});
}

/** Manual page_view for SPA navigations. */
export function trackPageView(
  pathname: string,
  env: GaEnv = viteEnv(),
): void {
  if (!isAnalyticsEnabled(env) || typeof window === "undefined") return;
  initAnalytics(env);
  const page_path = analyticsPath(pathname);
  window.gtag?.("event", "page_view", { page_path });
}

/** Test helper — reset module load flag between node tests. */
export function __resetAnalyticsForTests() {
  scriptRequested = false;
}

function viteEnv(): GaEnv {
  if (typeof import.meta === "undefined") return {};
  return (import.meta.env ?? {}) as GaEnv;
}
