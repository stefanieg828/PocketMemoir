import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/memoir/copy";
import { cn } from "@/lib/utils";

type AlbumCoverProps = {
  children: ReactNode;
  heading: string;
  sub?: string;
  className?: string;
};

/** Closed scrapbook cover chrome for the Add / Keep route. */
export function AlbumCover({ children, heading, sub, className }: AlbumCoverProps) {
  return (
    <div className={cn("album-cover", className)}>
      <div className="album-cover-spine" aria-hidden="true">
        <span className="album-spine-ring" />
        <span className="album-spine-ring" />
        <span className="album-spine-ring" />
      </div>
      <div className="album-cover-face">
        <span className="album-cover-washi" aria-hidden="true" />
        <span className="album-cover-washi album-cover-washi-b" aria-hidden="true" />
        <span className="album-cover-seal" aria-hidden="true" />
        <p className="album-cover-wordmark font-display">{APP_NAME}</p>
        <h1 className="album-cover-title font-display">{heading}</h1>
        {sub ? <p className="album-cover-sub">{sub}</p> : null}
        <div className="album-cover-body">{children}</div>
      </div>
    </div>
  );
}
