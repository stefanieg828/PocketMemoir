import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlbumPageProps = {
  children: ReactNode;
  className?: string;
  /** Compact empty-page height */
  empty?: boolean;
};

/** Scrapbook album surface: maroon spine, cream page, stacked-page hint. */
export function AlbumPage({ children, className, empty = false }: AlbumPageProps) {
  return (
    <div className={cn("album-stack", empty && "album-stack-empty", className)}>
      <div className="album-page-back" aria-hidden="true" />
      <div className="album-page-back album-page-back-b" aria-hidden="true" />
      <div className={cn("album-page", empty && "album-page-empty")}>
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
