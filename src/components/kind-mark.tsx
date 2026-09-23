import { KIND_META } from "@/lib/memoir/copy";
import type { EntryKind } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

const FILLS = ["bg-gold", "bg-washi", "bg-mint", "bg-sky"] as const;

export function KindMark({
  kind,
  className,
  size = "md",
}: {
  kind: EntryKind;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const meta = KIND_META[kind];
  const fill = FILLS[meta.label.length % FILLS.length];
  const box = size === "lg" ? "h-28 w-28 text-lg" : size === "sm" ? "h-10 px-3 text-sm" : "h-16 px-4 text-base";
  return (
    <span className={cn("kind-sticker", fill, box, className)} aria-hidden="true">
      {meta.label}
    </span>
  );
}
