import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchSlip({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-end">
      <label
        className={cn(
          "relative flex h-11 items-center gap-1 rounded-full border-[3px] border-ink bg-card shadow-paper",
          open ? "search-open px-1" : "w-11",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Search" : "Open search"}
          onClick={() => onOpenChange(!open)}
          className={cn(
            "grid place-items-center text-ink",
            open ? "size-11 shrink-0" : "absolute inset-0",
          )}
        >
          <Search className="size-4" strokeWidth={1.75} />
        </button>
        {open ? (
          <>
            <input
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="look through the box"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            />
            {value ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onChange("")}
                className="grid size-11 place-items-center text-muted hover:text-ink"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            ) : null}
          </>
        ) : null}
      </label>
    </div>
  );
}
