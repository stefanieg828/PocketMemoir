import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useMemoir } from "@/lib/memoir/store";
import {
  getDiagSnapshot,
  isTwaSession,
  probePlayBilling,
  purchaseBigScraps,
  setDiag,
  shouldPreferPlayBilling,
  subscribeDiag,
  type DigitalGoodsServiceLike,
  type PlayProbe,
} from "@/lib/memoir/play-billing";
import {
  classifyPlayError,
  formatPlayPrice,
  playFailureMessage,
  probeStatusMessage,
} from "@/lib/memoir/play-billing-errors";
import {
  PLAN_FREE_NAME,
  PLAN_PAID_NAME,
  STRIPE_PAYMENT_LINK,
  UNLOCK_PRICE_LABEL,
  canPreviewUnlock,
  consumePreviewUnlockFlag,
  hasStripePaymentLink,
  isUnlockDevPreview,
} from "@/lib/memoir/unlock";
import { useUnlockUi } from "@/lib/memoir/unlock-ui";

const DEBUG_KEY = "pm.debugBilling";

/** `?debug=billing` (sticky for the tab session) turns on the billing readout. */
function readDebugFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URL(window.location.href).searchParams.get("debug") === "billing") {
      try {
        sessionStorage.setItem(DEBUG_KEY, "1");
      } catch {
        /* ignore */
      }
      return true;
    }
    return sessionStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

const emptyDiag = {};

/**
 * Soft scrapbook paywall.
 * Play/TWA: Digital Goods → setUnlocked(true). Browser: Stripe Payment Link.
 * Never dead-ends: every Play failure lands as a soft inline note.
 * Hidden readout: `?debug=billing`, or long-press / 5 taps on “one soft gate”.
 */
