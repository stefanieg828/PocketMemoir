import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { BackupNudge } from "@/components/backup-nudge";
import { TourOverlay } from "@/components/tour-overlay";
import { LookPicker } from "@/components/look-picker";
import { KeepSeal } from "@/components/keep-seal";
import { Wordmark } from "@/components/wordmark";
import { TAGLINE } from "@/lib/memoir/copy";
import { applyThemeToDocument } from "@/lib/memoir/looks";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onKeep = pathname.startsWith("/keep");
  const setHasHydrated = useMemoir((s) => s.setHasHydrated);
  const mode = useMemoir((s) => s.mode);
  const look = useMemoir((s) => s.look);
  const riso = useMemoir((s) => s.riso);
  const openPickerAt = usePickerUi((s) => s.openAt);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setHasHydrated(true);
    };
    const unsub = useMemoir.persist.onFinishHydration(finish);
    if (useMemoir.persist.hasHydrated()) {
      finish();
    } else {
      void Promise.resolve(useMemoir.persist.rehydrate()).then(finish, finish);
    }
    const timer = window.setTimeout(finish, 200);
    return () => {
      cancelled = true;
      unsub();
      window.clearTimeout(timer);
    };
  }, [setHasHydrated]);

  useEffect(() => {
    applyThemeToDocument(mode, look, riso);
  }, [mode, look, riso]);

  return (
    <div className="app-frame relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-32 pt-5 sm:px-6 sm:pb-16 sm:pt-7">
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
        {!onKeep ? (
          <div className="hidden pt-1 sm:block">
            <KeepSeal toKeep size="md" />
          </div>
        ) : null}
      </header>

      <main className="flex-1 pt-7">
        {pathname === "/" ? <BackupNudge /> : null}
        {children}
      </main>

      <footer className="app-footer mt-12 pt-4 pr-24 text-center text-xs sm:pr-0">
        Lives in this browser.{" "}
        <button type="button" className="footer-link" onClick={() => openPickerAt("backup")}>
          Keep a copy
        </button>
      </footer>

      {!onKeep ? (
        <div className="pointer-events-none fixed right-4 bottom-5 z-30 sm:hidden">
          <div className="pointer-events-auto">
            <KeepSeal toKeep size="lg" />
          </div>
        </div>
      ) : null}

      <TourOverlay />

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
