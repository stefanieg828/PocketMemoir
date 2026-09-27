import { useEffect, useId, useRef, useState } from "react";
import { APP_NAME, TAGLINE } from "@/lib/memoir/copy";
import { useIsPeeking } from "@/lib/memoir/peek-session";
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
    body: `A tiny memoir for life’s bits... passwords, people, events, little wins. ${TAGLINE}`,
  },
  {
    kicker: "Two ways to look",
    title: "Flip the album or peek the wall",
    body: "Choose either scrapbook or corkboard for your layout. You can switch the layout anytime under Look → Make it yours.",
  },
  {
    kicker: "Your scraps",
    title: "Stick one in when you’re ready",
    body: "Tap Stick it in on the scrapbook or Pin it on the corkboard. A few sample scraps are already here to show how it works.",
  },
  {
    kicker: "You’re in",
    title: "Peek around, then make it yours",
    body: "Flip, search, or open Look whenever you want a different scrap. Click a scrap to zoom in and see details.",
  },
];

/**
 * Soft first-visit scrapbook slip. Skip and Done both set tourSeen so return
 * visits stay quiet. Escape = Skip. Back / page dots rewind. Light focus trap.
 */
export function TourOverlay() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const tourSeen = useMemoir((s) => s.tourSeen);
  const setTourSeen = useMemoir((s) => s.setTourSeen);
  const peeking = useIsPeeking();
  const [step, setStep] = useState(0);
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const open = hasHydrated && !tourSeen && !peeking;

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
  const back = () => setStep((s) => Math.max(0, s - 1));

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
            <button
              key={i}
              type="button"
              className={i === step ? "tour-mark is-on" : "tour-mark"}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="tour-actions">
          <div className="tour-actions-left">
            <button type="button" className="tour-skip footer-link" onClick={finish}>
              Skip
            </button>
            {step > 0 ? (
              <button type="button" className="tour-back footer-link" onClick={back}>
                Back
              </button>
            ) : null}
          </div>
          <button type="button" className="kind-chip tour-next" onClick={next}>
            {last ? "Start scrapping" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
