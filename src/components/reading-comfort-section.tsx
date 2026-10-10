import type { KeyboardEvent } from "react";
import { useMemoir } from "@/lib/memoir/store";
import { TEXT_SIZE_META, TEXT_SIZES, stepTextSize, type TextSize } from "@/lib/memoir/reading";
import { cn } from "@/lib/utils";

/** "Aa" preview size per step, relative to the chip (which itself scales with the app). */
const AA_SIZE: Record<TextSize, string> = {
  small: "0.95rem",
  normal: "1.15rem",
  large: "1.4rem",
  xlarge: "1.7rem",
};

/**
 * Reading comfort — text size + bold text. Free for everyone (accessibility):
 * never gated by the big-scraps unlock, and stays usable while peeking since
 * it is the viewer's own device setting.
 */
export function ReadingComfortSection({ step }: { step: string }) {
  const textSize = useMemoir((s) => s.textSize);
  const boldText = useMemoir((s) => s.boldText);
  const setTextSize = useMemoir((s) => s.setTextSize);
  const setBoldText = useMemoir((s) => s.setBoldText);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = stepTextSize(textSize, dir);
    setTextSize(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-size="${next}"]`)?.focus();
  };

  return (
    <section className="picker-section reading-section" id="reading-comfort" aria-labelledby="reading-comfort-title">
      <h3 className="picker-section-title" id="reading-comfort-title">
        <span className="picker-step" aria-hidden="true">
          {step}
        </span>
        reading comfort
      </h3>
      <p className="picker-hint">bigger, bolder words for easier reading. free for everyone.</p>

      <h4 className="picker-sub" id="reading-size-label">
        text size
      </h4>
      <div role="radiogroup" aria-labelledby="reading-size-label" className="reading-sizes" onKeyDown={onKey}>
        {TEXT_SIZES.map((id) => {
          const on = id === textSize;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              data-size={id}
              className={cn("reading-size", on && "is-selected")}
              onClick={() => setTextSize(id)}
            >
              <span className="reading-aa" style={{ fontSize: AA_SIZE[id] }} aria-hidden="true">
                Aa
              </span>
              <span className="reading-size-name">{TEXT_SIZE_META[id].label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={boldText}
        className={cn("reading-bold", boldText && "is-on")}
        onClick={() => setBoldText(!boldText)}
      >
        <span className="reading-bold-aa" aria-hidden="true">
          B
        </span>
        <span className="reading-bold-text">
          <span className="reading-bold-name">bold text</span>
          <span className="reading-bold-hint">for easier reading</span>
        </span>
        <span className="reading-switch" aria-hidden="true">
          <span className="reading-switch-knob" />
        </span>
      </button>
    </section>
  );
}