export function UnlockSheet() {
  const open = useUnlockUi((s) => s.open);
  const setOpen = useUnlockUi((s) => s.setOpen);
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const [previewOk, setPreviewOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preferPlay, setPreferPlay] = useState(false);
  const [inTwa, setInTwa] = useState(false);
  const [probe, setProbe] = useState<PlayProbe | null>(null);
  const [probing, setProbing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const probeSeq = useRef(0);
  const pressTimer = useRef<number | null>(null);
  const taps = useRef<number[]>([]);

  const diag = useSyncExternalStore(subscribeDiag, getDiagSnapshot, () => emptyDiag);

  const unlockNow = useCallback(() => {
    setUnlocked(true);
    setOpen(false);
    toast.success("you're unlocked", {
      description: `${PLAN_PAID_NAME} — comic, riso & more boards are yours.`,
    });
  }, [setOpen, setUnlocked]);

  const runProbe = useCallback(async () => {
    const seq = ++probeSeq.current;
    setProbing(true);
    const result = await probePlayBilling();
    if (seq === probeSeq.current) {
      setProbe(result);
      setProbing(false);
    }
    return result;
  }, []);

  useEffect(() => {
    if (!open) return;
    // Consume ?previewUnlock=1 once when the sheet opens so production stays gated.
    const ok = canPreviewUnlock() || consumePreviewUnlockFlag();
    setPreviewOk(ok || isUnlockDevPreview());
    setPreferPlay(shouldPreferPlayBilling());
    setInTwa(isTwaSession());
    setDebugOpen((v) => v || readDebugFlag());
    setNote(null);
    void runProbe().then((r) => {
      if (r.owned) unlockNow();
    });
  }, [open, runProbe, unlockNow]);

  useEffect(() => {
    if (unlocked && open) setOpen(false);
  }, [unlocked, open, setOpen]);

  const linked = hasStripePaymentLink();
  const playReady = probe?.status === "ready" && Boolean(probe.service);
  const useStripeCta = !preferPlay && linked;
  const playPrice = formatPlayPrice(probe?.item ?? null);
  const priceLabel = preferPlay && playPrice ? playPrice : UNLOCK_PRICE_LABEL;
  const ctaLabel = `unlock ${PLAN_PAID_NAME} · ${priceLabel}`;

  const doPurchase = async (service: DigitalGoodsServiceLike) => {
    setBusy(true);
    setNote(null);
    try {
      // purchaseBigScraps calls show() before its first await — keeps the tap's activation.
      await purchaseBigScraps(service);
      unlockNow();
    } catch (err) {
      const kind = classifyPlayError(err);
      // TWA payment activity reports Play-side failures as a cancel — re-check to explain.
      if (kind === "play-closed") {
        const again = await runProbe();
        if (again.owned) {
          unlockNow();
          return;
        }
        setNote(probeStatusMessage(again.status, inTwa) ?? playFailureMessage(kind));
      } else {
        setNote(playFailureMessage(kind));
      }
    } finally {
      setBusy(false);
    }
  };

  const onPlay = () => {
    if (busy) return;
    if (playReady && probe?.service) {
      void doPurchase(probe.service);
      return;
    }
    // Not ready (still checking, or a previous check failed) — re-check, then buy or explain.
    void (async () => {
      setBusy(true);
      setNote(null);
      const next = await runProbe();
      setBusy(false);
      if (next.owned) {
        unlockNow();
        return;
      }
      if (next.status === "ready" && next.service) {
        void doPurchase(next.service);
        return;
      }
      setNote(
        probeStatusMessage(next.status, inTwa) ??
          "google play billing isn't available here. open pocket memoir from google play to unlock.",
      );
    })();
  };

  const onStripe = () => {
    setDiag("purchase", "stripe link opened");
  };

  const onPreview = () => unlockNow();

  const onKickerTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setDebugOpen((v) => !v);
    }
  };
  const startPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setDebugOpen(true), 700);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  // Soft status under the button — the probe result explains a Play problem before the tap.
  const probeNote =
    preferPlay && probe && !probing ? probeStatusMessage(probe.status, inTwa) : null;
  const shownNote = note ?? probeNote;
  const canPreview = previewOk && !(preferPlay ? playReady : useStripeCta);

  const diagText = Object.entries(diag)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="picker-overlay unlock-sheet-overlay fixed inset-0 z-[55]" />
        <Dialog.Content className="unlock-sheet fixed top-1/2 left-1/2 z-[56] max-h-[min(92dvh,34rem)] w-[min(calc(100%-1.5rem),24.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
          <p
            className="unlock-sheet-kicker"
            onClick={onKickerTap}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            one soft gate
          </p>
          <Dialog.Title className="unlock-sheet-title">unlock {PLAN_PAID_NAME}</Dialog.Title>
          <Dialog.Description className="unlock-sheet-body">
            one-time {priceLabel}. {PLAN_FREE_NAME} keeps soft storybook free — {PLAN_PAID_NAME} unlocks
            comic &amp; riso looks, more boards you can customize, colors, hide &amp; reorder, weekly new sticker
            packs, and a little idea inbox for sticker &amp; scrap ideas.
          </Dialog.Description>

          <ul className="unlock-sheet-perks" aria-label="What you get">
            <li>comic &amp; risograph looks</li>
            <li>more boards, presets &amp; customs</li>
            <li>hide, reorder &amp; vibe colors</li>
            <li>a little idea inbox for sticker &amp; scrap ideas</li>
          </ul>

          <div className="unlock-sheet-actions">
            {preferPlay ? (
              <button
                type="button"
                className="sticker-cta unlock-sheet-cta"
                data-billing="play"
                onClick={onPlay}
                disabled={busy}
                aria-busy={busy}
              >
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                {busy ? "opening google play…" : ctaLabel}
              </button>
            ) : useStripeCta ? (
              <a
                className="sticker-cta unlock-sheet-cta no-underline"
                data-billing="stripe"
                href={STRIPE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onStripe}
              >
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                {ctaLabel}
              </a>
            ) : (
              <button
                type="button"
                className="sticker-cta unlock-sheet-cta is-soon"
                disabled
                aria-disabled="true"
                title="Stripe payment link comes next"
              >
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                Stripe link next
              </button>
            )}
            <Dialog.Close asChild>
              <button type="button" className="kind-chip unlock-sheet-later">
                not now
              </button>
            </Dialog.Close>
          </div>

          <p className="unlock-sheet-soon-hint unlock-sheet-status" role="status" aria-live="polite">
            {preferPlay && probing && !busy && !note ? "checking google play…" : shownNote}
          </p>

          {!preferPlay && !useStripeCta ? (
            <p className="unlock-sheet-soon-hint">
              pay link coming soon — your {PLAN_FREE_NAME} stay free meanwhile.
            </p>
          ) : null}

          {canPreview ? (
            <button type="button" className="unlock-sheet-preview footer-link" onClick={onPreview}>
              {isUnlockDevPreview() ? "I'm testing — preview unlock" : "Preview unlock"}
            </button>
          ) : null}

          {debugOpen ? (
            <div className="unlock-debug" aria-label="billing debug">
              <p className="unlock-debug-title">billing debug</p>
              <pre className="unlock-debug-log">
                {`twa (this tab): ${String(inTwa)}\nplay path: ${String(preferPlay)}\nprobe: ${
                  probing ? "checking…" : (probe?.status ?? "—")
                }\n${diagText}`}
              </pre>
              <div className="unlock-debug-actions">
                <button type="button" className="kind-chip" onClick={() => void runProbe()}>
                  re-check
                </button>
                <button
                  type="button"
                  className="kind-chip"
                  onClick={() => {
                    const text = `twa: ${inTwa}\nprobe: ${probe?.status ?? "—"}\n${diagText}`;
                    void navigator.clipboard?.writeText(text).then(
                      () => toast.success("copied"),
                      () => toast.error("couldn't copy — screenshot instead"),
                    );
                  }}
                >
                  copy
                </button>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
