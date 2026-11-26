import { useNavigate } from "@tanstack/react-router";
import { usePeekSession } from "@/lib/memoir/peek-session";

/**
 * Soft sticky banner while a peek session is active.
 * Done peeking clears the in-memory session — owner's scraps / unlock stay put.
 */
export function PeekBanner() {
  const active = usePeekSession((s) => s.active);
  const endPeek = usePeekSession((s) => s.endPeek);
  const navigate = useNavigate();

  if (!active) return null;

  return (
    <div className="peek-banner" role="status">
      <p className="peek-banner-text">
        you’re peeking — scraps stay with them
      </p>
      <button
        type="button"
        className="kind-chip peek-banner-done"
        onClick={() => {
          endPeek();
          void navigate({ to: "/", search: {}, replace: true });
        }}
      >
        done peeking
      </button>
    </div>
  );
}
