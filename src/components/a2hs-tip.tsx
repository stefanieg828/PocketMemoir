import { useEffect } from "react";
import { X } from "lucide-react";
import { GA_EVENTS, trackEvent } from "@/lib/memoir/analytics";
import { usePwaInstall } from "@/lib/memoir/use-pwa-install";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useMemoir } from "@/lib/memoir/store";

/**
 * Soft first-visit Add to Home Screen / install slip.
 * Waits until the tour is done (or was skipped) so it never stacks on top.
 * Dismiss persists in pocketmemoir.v1. Hidden when already standalone.
 */
export function A2hsTip() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const tourSeen = useMemoir((s) => s.tourSeen);
  const dismissed = useMemoir((s) => s.a2hsTipDismissed);
  const dismiss = useMemoir((s) => s.dismissA2hsTip);
  const peeking = useIsPeeking();
  const { standalone, ios, canPrompt, choice, promptInstall } = usePwaInstall();

  // Once they install (or accept the prompt), tuck the tip away for good.
  useEffect(() => {
    if (standalone || choice === "accepted") dismiss();
  }, [standalone, choice, dismiss]);

  if (!hasHydrated || !tourSeen || dismissed || standalone || peeking) return null;

  // iOS always gets Share steps. Chromium gets Install when BIP is ready.
  // Soft menu hint only on touch-ish phones — skip quiet desktop nags.
  const touchy =
    typeof window !== "undefined" &&
    (window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      Math.min(window.innerWidth, window.innerHeight) < 520);
  const mode: "ios" | "prompt" | "menu" | null = ios
    ? "ios"
    : canPrompt
      ? "prompt"
      : touchy
        ? "menu"
        : null;

  if (!mode) return null;

  return (
    <div className="a2hs-tip backup-nudge" role="status">
      <div className="a2hs-tip-copy">
        <p className="a2hs-tip-kicker">pocket it</p>
        {mode === "ios" ? (
          <p className="backup-nudge-text a2hs-tip-body">
            tap <strong>share</strong>, then <strong>add to home screen</strong> — a tiny scrapbook
            right on your phone.
          </p>
        ) : mode === "prompt" ? (
          <p className="backup-nudge-text a2hs-tip-body">
            add pocketmemoir to your home screen — one tap, and it’s right there.
          </p>
        ) : (
          <p className="backup-nudge-text a2hs-tip-body">
            add pocketmemoir to your home screen from the browser menu — it’ll sit there like a
            little scrapbook.
          </p>
        )}
      </div>
      <div className="backup-nudge-actions a2hs-tip-actions">
        {mode === "prompt" ? (
          <button
            type="button"
            className="kind-chip a2hs-tip-install"
            onClick={() => {
              void promptInstall();
            }}
          >
            add to home screen
          </button>
        ) : null}
        <button
          type="button"
          className="backup-nudge-x"
          aria-label="Not now"
          onClick={() => {
            trackEvent(GA_EVENTS.a2hsDismiss);
            dismiss();
          }}
        >
          <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Quiet install line for Keep them safe — only when not already installed. */
export function A2hsSettingsHint() {
  const { standalone, ios, canPrompt, promptInstall } = usePwaInstall();
  if (standalone) return null;

  return (
    <div className="a2hs-settings">
      <p className="a2hs-settings-lede">want it on your home screen?</p>
      {ios ? (
        <p className="a2hs-settings-steps">
          tap share → add to home screen. soft little icon, yours alone.
        </p>
      ) : canPrompt ? (
        <button
          type="button"
          className="kind-chip a2hs-settings-install"
          onClick={() => {
            void promptInstall();
          }}
        >
          add to home screen
        </button>
      ) : (
        <p className="a2hs-settings-steps">
          look for install / add to home screen in the browser menu.
        </p>
      )}
    </div>
  );
}
