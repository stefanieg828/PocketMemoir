import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useMemoir } from "@/lib/memoir/store";
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
 * Soft scrapbook paywall. Stripe Payment Link via VITE_STRIPE_PAYMENT_LINK
 * (falls back to the live buy link). Empty override keeps a soft “almost ready”
 * CTA; DEV / ?previewUnlock=1 expose a testing unlock.
 */
export function UnlockSheet() {
  const open = useUnlockUi((s) => s.open);
  const setOpen = useUnlockUi((s) => s.setOpen);
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const [previewOk, setPreviewOk] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Consume ?previewUnlock=1 once when the sheet opens so production stays gated.
    const ok = canPreviewUnlock() || consumePreviewUnlockFlag();
    setPreviewOk(ok || isUnlockDevPreview());
  }, [open]);

  useEffect(() => {
    if (unlocked && open) setOpen(false);
  }, [unlocked, open, setOpen]);

  const linked = hasStripePaymentLink();

  const onPrimary = () => {
    if (!linked) return;
    window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
  };

  const onPreview = () => {
    setUnlocked(true);
    setOpen(false);
    toast.success("you're unlocked", {
      description: `${PLAN_PAID_NAME} — comic, riso & more boards are yours.`,
    });
  };

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
            {linked ? (
              <button type="button" className="sticker-cta unlock-sheet-cta" onClick={onPrimary}>
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                unlock {PLAN_PAID_NAME} · {UNLOCK_PRICE_LABEL}
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

          {!linked ? (
            <p className="unlock-sheet-soon-hint">
              pay link coming soon — your {PLAN_FREE_NAME} stay free meanwhile.
            </p>
          ) : null}

          {!linked && previewOk ? (
            <button type="button" className="unlock-sheet-preview footer-link" onClick={onPreview}>
              {isUnlockDevPreview() ? "I'm testing — preview unlock" : "Preview unlock"}
            </button>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
