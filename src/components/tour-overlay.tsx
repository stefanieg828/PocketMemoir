import { useEffect, useId, useRef, useState } from "react";
import { APP_NAME, TAGLINE } from "@/lib/memoir/copy";
import { useMemoir } from "@/lib/memoir/store";

type TourStep = {
  kicker: string;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    kicker: "Welcome",
    title: `Meet ${APP_NAME}`,
    body: `A tiny scrapbook and corkboard for life’s bits — passwords, people, tickets, little wins. ${TAGLINE}`,
  },
  {
    kicker: "Two ways to look",
    title: "Flip the album or peek the wall",
    body: "Scrapbook turns pages. Corkboard pins boards on a wall. Switch Mode anytime under Look → Make it yours.",
  },
  {
    kicker: "Your scraps",
    title: "Stick one in when you’re ready",
    body: "Tap Stick it in (or Pin it on the cork wall). A few sample scraps are already here so the shelf isn’t empty.",
  },
  {
    kicker: "You’re in",
    title: "Peek around, then make it yours",
    body: "Flip, search, or open Look whenever you want a different paper. Skip was always fine — nothing is locked behind this.",
  },
];

/**
 * Soft first-visit scrapbook slip. Skip and Done both set tourSeen so return
 * visits stay quiet. Escape = Skip. Light focus trap inside the card.
 */
export function TourOverlay() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const tourSeen = useMemoir((s) => s.tourSeen);
  const setTourSeen = useMemoir((s) => s.setTourSeen);
  const [step, setStep] = useState(0);
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const open = hasHydrated && !tourSeen;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const t = window.setTimeout(() => {
      cardRef.current?.querySelector<HTMLElement>("button, [href]")?.focus();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setTourSeen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setTourSeen]);

  useEffect(() => {
    if (!open) return;
    const root = cardRef.current;
    if (!root) return;
    const onFocus = (e: FocusEvent) => {
      if (root.contains(e.target as Node)) return;
      e.stopPropagation();
      root.querySelector<HTMLElement>("button")?.focus();
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [open, step]);

  if (!open) return null;

  const last = step >= STEPS.length - 1;
  const current = STEPS[step]!;

  const finish = () => setTourSeen(true);
  const next = () => {
    if (last) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div className="tour-layer" role="presentation">
      <div className="tour-wash" aria-hidden="true" />
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="tour-kicker">{current.kicker}</p>
        <h2 id={titleId} className="tour-title">
          {current.title}
        </h2>
        <p className="tour-body">{current.body}</p>

        <div className="tour-marks" aria-label={`Page ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={i === step ? "tour-mark is-on" : "tour-mark"}
              aria-current={i === step ? "step" : undefined}
            />
          ))}
        </div>

        <div className="tour-actions">
          <button type="button" className="tour-skip footer-link" onClick={finish}>
            Skip
          </button>
          <button type="button" className="kind-chip tour-next" onClick={next}>
            {last ? "Start peeking" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
