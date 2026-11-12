import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isAnalyticsEnabled, trackPageView } from "@/lib/memoir/analytics";
import { reportPlayAppAnalytics } from "@/lib/memoir/play-app-analytics";

/**
 * Soft GA4 bootstrap + SPA page_view on TanStack Router navigations.
 * Renders nothing. No-op when `VITE_GA_MEASUREMENT_ID` is unset.
 *
 * On each document load, before the first page_view: user property
 * `app_source` (`play_twa` inside the Play TWA, otherwise `web`). Play
 * launches also send `play_app_open`, and the first one on the device sends
 * `play_app_first_open`. In-app route changes do not repeat those.
 */
export function AnalyticsListener() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Sets app_source (and Play events) before the page_view effect below.
    reportPlayAppAnalytics();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    // If this effect ever runs first, source is still applied before page_view.
    // reportPlayAppAnalytics is once per document, so this does not double-send.
    reportPlayAppAnalytics();
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
