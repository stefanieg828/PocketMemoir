import { useState } from "react";
import { StickerMark } from "@/components/sticker-mark";
import { FREE_STARTER_PACK, type StickerMarkId } from "@/lib/memoir/stickers";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useStickerUi } from "@/lib/memoir/sticker-ui";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

type StickerTrayProps = {
  /** Compact peek on empty shelf / keep form. */
  compact?: boolean;
  /** Start expanded (default: open unless compact). */
  defaultOpen?: boolean;
  className?: string;
  /** Called after a sticker is stuck (optional toast hook). */
  onStuck?: (id: StickerMarkId) => void;
};

/**
 * Soft “stickers” tray — free starter marks.
 * Tap a mark to arm place-mode, then tap the page/cork where you want it.
 */
export function StickerTray({ compact = false, defaultOpen, className, onStuck }: StickerTrayProps) {
  const placeSticker = useMemoir((s) => s.placeSticker);
  const clearPageStickers = useMemoir((s) => s.clearPageStickers);
  const count = useMemoir((s) => s.pageStickers.length);
  const unlocked = useMemoir((s) => s.unlocked);
  const peeking = useIsPeeking();
  const armed = useStickerUi((s) => s.armed);
  const toggleArm = useStickerUi((s) => s.toggleArm);
  const disarm = useStickerUi((s) => s.disarm);
  const [open, setOpen] = useState(defaultOpen ?? !compact);

  if (peeking) return null;

  function stickRandom(id: StickerMarkId) {
    placeSticker(id, "scatter");
    disarm();
    onStuck?.(id);
  }

  return (
    <div className={cn("sticker-tray", compact && "sticker-tray-compact", className)}>
      <button
        type="button"
        className="sticker-tray-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sticker-tray-label">stickers</span>
        <span className="sticker-tray-meta">{open ? "hide" : "peek"}</span>
      </button>
      {open ? (
        <div className="sticker-tray-body">
          <p className="sticker-tray-lede">
            {armed
              ? "tap the page to stick it · or stick randomly"
              : "free starter · pick one, then tap the page"}
            {count > 0 ? ` · ${count} stuck` : ""}
          </p>
          {armed ? (
            <div className="sticker-tray-armed-bar">
              <button
                type="button"
                className="sticker-tray-armed-action"
                onClick={() => stickRandom(armed)}
              >
                stick randomly
              </button>
              <button type="button" className="sticker-tray-armed-action" onClick={() => disarm()}>
                cancel
              </button>
            </div>
          ) : null}
          <ul className="sticker-tray-grid" role="list">
            {FREE_STARTER_PACK.stickers.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={cn("sticker-tray-chip", armed === s.id && "sticker-tray-chip-armed")}
                  aria-label={
                    armed === s.id
                      ? `Cancel placing ${s.name}`
                      : `Choose ${s.name}, then tap the page`
                  }
                  aria-pressed={armed === s.id}
                  onClick={() => toggleArm(s.id)}
                >
                  <StickerMark mark={s.mark} />
                  <span className="sticker-tray-chip-name">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
          {count > 0 ? (
            <button type="button" className="sticker-tray-clear footer-link" onClick={() => clearPageStickers()}>
              clear stuck stickers
            </button>
          ) : null}
          <p className="sticker-tray-hint">
            drag to move · tap to peel off · {unlocked ? (
              <>ideas → <a href="mailto:scraps@pocketmemoir.fun">scraps@pocketmemoir.fun</a></>
            ) : (
              "more packs later"
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
