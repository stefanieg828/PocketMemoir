import { useState } from "react";
import { StickerMark } from "@/components/sticker-mark";
import { FREE_STARTER_PACK, type StickerMarkId } from "@/lib/memoir/stickers";
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
 * Soft “stickers” tray — free starter marks. Tap to stick one on the page / cork.
 */
export function StickerTray({ compact = false, defaultOpen, className, onStuck }: StickerTrayProps) {
  const placeSticker = useMemoir((s) => s.placeSticker);
  const clearPageStickers = useMemoir((s) => s.clearPageStickers);
  const count = useMemoir((s) => s.pageStickers.length);
  const [open, setOpen] = useState(defaultOpen ?? !compact);

  function stick(id: StickerMarkId) {
    placeSticker(id);
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
            free starter · tap to stick on the page
            {count > 0 ? ` · ${count} stuck` : ""}
          </p>
          <ul className="sticker-tray-grid" role="list">
            {FREE_STARTER_PACK.stickers.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="sticker-tray-chip"
                  aria-label={`Stick ${s.name}`}
                  onClick={() => stick(s.id)}
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
            more packs later · ideas → scraps@pocketmemoir.fun
          </p>
        </div>
      ) : null}
    </div>
  );
}
