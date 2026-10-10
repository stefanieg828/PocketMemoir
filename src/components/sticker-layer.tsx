import { useCallback, useRef, type PointerEvent, type RefObject } from "react";
import { StickerMark } from "@/components/sticker-mark";
import { useIsPeeking, usePeekSession } from "@/lib/memoir/peek-session";
import { useStickerUi } from "@/lib/memoir/sticker-ui";
import { useMemoir } from "@/lib/memoir/store";
import type { PlacedSticker } from "@/lib/memoir/stickers";
import { cn } from "@/lib/utils";

type StickerLayerProps = {
  className?: string;
  /** Allow place / drag / remove (off while peeking). */
  interactive?: boolean;
};

const DRAG_THRESHOLD_PX = 7;

/** Absolute overlay of decorative stickers stuck on the page / cork. */
export function StickerLayer({ className, interactive = true }: StickerLayerProps) {
  const ownStickers = useMemoir((s) => s.pageStickers);
  const placeSticker = useMemoir((s) => s.placeSticker);
  const moveSticker = useMemoir((s) => s.movePageSticker);
  const removeSticker = useMemoir((s) => s.removePageSticker);
  const peeking = useIsPeeking();
  const peekStickers = usePeekSession((s) => s.pageStickers);
  const armed = useStickerUi((s) => s.armed);
  const disarm = useStickerUi((s) => s.disarm);
  const layerRef = useRef<HTMLDivElement>(null);

  const stickers: PlacedSticker[] = peeking ? peekStickers : ownStickers;
  const canEdit = interactive && !peeking;

  const percentFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = layerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const onLayerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!canEdit || !armed) return;
    // Only place when tapping the empty layer, not a sticker child.
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    const pct = percentFromEvent(e.clientX, e.clientY);
    if (!pct) return;
    placeSticker(armed, pct);
    disarm();
  };

  if (stickers.length === 0 && !(canEdit && armed)) return null;

  return (
    <div
      ref={layerRef}
      className={cn(
        "sticker-layer",
        canEdit && armed && "sticker-layer-armed",
        className,
      )}
      aria-hidden={canEdit ? undefined : true}
      onPointerDown={onLayerPointerDown}
    >
      {canEdit && armed ? (
        <p className="sticker-layer-hint" aria-live="polite">
          tap the page to stick it
        </p>
      ) : null}
      {stickers.map((s) => (
        <PlacedStickerItem
          key={s.id}
          sticker={s}
          canEdit={canEdit}
          layerRef={layerRef}
          onMove={moveSticker}
          onRemove={removeSticker}
        />
      ))}
    </div>
  );
}

function PlacedStickerItem({
  sticker: s,
  canEdit,
  layerRef,
  onMove,
  onRemove,
}: {
  sticker: PlacedSticker;
  canEdit: boolean;
  layerRef: RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}) {
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: s.x,
      originY: s.y,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId || !canEdit) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    d.moved = true;
    const el = layerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = d.originX + (dx / rect.width) * 100;
    const y = d.originY + (dy / rect.height) * 100;
    onMove(s.id, x, y);
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!d.moved && canEdit) {
      onRemove(s.id);
    }
  };

  return (
    <button
      type="button"
      className={cn("sticker-layer-item", canEdit && "sticker-layer-item-editable")}
      style={{
        left: `${s.x}%`,
        top: `${s.y}%`,
        transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${s.scale ?? 1})`,
      }}
      aria-label={canEdit ? "Drag to move, tap to remove" : undefined}
      tabIndex={canEdit ? 0 : -1}
      disabled={!canEdit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <StickerMark mark={s.stickerId} />
    </button>
  );
}
