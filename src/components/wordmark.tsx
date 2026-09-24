import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/memoir/copy";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

/** Look-specific wordmark: serif + sprig (storybook), outlined comic caps, two-ink brush (riso). */
export function Wordmark({ className }: { className?: string }) {
  const look = useMemoir((s) => s.look);

  return (
    <Link
      to="/"
      search={{}}
      aria-label={APP_NAME}
      className={cn("wordmark no-underline", `wordmark-${look}`, className)}
    >
      {look === "comic" ? (
        <span className="wm-comic" aria-hidden="true">
          <span className="wm-comic-burst" />
          <span className="wm-comic-text">Pocket Memoir</span>
        </span>
      ) : look === "riso" ? (
        <span className="wm-riso" aria-hidden="true">
          <span className="wm-riso-a">Pocket</span>
          <span className="wm-riso-b">Memoir</span>
          <span className="wm-riso-swash" />
        </span>
      ) : (
        <span className="wm-story" aria-hidden="true">
          <span className="wm-story-text">{APP_NAME}</span>
          <svg className="wm-story-sprig" viewBox="0 0 160 18" fill="none">
            <path d="M4 9h52M104 9h52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
            <path
              d="M62 9c4-5 9-6 13-4M62 9c4 4 9 5 12 3M98 9c-4-5-9-6-13-4M98 9c-4 4-9 5-12 3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M80 14.5s-5.2-3.2-6.6-5.6c-1-1.7-.4-3.8 1.4-4.3 1.3-.4 2.5.2 3.2 1.2.7-1 1.9-1.6 3.2-1.2 1.8.5 2.4 2.6 1.4 4.3-1.4 2.4-6.6 5.6-6.6 5.6z"
              fill="var(--color-washi)"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </span>
      )}
    </Link>
  );
}
