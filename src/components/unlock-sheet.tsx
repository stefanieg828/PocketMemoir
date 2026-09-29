import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useMemoir } from "@/lib/memoir/store";
import {
  getPlayBillingService,
  purchaseBigScraps,
  shouldPreferPlayBilling,
} from "@/lib/memoir/play-billing";
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

/**
 * Soft scrapbook paywall.
 * Play/TWA: Digital Goods → setUnlocked(true). Browser: Stripe Payment Link.
 */
export function UnlockSheet() {
  const open = useUnlockUi((s) => s.open);
  const setOpen = useUnlockUi((s) => s.setOpen);
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const [previewOk, setPreviewOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playReady, setPlayReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Consume ?previewUnlock=1 once when the sheet opens so production stays gated.
    const ok = canPreviewUnlock() || consumePreviewUnlockFlag();
    setPreviewOk(ok || isUnlockDevPreview());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const service = await getPlayBillingService();
      if (!cancelled) setPlayReady(Boolean(service));
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (unlocked && open) setOpen(false);
  }, [unlocked, open, setOpen]);

  const preferPlay = shouldPreferPlayBilling();
  const linked = hasStripePaymentLink();
  // Play path when Digital Goods is up; Stripe only outside Play/TWA.
  const usePlayCta = playReady;
  const useStripeCta = !preferPlay && linked;
  const ctaEnabled = usePlayCta || useStripeCta;

  const onPrimary = async () => {
    if (busy) return;

    if (usePlayCta) {
      setBusy(true);
      try {
        const service = await getPlayBillingService();
        if (!service) {
          toast.error("Play Billing isn’t available yet", {
            description: "Update the app from Play, then try again.",
          });
          return;
        }
        await purchaseBigScraps(service);
        setUnlocked(true);
        setOpen(false);
        toast.success("you're unlocked", {
          description: `${PLAN_PAID_NAME} — comic, riso & more boards are yours.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        // User cancel / dismiss — stay quiet.
        if (/abort|cancel|dismiss/i.test(msg)) return;
        toast.error("couldn’t finish Play purchase", {
          description: msg || "Try again in a moment.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (useStripeCta) {
      window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
    }
  };

  const onPreview = () => {
    setUnlocked(true);
    setOpen(false);
    toast.success("you're unlocked", {
      description: `${PLAN_PAID_NAME} — comic, riso & more boards are yours.`,
    });
  };

  const ctaLabel = preferPlay
    ? `unlock ${PLAN_PAID_NAME} · ${UNLOCK_PRICE_LABEL}`
    : `unlock ${PLAN_PAID_NAME} · ${UNLOCK_PRICE_LABEL}`;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="picker-overlay unlock-sheet-overlay fixed inset-0 z-[55]" />
        <Dialog.Content className="unlock-sheet fixed top-1/2 left-1/2 z-[56] max-h-[min(92dvh,34rem)] w-[min(calc(100%-1.5rem),24.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
          <p className="unlock-sheet-kicker">one soft gate</p>
          <Dialog.Title className="unlock-sheet-title">unlock {PLAN_PAID_NAME}</Dialog.Title>
          <Dialog.Description className="unlock-sheet-body">
            one-time {UNLOCK_PRICE_LABEL}. {PLAN_FREE_NAME} keeps soft storybook free — {PLAN_PAID_NAME} unlocks
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
            {ctaEnabled ? (
              <button
                type="button"
                className="sticker-cta unlock-sheet-cta"
                onClick={() => void onPrimary()}
                disabled={busy}
                aria-busy={busy}
              >
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                {busy ? "opening Play…" : ctaLabel}
              </button>
            ) : preferPlay ? (
              <button
                type="button"
                className="sticker-cta unlock-sheet-cta is-soon"
                disabled
                aria-disabled="true"
                title="Play Billing needs the billing-enabled app build"
              >
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                Play Billing next
              </button>
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

          {!ctaEnabled && preferPlay ? (
            <p className="unlock-sheet-soon-hint">
              unlock via Google Play — update the app if this stays grey.
            </p>
          ) : null}

          {!ctaEnabled && !preferPlay ? (
            <p className="unlock-sheet-soon-hint">
              pay link coming soon — your {PLAN_FREE_NAME} stay free meanwhile.
            </p>
          ) : null}

          {!ctaEnabled && previewOk ? (
            <button type="button" className="unlock-sheet-preview footer-link" onClick={onPreview}>
              {isUnlockDevPreview() ? "I'm testing — preview unlock" : "Preview unlock"}
            </button>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
