import { PRIVACY_URL } from "@/lib/memoir/app-links";
import { cn } from "@/lib/utils";

/**
 * Honest privacy line. Scraps are only stored locally; the site may count
 * page visits (GA / Pinterest) but never sees what you write.
 */
export function PrivacyNote({ className, short = false }: { className?: string; short?: boolean }) {
  return (
    <p className={cn("privacy-note", className)}>
      <span aria-hidden="true">🔒 </span>
      {short
        ? "your scraps stay on your phone. no account needed."
        : "your scraps stay on your phone. no account, and nothing you write ever leaves it unless you share it yourself."}{" "}
      <a href={PRIVACY_URL} target="_blank" rel="noopener">
        privacy
      </a>
    </p>
  );
}
