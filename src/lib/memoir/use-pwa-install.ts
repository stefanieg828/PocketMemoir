import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isRunningAsInstalledApp } from "@/lib/memoir/installed-display";

/** Chromium's deferred install event (not in lib.dom yet everywhere). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallSnap = {
  standalone: boolean;
  ios: boolean;
  deferred: BeforeInstallPromptEvent | null;
  choice: "accepted" | "dismissed" | null;
};

function readStandalone(): boolean {
  return isRunningAsInstalledApp();
}

function readIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports as Mac; touch points distinguish it.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

const listeners = new Set<() => void>();
let snap: InstallSnap = {
  standalone: false,
  ios: false,
  deferred: null,
  choice: null,
};
let wired = false;

function emit() {
  for (const l of listeners) l();
}

function setSnap(patch: Partial<InstallSnap>) {
  snap = { ...snap, ...patch };
  emit();
}

function ensureWired() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  setSnap({ standalone: readStandalone(), ios: readIos() });

  const onChange = () => setSnap({ standalone: readStandalone() });
  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", onChange);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setSnap({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    setSnap({ deferred: null, standalone: true, choice: "accepted" });
  });
}

function subscribe(cb: () => void) {
  ensureWired();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnap() {
  ensureWired();
  return snap;
}

function getServerSnap(): InstallSnap {
  return { standalone: false, ios: false, deferred: null, choice: null };
}

/**
 * Soft PWA / Add to Home Screen helpers (shared across tip + settings).
 * Chromium may delay or skip `beforeinstallprompt` (engagement heuristics,
 * already installed, missing SW). iOS never fires it — show Share steps instead.
 *
 * `standalone` includes display-mode (standalone/fullscreen/minimal-ui), iOS
 * home-screen, and Android TWA (`document.referrer` android-app://).
 */
export function usePwaInstall() {
  const state = useSyncExternalStore(subscribe, getSnap, getServerSnap);

  useEffect(() => {
    ensureWired();
    setSnap({ standalone: readStandalone(), ios: readIos() });
  }, []);

  const promptInstall = useCallback(async () => {
    const event = snap.deferred;
    if (!event) return null;
    setSnap({ deferred: null });
    try {
      await event.prompt();
      const result = await event.userChoice;
      setSnap({
        choice: result.outcome,
        ...(result.outcome === "accepted" ? { standalone: true } : {}),
      });
      return result.outcome;
    } catch {
      return null;
    }
  }, []);

  return {
    /** Already running as an installed / home-screen / TWA app. */
    standalone: state.standalone,
    /** iPhone / iPad Safari (or Chrome on iOS — still no BIP). */
    ios: state.ios,
    /** Chromium deferred install event is ready. */
    canPrompt: Boolean(state.deferred) && !state.standalone,
    /** Last userChoice from prompt(), if any. */
    choice: state.choice,
    promptInstall,
  };
}
