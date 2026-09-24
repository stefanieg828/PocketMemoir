import { Link } from "@tanstack/react-router";
import { MODE_META } from "@/lib/memoir/jackets";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

type KeepSealProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  toKeep?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

function Face() {
  const look = useMemoir((s) => s.look);
  const mode = useMemoir((s) => s.mode);
  return (
    <span className="seal-face" aria-hidden="true">
      {look === "comic" ? (
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M18 3 7 18h7l-2 11 11-15h-7z" fill="currentColor" stroke="var(--color-line)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ) : look === "riso" ? (
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M16 5v22M6.5 10.5l19 11M25.5 10.5l-19 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : mode === "corkboard" ? (
        <svg viewBox="0 0 32 32" className="size-6">
          <circle cx="16" cy="13" r="6.5" fill="currentColor" opacity=".9" />
          <path d="M16 19.5V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M16 8v16M8 16h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function KeepSeal({
  label,
  className,
  size = "md",
  toKeep = false,
  onClick,
  type = "button",
}: KeepSealProps) {
  const jacket = useMemoir((s) => s.mode);
  const text = label ?? MODE_META[jacket].keepLabel;
  const classes = cn(
    "sticker-cta",
    size === "sm" && "min-h-11 text-sm",
    size === "md" && "text-base",
    size === "lg" && "min-h-14 px-4 text-lg",
    className,
  );

  if (toKeep) {
    return (
      <Link to="/keep" search={{}} className={classes} aria-label={text}>
        <Face />
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} aria-label={text}>
      <Face />
      <span>{text}</span>
    </button>
  );
}
