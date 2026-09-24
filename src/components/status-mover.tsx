import { useEffect, useId, useRef, useState } from "react";
import { STATUS_META, statusLabel } from "@/lib/memoir/copy";
import { useMemoir } from "@/lib/memoir/store";
import { ENTRY_STATUSES, type EntryStatus } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

type StatusMoverProps = {
  entryId: string;
  status: EntryStatus;
  /** Compact chip on a card vs fuller block on detail */
  size?: "card" | "detail";
  className?: string;
};

export function StatusMover({
  entryId,
  status,
  size = "detail",
  className,
}: StatusMoverProps) {
  const jacket = useMemoir((s) => s.mode);
  const setEntryStatus = useMemoir((s) => s.setEntryStatus);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("status-mover relative", size === "card" && "status-mover-card", className)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "status-chip",
          size === "card" && "status-chip-card",
          status === "keepsake" && "status-chip-keepsake",
          status === "soft" && "status-chip-soft",
          status === "tucked" && "status-chip-tucked",
        )}
      >
        {size === "card" ? STATUS_META[status].chip : statusLabel(status, jacket)}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Move on the shelf"
          className="status-menu"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <p className="status-menu-caption">
            {jacket === "corkboard" ? "Move the pin" : "Move on the page"}
          </p>
          {ENTRY_STATUSES.map((next) => {
            const on = next === status;
            return (
              <button
                key={next}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                className={cn("status-menu-item", on && "is-on")}
                onClick={() => {
                  setEntryStatus(entryId, next);
                  setOpen(false);
                }}
              >
                {statusLabel(next, jacket)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
