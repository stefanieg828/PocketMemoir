import type { ReactNode } from "react";
import {
  paperClassName,
  paperFor,
  type ScrapbookPaper,
} from "@/lib/scrapbook-paper";
import { cn } from "@/lib/utils";

type AlbumPageProps = {
  children: ReactNode;
  className?: string;
  /** Compact empty-page height */
  empty?: boolean;
  /** Explicit scrapbook paper; wins over seed */
  paper?: ScrapbookPaper;
  /** Stable id used to pick a paper when `paper` is omitted (defaults to cream-ruled) */
  seed?: string;
};

/** Scrapbook album surface: maroon spine, patterned page, stacked-page hint. */
export function AlbumPage({
  children,
  className,
  empty = false,
  paper,
  seed,
}: AlbumPageProps) {
  const resolved = paper ?? (seed ? paperFor(seed) : "cream-ruled");

  return (
    <div className={cn("album-stack", empty && "album-stack-empty", className)}>
      <div className="album-page-back" aria-hidden="true" />
      <div className="album-page-back album-page-back-b" aria-hidden="true" />
      <div
        className={cn("album-page", paperClassName(resolved), empty && "album-page-empty")}
        data-paper={resolved}
      >
        <div className="album-spine" aria-hidden="true">
          <span className="album-spine-ring" />
          <span className="album-spine-ring" />
          <span className="album-spine-ring" />
        </div>
        <div className="album-curl" aria-hidden="true" />
        <div className="album-inner">{children}</div>
      </div>
    </div>
  );
}
