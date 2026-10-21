import { useState } from "react";
import { StickerMark } from "@/components/sticker-mark";
import { STICKER_PACKS, type StickerMarkId } from "@/lib/memoir/stickers";
import { PLAN_PAID_NAME, UNLOCK_PRICE_LABEL } from "@/lib/memoir/unlock";
import { useUnlockUi } from "@/lib/memoir/unlock-ui";
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
  const openUnlock = useUnlockUi((s) => s.setOpen);
  const [open, setOpen] = useState(defaultOpen ?? !compact);
  const [packId, setPackId] = useState(STICKER_PACKS[0].id);
  const pack = STICKER_PACKS.find((p) => p.id === packId) ?? STICKER_PACKS[0];
  const locked = !pack.free && !unlocked;

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
              : locked
                ? `${pack.name} · unlock to stick these`
                : `${pack.name} · pick one, then tap the page`}
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
          {STICKER_PACKS.length > 1 ? (
            <div className="sticker-tray-tabs" role="tablist" aria-label="sticker packs">
              {STICKER_PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={p.id === pack.id}
                  className={cn("sticker-tray-tab", p.id === pack.id && "is-active")}
                  onClick={() => {
                    setPackId(p.id);
                    disarm();
                  }}
                >
                  {p.name}
                  {!p.free && !unlocked ? <span aria-hidden="true"> 🔒</span> : null}
                </button>
              ))}
            </div>
          ) : null}
          {locked ? (
            <div className="sticker-tray-locked">
              <button type="button" className="sticker-cta" onClick={() => openUnlock(true)}>
                unlock {PLAN_PAID_NAME} · {UNLOCK_PRICE_LABEL}
              </button>
              <p className="sticker-tray-hint">new packs drop weekly · same one-time unlock as comic &amp; riso.</p>
            </div>
          ) : null}
          <ul className={cn("sticker-tray-grid", locked && "sticker-tray-grid-locked")} role="list">
            {pack.stickers.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={cn("sticker-tray-chip", armed === s.id && "sticker-tray-chip-armed")}
                  aria-label={
                    locked
                      ? `${s.name} (locked preview), unlock to use`
                      : armed === s.id
                        ? `Cancel placing ${s.name}`
                        : `Choose ${s.name}, then tap the page`
                  }
                  aria-pressed={armed === s.id}
                  onClick={() => (locked ? openUnlock(true) : toggleArm(s.id))}
                >
                  <StickerMark mark={s.mark} />
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
            drag to move · tap to resize or peel · {unlocked ? (
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
