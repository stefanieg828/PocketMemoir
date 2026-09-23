import { Link } from "@tanstack/react-router";
import { LOOK_META } from "@/lib/memoir/jackets";
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
  const look = useMemoir((s) => s.jacket);
  if (look === "corkboard") {
    return (
      <span className="seal-face" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="size-6">
          <circle cx="16" cy="16" r="8" fill="#fffaf1" stroke="#3a2718" strokeWidth="2" />
          <circle cx="16" cy="16" r="3" fill="#e24b4b" />
        </svg>
      </span>
    );
  }
  return (
    <span className="seal-face" aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-6">
        <circle cx="11" cy="14" r="1.6" fill="#3a2430" />
        <circle cx="21" cy="14" r="1.6" fill="#3a2430" />
        <path d="M11 19c1.6 2 8.4 2 10 0" stroke="#3a2430" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
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
  const jacket = useMemoir((s) => s.jacket);
  const text = label ?? LOOK_META[jacket].keepLabel;
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
