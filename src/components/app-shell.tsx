import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { A2hsTip } from "@/components/a2hs-tip";
import { AnalyticsListener } from "@/components/analytics-listener";
import { BackupNudge } from "@/components/backup-nudge";
import { TourOverlay } from "@/components/tour-overlay";
import { LookPicker } from "@/components/look-picker";
import { UnlockSheet } from "@/components/unlock-sheet";
import { KeepSeal } from "@/components/keep-seal";
import { PeekBanner } from "@/components/peek-banner";
import { Wordmark } from "@/components/wordmark";
import { TAGLINE } from "@/lib/memoir/copy";
import { applyThemeToDocument } from "@/lib/memoir/looks";
import { useIsPeeking, usePeekSession } from "@/lib/memoir/peek-session";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import {
  consumePreviewUnlockFlag,
  readUnlockSuccessFromUrl,
  stripUnlockSuccessParams,
} from "@/lib/memoir/unlock";
import {
  getPlayBillingService,
  restoreBigScraps,
} from "@/lib/memoir/play-billing";
import { GA_EVENTS, trackEvent } from "@/lib/memoir/analytics";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onKeep = pathname.startsWith("/keep");
  const setHasHydrated = useMemoir((s) => s.setHasHydrated);
  const mode = useMemoir((s) => s.mode);
  const look = useMemoir((s) => s.look);
  const riso = useMemoir((s) => s.riso);
  const peeking = useIsPeeking();
  const peekMode = usePeekSession((s) => s.mode);
  const peekLook = usePeekSession((s) => s.look);
  const peekRiso = usePeekSession((s) => s.riso);
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const openPickerAt = usePickerUi((s) => s.openAt);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setHasHydrated(true);
    };
    // Do not mark hydrated until persist.rehydrate() / onFinishHydration settle.
    // A former 200ms timeout flipped hasHydrated early → TourOverlay opened with
    // default tourSeen:false; skip wrote true; then late merge applied a stale
    // storage read (tourSeen:false) and clobbered the skip. Result: tour every refresh.
    const unsub = useMemoir.persist.onFinishHydration(finish);
    if (useMemoir.persist.hasHydrated()) {
      finish();
    } else {
      void Promise.resolve(useMemoir.persist.rehydrate()).then(finish, finish);
    }
    return () => {
      cancelled = true;
      unsub();
    };
  }, [setHasHydrated]);

  useEffect(() => {
    if (peeking) applyThemeToDocument(peekMode, peekLook, peekRiso);
    else applyThemeToDocument(mode, look, riso);
  }, [peeking, peekMode, peekLook, peekRiso, mode, look, riso]);

  // Stripe success URL (or manual ?unlocked=1) — no webhook needed yet.
  useEffect(() => {
    if (!hasHydrated) return;
    // Allow ?previewUnlock=1 to arm a session testing flag even before opening the sheet.
    consumePreviewUnlockFlag();
    if (!readUnlockSuccessFromUrl()) return;
    trackEvent(GA_EVENTS.unlockSuccess);
    stripUnlockSuccessParams();
    if (!unlocked) {
      setUnlocked(true);
      toast.success("you're unlocked");
    }
  }, [hasHydrated, unlocked, setUnlocked]);

  // Play Billing restore (TWA Digital Goods) — same setUnlocked(true) as Stripe.
  useEffect(() => {
    if (!hasHydrated || unlocked) return;
    let cancelled = false;
    void (async () => {
      const service = await getPlayBillingService();
      if (!service || cancelled) return;
      const owned = await restoreBigScraps(service);
      if (cancelled || !owned) return;
      setUnlocked(true);
      trackEvent(GA_EVENTS.unlockSuccess);
      toast.success("you're unlocked");
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, unlocked, setUnlocked]);

  return (
    <div
      className={cn(
        "app-frame relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-32 pt-5 sm:px-6 sm:pb-16 sm:pt-7",
        peeking && "is-peeking",
      )}
    >
      <AnalyticsListener />
      <PeekBanner />
      <header className="app-header flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Wordmark />
          <p className="app-tagline mt-1 max-w-sm text-sm leading-relaxed">{TAGLINE}</p>
          <nav className="app-nav mt-3" aria-label="Main">
            <NavLink to="/" active={pathname === "/"}>
              Shelf
            </NavLink>
            <NavLink to="/calendar" active={pathname.startsWith("/calendar")}>
              Calendar
            </NavLink>
            <LookPicker />
          </nav>
        </div>
        {!onKeep && !peeking ? (
          <div className="hidden pt-1 sm:block">
            <KeepSeal toKeep size="md" />
          </div>
        ) : null}
      </header>

      <main className="flex-1 pt-7">
        {pathname === "/" && !peeking ? (
          <>
            <A2hsTip />
            <BackupNudge />
          </>
        ) : null}
        {children}
      </main>

      <footer className="app-footer mt-12 pt-4 pr-24 text-center text-xs sm:pr-0">
        Lives in this browser.{" "}
        <button type="button" className="footer-link" onClick={() => openPickerAt("backup")}>
          Keep a copy
        </button>
      </footer>

      {!onKeep && !peeking ? (
        <div className="pointer-events-none fixed right-4 bottom-5 z-30 sm:hidden">
          <div className="pointer-events-auto">
            <KeepSeal toKeep size="lg" />
          </div>
        </div>
      ) : null}

      {!peeking ? <TourOverlay /> : null}
      {!peeking ? <UnlockSheet /> : null}

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          classNames: {
            toast: "app-toast",
          },
        }}
      />
    </div>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: "/" | "/calendar";
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      search={to === "/" ? {} : undefined}
      aria-current={active ? "page" : undefined}
      className={cn("app-nav-link no-underline", active && "is-active")}
    >
      {children}
    </Link>
  );
}
