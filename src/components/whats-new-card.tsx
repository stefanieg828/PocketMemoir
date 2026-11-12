import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useMemoir } from "@/lib/memoir/store";

/** Bump this (and the list) when there is something new to tell people. */
export const WHATS_NEW_VERSION = "2026.10-launch";
export const WHATS_NEW_KEY = "pocketmemoir.whatsNewSeen";
const ITEMS = [
  "a longer, friendlier tour. replay it anytime from look.",
  "rate and share buttons at the bottom of look.",
  "a new lowercase name: pocket memoir.",
];

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(WHATS_NEW_KEY);
  } catch {
    return null;
  }
}
function writeSeen() {
  try {
    window.localStorage.setItem(WHATS_NEW_KEY, WHATS_NEW_VERSION);
  } catch {
    /* private mode */
  }
}

/**
 * Small "what's new" slip, once per version, only for people who were here
 * before (tour already seen when we first check). Fresh installs get the tour
 * instead and are quietly marked as caught up.
 */
export function WhatsNewCard() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const tourSeen = useMemoir((s) => s.tourSeen);
  const peeking = useIsPeeking();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasHydrated || checked) return;
    setChecked(true);
    if (readSeen() === WHATS_NEW_VERSION) return;
    if (!tourSeen) {
      writeSeen(); // first install (or tour pending): the tour covers it
      return;
    }
    setShow(true);
  }, [hasHydrated, tourSeen, checked]);

  // Tour replayed while the card is up: tuck it away for good.
  useEffect(() => {
    if (show && !tourSeen) {
      writeSeen();
      setShow(false);
    }
  }, [show, tourSeen]);

  if (!show || peeking || !tourSeen) return null;

  const close = () => {
    writeSeen();
    setShow(false);
  };

  return (
    <div className="backup-nudge on-cork whats-new" role="status" aria-labelledby="whats-new-title">
      <div className="whats-new-copy">
        <p className="a2hs-tip-kicker" id="whats-new-title">
          new in pocket memoir
        </p>
        <ul className="whats-new-list">
          {ITEMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="backup-nudge-x" aria-label="got it, close what's new" onClick={close}>
        <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}
