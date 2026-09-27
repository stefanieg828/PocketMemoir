import type { ReactNode } from "react";
import type { StickerMarkId } from "@/lib/memoir/stickers";
import { cn } from "@/lib/utils";

/** Flat cartoon SVG marks for the free starter pack. */
export function StickerMark({
  mark,
  className,
  title,
}: {
  mark: StickerMarkId;
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn("deco-sticker-mark", `deco-sticker-${mark}`, className)} aria-hidden={title ? undefined : true} title={title}>
      {MARK_SVG[mark]}
    </span>
  );
}

const MARK_SVG: Record<StickerMarkId, ReactNode> = {
  heart: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M16 27S6.5 21.2 4.2 16.2C2.4 12.4 4.2 7.6 8.4 7.2c2.6-.3 4.8 1.1 7.6 3.8 2.8-2.7 5-4.1 7.6-3.8 4.2.4 6 5.2 4.2 9C25.5 21.2 16 27 16 27z"
        fill="#e9a891"
        stroke="#9c6a5c"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "heart-soft": (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M16 26.5S7.2 21.2 5.2 16.6C3.6 13.2 5.2 8.8 9 8.4c2.3-.2 4.2 1 6.6 3.4 2.4-2.4 4.3-3.6 6.6-3.4 3.8.4 5.4 4.8 3.8 8.2C24.8 21.2 16 26.5 16 26.5z"
        fill="#f3c8b0"
        stroke="#b9786a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="12.5" r="1.2" fill="#fff" fillOpacity="0.55" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M16 3.5l3.6 8.2 9 .9-6.8 6.1 2 8.8L16 22.8 8.2 27.5l2-8.8L3.4 12.6l9-.9z"
        fill="#f3d3b4"
        stroke="#6a5646"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M16 4v24M6 16h20M8.5 8.5l15 15M23.5 8.5l-15 15"
        stroke="#6f8b6c"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="2.4" fill="#c0d8d4" stroke="#6a5646" strokeWidth="1.2" />
    </svg>
  ),
  "washi-rose": (
    <svg viewBox="0 0 40 18" width="100%" height="100%">
      <rect x="1" y="3" width="38" height="12" rx="2" fill="#eeb49c" stroke="#9c6a5c" strokeWidth="1.5" />
      <path d="M4 6h32M4 12h32" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
    </svg>
  ),
  "washi-mint": (
    <svg viewBox="0 0 40 18" width="100%" height="100%">
      <rect x="1" y="3" width="38" height="12" rx="2" fill="#bdd0b5" stroke="#6f8b6c" strokeWidth="1.5" />
      <path d="M5 9h30" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  ),
  "smile-wax": (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="12" fill="#8aa585" stroke="#4a3f37" strokeWidth="1.8" />
      <circle cx="11.5" cy="14" r="1.4" fill="#fffaf1" />
      <circle cx="20.5" cy="14" r="1.4" fill="#fffaf1" />
      <path d="M11 19.5c1.6 2.2 8.4 2.2 10 0" stroke="#fffaf1" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  ),
  flower: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <g fill="#f1b9a0" stroke="#b9786a" strokeWidth="1.3">
        <ellipse cx="16" cy="8" rx="4" ry="6.5" />
        <ellipse cx="16" cy="24" rx="4" ry="6.5" />
        <ellipse cx="8" cy="16" rx="6.5" ry="4" />
        <ellipse cx="24" cy="16" rx="6.5" ry="4" />
      </g>
      <circle cx="16" cy="16" r="3.2" fill="#e8c9a0" stroke="#b9786a" strokeWidth="1.2" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M8 24c2-10 10-16 18-18-2 10-8 18-18 18z"
        fill="#bdd0b5"
        stroke="#6f8b6c"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 22c5-4 10-10 14-15" stroke="#6f8b6c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  bow: (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <path
        d="M16 14c-4-6-11-6-12-1 1 4 6 5 12 3 6 2 11 1 12-3-1-5-8-5-12 1z"
        fill="#e9a891"
        stroke="#9c6a5c"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15" r="2.6" fill="#f3d3b4" stroke="#9c6a5c" strokeWidth="1.3" />
    </svg>
  ),
  "pin-dot": (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="13" r="8" fill="#c8826d" stroke="#4a3f37" strokeWidth="1.7" />
      <circle cx="13.5" cy="10.5" r="2" fill="#fff" fillOpacity="0.45" />
      <path d="M16 21v7" stroke="#4a3f37" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 36 24" width="100%" height="100%">
      <path
        d="M10 18h16a6 6 0 0 0 1-11.9A7.5 7.5 0 0 0 12.2 7 5.5 5.5 0 0 0 10 18z"
        fill="#c0d8d4"
        stroke="#6a5646"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
