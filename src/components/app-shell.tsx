import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { JacketPicker } from "@/components/jacket-picker";
import { KeepSeal } from "@/components/keep-seal";
import { Wordmark } from "@/components/wordmark";
import { TAGLINE } from "@/lib/memoir/copy";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onKeep = pathname.startsWith("/keep");
  const setHasHydrated = useMemoir((s) => s.setHasHydrated);
  const jacket = useMemoir((s) => s.jacket);

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
    document.documentElement.dataset.jacket = jacket;
  }, [jacket]);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-32 pt-5 sm:px-6 sm:pb-16 sm:pt-7">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Wordmark />
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{TAGLINE}</p>
          <nav className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <NavLink to="/" active={pathname === "/"}>
              Shelf
            </NavLink>
            <NavLink to="/calendar" active={pathname.startsWith("/calendar")}>
              Calendar
            </NavLink>
            <JacketPicker />
          </nav>
        </div>
        {!onKeep ? (
          <div className="hidden pt-1 sm:block">
            <KeepSeal toKeep size="md" />
          </div>
        ) : null}
      </header>

      <main className="flex-1 pt-8">{children}</main>

      <footer className="mt-12 border-t border-ink/10 pt-4 pr-24 text-center text-xs text-faint sm:pr-0">
        Lives in this browser. Disappear for three months if you want.
      </footer>

      {!onKeep ? (
        <div className="pointer-events-none fixed right-4 bottom-5 z-30 sm:hidden">
          <div className="pointer-events-auto">
            <KeepSeal toKeep size="lg" />
          </div>
        </div>
      ) : null}

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          classNames: {
            toast: "border-[3px] border-ink bg-card font-display text-ink shadow-paper rounded-xl",
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
      className={cn(
        "font-display inline-flex min-h-11 items-center text-base no-underline",
        active ? "text-ink underline decoration-washi decoration-[3px] underline-offset-[6px]" : "text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
