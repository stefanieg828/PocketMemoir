import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useMemoir } from "@/lib/memoir/store";

const FIRST_HINT_KEY = "pocketmemoir.firstHintSeen";
const HOLD_MS = 480;

type Bubble = { text: string; x: number; y: number; below: boolean };

function place(el: Element, text: string): Bubble {
  const r = el.getBoundingClientRect();
  const below = r.top < 90;
  return {
    text,
    x: Math.min(Math.max(r.left + r.width / 2, 110), window.innerWidth - 110),
    y: below ? r.bottom + 8 : r.top - 8,
    below,
  };
}

/**
 * Tap-and-hold hints. Any element with data-hint="..." shows a small bubble
 * after a long press (desktop gets the same text via title). Also one gentle
 * first-use hint on the shelf, once ever, after the tour is done.
 */
export function HintLayer() {
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const timer = useRef<number | null>(null);
  const tourSeen = useMemoir((s) => s.tourSeen);
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const clear = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
    const down = (e: PointerEvent) => {
      setBubble(null);
      if (e.pointerType === "mouse") return;
      const el = (e.target as Element | null)?.closest?.("[data-hint]");
      if (!el) return;
      clear();
      timer.current = window.setTimeout(() => {
        setBubble(place(el, el.getAttribute("data-hint") ?? ""));
        window.setTimeout(() => setBubble(null), 2600);
      }, HOLD_MS);
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", clear, { passive: true });
    document.addEventListener("pointercancel", clear, { passive: true });
    document.addEventListener("scroll", clear, { passive: true, capture: true });
    return () => {
      clear();
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", clear);
      document.removeEventListener("pointercancel", clear);
      document.removeEventListener("scroll", clear, { capture: true });
    };
  }, []);

  // One first-use hint, ever.
  useEffect(() => {
    if (!hasHydrated || !tourSeen || pathname !== "/") return;
    try {
      if (window.localStorage.getItem(FIRST_HINT_KEY)) return;
    } catch {
      return;
    }
    const id = window.setTimeout(() => {
      const el = document.querySelector("[data-hint]");
      if (!el || document.querySelector("[role=dialog]")) return;
      try {
        window.localStorage.setItem(FIRST_HINT_KEY, "1");
      } catch {
        /* ignore */
      }
      setBubble(place(el, "psst: press and hold a button to see what it does"));
      window.setTimeout(() => setBubble(null), 4200);
    }, 1800);
    return () => window.clearTimeout(id);
  }, [hasHydrated, tourSeen, pathname]);

  if (!bubble) return null;
  return (
    <div
      className={`hint-bubble${bubble.below ? " is-below" : ""}`}
      role="tooltip"
      style={{ left: bubble.x, top: bubble.y }}
      onClick={() => setBubble(null)}
    >
      {bubble.text}
    </div>
  );
}
