import { X } from "lucide-react";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import type { LookId, ModeId } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

type LookCard = {
  id: string;
  caption: string;
  src: string;
  alt: string;
  mode: ModeId;
  look: LookId;
};

const CARDS: LookCard[] = [
  {
    id: "soft-storybook",
    caption: "soft storybook",
    src: `${BASE}art/look-at-this/soft-storybook.png`,
    alt: "Scrapbook album in Soft Storybook look",
    mode: "scrapbook",
    look: "storybook",
  },
  {
    id: "cork-pins",
    caption: "cork & pins",
    src: `${BASE}art/look-at-this/cork-pins.png`,
    alt: "Cork wall of boards in Soft Storybook look",
    mode: "corkboard",
    look: "storybook",
  },
  {
    id: "comic-pop",
    caption: "comic pop",
    src: `${BASE}art/look-at-this/comic-pop.png`,
    alt: "Cork wall in Comic look",
    mode: "corkboard",
    look: "comic",
  },
];

type LookAtThisProps = {
  /** Compact empty-shelf version (no dismiss). */
  variant?: "header" | "empty";
  className?: string;
};

/**
 * Cozy postcard strip previewing Soft Storybook scrapbook, cork & pins, and comic pop.
 * Soft lowercase chrome. Panels deep-link into Look + layout.
 */
export function LookAtThis({ variant = "header", className }: LookAtThisProps) {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const dismissed = useMemoir((s) => s.lookAtThisDismissed);
  const dismiss = useMemoir((s) => s.dismissLookAtThis);
  const setMode = useMemoir((s) => s.setMode);
  const setLook = useMemoir((s) => s.setLook);
  const setOpen = usePickerUi((s) => s.setOpen);

  if (variant === "header") {
    if (!hasHydrated || dismissed) return null;
  }

  function tryLook(card: LookCard) {
    setMode(card.mode);
    setLook(card.look);
    setOpen(true);
  }

  return (
    <section
      className={cn("look-at-this", variant === "empty" && "look-at-this-empty", className)}
      aria-label="look at this"
    >
      <div className="look-at-this-head">
        <p className="look-at-this-label">look at this</p>
        {variant === "header" ? (
          <button
            type="button"
            className="look-at-this-x tip-dismiss-x backup-nudge-x"
            aria-label="Dismiss look at this"
            onClick={dismiss}
          >
            <X className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <ul className="look-at-this-row" role="list">
        {CARDS.map((card, i) => (
          <li key={card.id} className={cn("look-at-this-card", `look-card-${i + 1}`)}>
            <button
              type="button"
              className="look-at-this-panel"
              onClick={() => tryLook(card)}
              aria-label={`Try ${card.caption}`}
            >
              <span className="look-at-this-frame" aria-hidden="true">
                <img src={card.src} alt="" loading="lazy" decoding="async" draggable={false} />
              </span>
              <span className="look-at-this-caption">{card.caption}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
