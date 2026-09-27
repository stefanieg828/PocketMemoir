import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useMemoir } from "@/lib/memoir/store";
import {
  STRIPE_PAYMENT_LINK,
  UNLOCK_PRICE_LABEL,
  canPreviewUnlock,
  consumePreviewUnlockFlag,
  hasStripePaymentLink,
  isUnlockDevPreview,
} from "@/lib/memoir/unlock";
import { useUnlockUi } from "@/lib/memoir/unlock-ui";

/**
 * Soft scrapbook paywall. Stripe Payment Link plugs in later via
 * VITE_STRIPE_PAYMENT_LINK — until then primary stays “almost ready” and only
 * DEV / ?previewUnlock=1 expose a testing unlock.
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
    toast.success("you're unlocked", { description: "comic, riso & more boards are yours." });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="picker-overlay unlock-sheet-overlay fixed inset-0 z-[55]" />
        <Dialog.Content className="unlock-sheet fixed top-1/2 left-1/2 z-[56] max-h-[min(92dvh,34rem)] w-[min(calc(100%-1.5rem),24.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
          <p className="unlock-sheet-kicker">one soft gate</p>
          <Dialog.Title className="unlock-sheet-title">unlock pocket memoir</Dialog.Title>
          <Dialog.Description className="unlock-sheet-body">
            One-time {UNLOCK_PRICE_LABEL}. Keep Soft Storybook free — unlock Comic &amp; Riso looks, more boards you
            can customize, colors, hide &amp; reorder, weekly new sticker packs, and a little idea email to
            scraps@pocketmemoir.fun.
          </Dialog.Description>

          <ul className="unlock-sheet-perks" aria-label="What you get">
            <li>Comic &amp; Risograph looks</li>
            <li>More boards, presets &amp; customs</li>
            <li>Hide, reorder &amp; vibe colors</li>
            <li>Got an idea? → scraps@pocketmemoir.fun.</li>
          </ul>

          <div className="unlock-sheet-actions">
            {linked ? (
              <button type="button" className="sticker-cta unlock-sheet-cta" onClick={onPrimary}>
                <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
                Unlock for {UNLOCK_PRICE_LABEL}
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
                Not now
              </button>
            </Dialog.Close>
          </div>

          {!linked ? (
            <p className="unlock-sheet-soon-hint">pay link coming soon — your scraps stay free meanwhile.</p>
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
