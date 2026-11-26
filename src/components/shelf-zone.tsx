import type { ReactNode } from "react";
import { statusLabel } from "@/lib/memoir/copy";
import type { EntryStatus, ModeId as JacketId } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

type ShelfZoneProps = {
  status: EntryStatus;
  jacket: JacketId;
  count: number;
  children: ReactNode;
  className?: string;
};

/** Named washi / wood-style plaque above a status shelf bay. */
export function ShelfZone({ status, jacket, count, children, className }: ShelfZoneProps) {
  if (count === 0) return null;
  const label = statusLabel(status, jacket);
  return (
    <section
      className={cn("shelf-zone", `shelf-zone-${status}`, className)}
      aria-label={label}
    >
      <header className={cn("shelf-plaque", jacket === "corkboard" && "shelf-plaque-wood")}>
        <span className="shelf-plaque-text">{label}</span>
        <span className="shelf-plaque-count" aria-hidden="true">
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}
