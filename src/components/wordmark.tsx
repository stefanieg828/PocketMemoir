import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/memoir/copy";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" search={{}} className={cn("group flex items-center gap-2 text-ink no-underline", className)}>
      <span className="grid size-10 place-items-center rounded-full border-[3px] border-ink bg-washi shadow-seal sm:size-11" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="size-6" fill="none">
          <path
            d="M16 27s-8.5-5.2-11-9.4C3.2 15 3.6 11.4 6.4 10c2.2-1.1 4.4-.2 5.6 1.6C13.2 9.8 15.4 8.8 17.6 10c2.8 1.4 3.2 5 1.4 7.6C24.5 21.8 16 27 16 27z"
            fill="#fffaf1"
            stroke="#3a2430"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{APP_NAME}</span>
    </Link>
  );
}
