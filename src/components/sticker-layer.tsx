import { StickerMark } from "@/components/sticker-mark";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

type StickerLayerProps = {
  className?: string;
  /** Allow tap-to-remove on a placed sticker. */
  removable?: boolean;
};

/** Absolute overlay of decorative stickers stuck on the page / cork. */
export function StickerLayer({ className, removable = true }: StickerLayerProps) {
  const stickers = useMemoir((s) => s.pageStickers);
  const removeSticker = useMemoir((s) => s.removePageSticker);

  if (stickers.length === 0) return null;

  return (
    <div className={cn("sticker-layer", className)} aria-hidden={removable ? undefined : true}>
      {stickers.map((s) => (
        <button
          key={s.id}
          type="button"
          className="sticker-layer-item"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${s.scale ?? 1})`,
          }}
          aria-label={removable ? "Remove sticker" : undefined}
          tabIndex={removable ? 0 : -1}
          onClick={removable ? () => removeSticker(s.id) : undefined}
          disabled={!removable}
        >
          <StickerMark mark={s.stickerId} />
        </button>
      ))}
    </div>
  );
}
