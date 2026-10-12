import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/memoir/copy";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { GA_EVENTS, trackEvent } from "@/lib/memoir/analytics";
import { useMemoir } from "@/lib/memoir/store";

type TourStep = {
  kicker: string;
  title: string;
  body: string;
  /** CSS selectors tried in order; the first visible match gets spotlit. */
  target?: string[];
};

const LOOK_BTN = '.app-nav button.app-nav-link';

const STEPS: TourStep[] = [
  {
    kicker: "Welcome",
    title: `Meet ${APP_NAME}`,
    body: "A tiny private scrapbook for life's little bits. Everything stays right here on your phone.",
  },
  {
    kicker: "Boards",
    title: "One board for each kind of thing",
    body: "Thoughts, People, Places, To-Do, Achievements, and Goals each get their own board. Tap a tab to flip to it.",
    target: [".flip-tabs", ".cork-wall-grid"],
  },
  {
    kicker: "Adding a scrap",
    title: "Stick one in",
    body: "Tap Stick it in (or Pin it on the corkboard), fill in what you like, and it lands on the page. A few samples are here to show how it works.",
    target: [".fixed .sticker-cta", ".sticker-cta"],
  },
  {
    kicker: "Categories",
    title: "Little chips keep things sorted",
    body: "When you add a scrap, pick a chip like Note, Idea, or Person. It shows on the scrap so your board stays tidy.",
    target: [".flip-scraps .kind-sticker", ".kind-sticker"],
  },
  {
    kicker: "Make it yours",
    title: "Custom categories",
    body: "Rename any starter board for free. With big scraps you can make your own boards and add, rename, or hide the chips inside them, all under Look.",
    target: [LOOK_BTN],
  },
  {
    kicker: "Stickers",
    title: "Decorate your pages",
    body: "Open stickers, pick one, then tap anywhere on the page to stick it. Drag to move it, tap to peel it off.",
    target: [".sticker-tray"],
  },
  {
    kicker: "Look",
    title: "Scrapbook or corkboard",
    body: "Flip pages in a scrapbook or pin boards on a cork wall. Look also lets you pick a whole new style.",
    target: [LOOK_BTN],
  },
  {
    kicker: "Text size",
    title: "Easy on the eyes",
    body: "Under Look, Reading comfort lets you pick small, normal, large, or extra large text, plus bold text. It's free for everyone.",
    target: [LOOK_BTN],
  },
  {
    kicker: "Search and backup",
    title: "Find it fast, keep it safe",
    body: "Tap the magnifying glass to find any scrap. Tap Keep a copy at the bottom to save a backup so nothing gets lost.",
    target: ['[aria-label="Open search"]', '[aria-label="Search"]'],
  },
  {
    kicker: "You're in",
    title: "Have fun scrapping",
    body: "Replay this tour anytime from Look. Big scraps adds more boards, your own chips, new sticker packs, and extra looks.",
    target: [LOOK_BTN],
  },
];

function findTarget(selectors?: string[]): HTMLElement | null {
  if (!selectors) return null;
  for (const sel of selectors) {
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest(".tour-layer")) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

type Spot = { top: number; left: number; width: number; height: number };

/**
 * Soft first-visit scrapbook slip. Skip and Done both set tourSeen so return
 * visits stay quiet. Escape = Skip. Back / page dots rewind. Light focus trap.
 *
 * Always shown when tourSeen is false after hydrate — including Play TWA /
 * standalone (android-app referrer). Unlike A2hsTip, installed-shell detection
 * must never hide this tour. Play TWA uses pocketmemoir.twa.tourSeen so Chrome
 * tab dismissals for the same origin do not suppress first Play open.
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
        trackEvent(GA_EVENTS.tourSkip);
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

  const [spot, setSpot] = useState<Spot | null>(null);
  const targetSel = open ? STEPS[step]?.target : undefined;

  useLayoutEffect(() => {
    if (!open) return;
    let raf = 0;
    const measure = () => {
      const el = findTarget(targetSel);
      if (!el) {
        setSpot(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 6;
      setSpot({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    };
    const el = findTarget(targetSel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 8 || r.bottom > window.innerHeight - 8) el.scrollIntoView({ block: "center" });
    }
    measure();
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    const t = window.setTimeout(measure, 250);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, step, targetSel]);

  if (!open) return null;

  const last = step >= STEPS.length - 1;
  const current = STEPS[step]!;

  const skip = () => {
    trackEvent(GA_EVENTS.tourSkip);
    setTourSeen(true);
  };
  const complete = () => {
    trackEvent(GA_EVENTS.tourComplete);
    setTourSeen(true);
  };
  const next = () => {
    if (last) complete();
    else setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      className={
        spot
          ? `tour-layer ${spot.top + spot.height / 2 < window.innerHeight / 2 ? "tour-at-bottom" : "tour-at-top"}`
          : "tour-layer"
      }
      role="presentation"
    >
      {spot ? (
        <div
          className="tour-spot"
          aria-hidden="true"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      ) : (
        <div className="tour-wash" aria-hidden="true" />
      )}
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
            <button type="button" className="tour-skip footer-link" onClick={skip}>
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
