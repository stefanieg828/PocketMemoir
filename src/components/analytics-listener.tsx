import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  initAnalytics,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/memoir/analytics";

/**
 * Soft GA4 bootstrap + SPA page_view on TanStack Router navigations.
 * Renders nothing. No-op when `VITE_GA_MEASUREMENT_ID` is unset.
 */
export function AnalyticsListener() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
