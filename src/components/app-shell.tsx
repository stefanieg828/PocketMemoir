import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import {
  readCheckoutSessionFromUrl,
  restorePurchaseByEmail,
  verifyCheckoutSession,
} from "@/lib/memoir/unlock-token";
import { A2hsTip } from "@/components/a2hs-tip";
import { AnalyticsListener } from "@/components/analytics-listener";
import { CloudWelcome } from "@/components/cloud-backup";
import { startCloudBackup } from "@/lib/memoir/cloud-backup";
import { BackupNudge } from "@/components/backup-nudge";
import { HintLayer } from "@/components/hint-layer";
import { WhatsNewCard } from "@/components/whats-new-card";
import { TourOverlay } from "@/components/tour-overlay";
import { LookPicker } from "@/components/look-picker";
import { UnlockSheet } from "@/components/unlock-sheet";
import { KeepSeal } from "@/components/keep-seal";
import { PeekBanner } from "@/components/peek-banner";
import { Wordmark } from "@/components/wordmark";
import { TAGLINE } from "@/lib/memoir/copy";
import { applyThemeToDocument } from "@/lib/memoir/looks";
import { applyReadingToDocument } from "@/lib/memoir/reading";
import { useIsPeeking, usePeekSession } from "@/lib/memoir/peek-session";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import {
  consumePreviewUnlockFlag,
  readUnlockSuccessFromUrl,
  stripUnlockSuccessParams,
  stripSessionIdParam,
} from "@/lib/memoir/unlock";
import {
  getPlayBillingService,
  isTwaSession,
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
  const textSize = useMemoir((s) => s.textSize);
  const boldText = useMemoir((s) => s.boldText);
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const setUnlockToken = useMemoir((s) => s.setUnlockToken);
  const setUnlockEmail = useMemoir((s) => s.setUnlockEmail);
  const unlockEmail = useMemoir((s) => s.unlockEmail);
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

  // Reading comfort is always the viewer's own (even while peeking). Wait for
  // hydrate so store defaults never overwrite what THEME_BOOT already applied.
  useEffect(() => {
    if (!hasHydrated) return;
    applyReadingToDocument(textSize, boldText);
  }, [hasHydrated, textSize, boldText]);

  // Stripe success URL (or manual ?unlocked=1) — no webhook needed yet.
  useEffect(() => {
    if (!hasHydrated) return;
    // Allow ?previewUnlock=1 to arm a session testing flag even before opening the sheet.
    consumePreviewUnlockFlag();
    if (!readUnlockSuccessFromUrl()) return;
    // Bare ?unlock=success is no longer trusted: verify the Stripe Checkout Session.
    const sid = readCheckoutSessionFromUrl();
    stripUnlockSuccessParams();
    stripSessionIdParam();
    if (!sid) {
      if (!unlocked) toast("already paid? open unlock → restore purchase with your checkout email.");
      return;
    }
    void (async () => {
      const res = await verifyCheckoutSession(sid);
      if (res.ok) {
        const was = useMemoir.getState().unlocked;
        setUnlockToken(res.token);
        if (res.email) setUnlockEmail(res.email);
        trackEvent(GA_EVENTS.unlockSuccess);
        if (!was) toast.success("you're unlocked");
      } else if (!useMemoir.getState().unlocked) {
        toast.error("couldn't confirm that payment yet", {
          description: `${res.error} · you can also use restore purchase in the unlock sheet.`,
        });
      }
    })();
  }, [hasHydrated, unlocked, setUnlockToken, setUnlockEmail]);

  // Ask the browser to keep our storage (helps iOS / Chrome not evict the unlock).
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      void navigator.storage?.persist?.().catch(() => undefined);
    } catch {
      /* unsupported */
    }
    startCloudBackup();
  }, [hasHydrated]);

  // Quiet auto-restore: unlock missing but we remember the checkout email.
  // Once per tab session so we never burn the verifier's 5/hour email limit.
  useEffect(() => {
    if (!hasHydrated || unlocked || !unlockEmail) return;
    try {
      if (sessionStorage.getItem("pm.autoRestoreTried") === unlockEmail) return;
      sessionStorage.setItem("pm.autoRestoreTried", unlockEmail);
    } catch {
      /* ignore */
    }
    let cancelled = false;
    void (async () => {
      const res = await restorePurchaseByEmail(unlockEmail);
      if (cancelled || !res.ok || useMemoir.getState().unlocked) return;
      setUnlockToken(res.token);
      trackEvent(GA_EVENTS.unlockSuccess);
      toast.success("welcome back — big scraps restored");
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, unlocked, unlockEmail, setUnlockToken]);

  // Play Billing restore (TWA Digital Goods) — same setUnlocked(true) as Stripe.
  useEffect(() => {
    // Remember the TWA launch (referrer is only android-app:// on the first load).
    isTwaSession();
  }, []);

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
            <WhatsNewCard />
            <A2hsTip />
            <CloudWelcome />
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
      <HintLayer />

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
