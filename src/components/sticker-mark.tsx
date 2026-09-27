import { useId, type ReactNode } from "react";
import type { StickerMarkId } from "@/lib/memoir/stickers";
import { cn } from "@/lib/utils";

/** Soft scrapbook SVG marks — layered fills, soft highlights, imperfect edges. */
export function StickerMark({
  mark,
  className,
  title,
}: {
  mark: StickerMarkId;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <span
      className={cn("deco-sticker-mark", `deco-sticker-${mark}`, className)}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {renderMark(mark, uid)}
    </span>
  );
}

function Grain({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" seed="3" />
      <feColorMatrix type="saturate" values="0" in="n" result="g" />
      <feComponentTransfer in="g" result="a">
        <feFuncA type="linear" slope="0.18" />
      </feComponentTransfer>
      <feComposite in="a" in2="SourceGraphic" operator="in" result="grain" />
      <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
    </filter>
  );
}

function renderMark(mark: StickerMarkId, uid: string): ReactNode {
  const g = (name: string) => `${uid}-${name}`;
  switch (mark) {
    case "heart":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
            <linearGradient id={g("fill")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4b8a4" />
              <stop offset="55%" stopColor="#e89a82" />
              <stop offset="100%" stopColor="#d8866e" />
            </linearGradient>
          </defs>
          <path
            d="M16 27.2S6.2 21.4 3.9 16.1C2 12.1 4.1 7 8.6 6.6c2.8-.25 5.1 1.2 7.4 3.9 2.3-2.7 4.6-4.15 7.4-3.9 4.5.4 6.6 5.5 4.7 9.5C25.8 21.4 16 27.2 16 27.2z"
            fill={`url(#${g("fill")})`}
            stroke="#8f5f52"
            strokeWidth="1.55"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M10.2 11.2c1.1-1.4 2.8-1.8 4-.6"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="11.2" cy="12.4" r="1.35" fill="#fff" fillOpacity="0.5" />
        </svg>
      );
    case "heart-soft":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M16 26.6S7 21.1 5 16.4C3.3 12.8 5.1 8.2 9.1 7.8c2.4-.25 4.4 1.1 6.9 3.6 2.5-2.5 4.5-3.85 6.9-3.6 4 .4 5.8 5 4 8.6C25 21.1 16 26.6 16 26.6z"
            fill="#f6d0bc"
            stroke="#b9786a"
            strokeWidth="1.45"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M16 26.6S9.5 22.2 7.4 18.4c-1.2-2.2-.2-5.2 2.4-5.6"
            fill="#f9e2d4"
            fillOpacity="0.55"
          />
          <circle cx="11" cy="12.3" r="1.4" fill="#fff" fillOpacity="0.6" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
            <linearGradient id={g("fill")} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#f8e2c4" />
              <stop offset="100%" stopColor="#e8c49a" />
            </linearGradient>
          </defs>
          <path
            d="M16 3.2l3.5 8.1 8.9 1-6.7 6 1.9 8.8L16 22.6 8.4 27.1l1.9-8.8-6.7-6 8.9-1z"
            fill={`url(#${g("fill")})`}
            stroke="#6a5646"
            strokeWidth="1.55"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M16 8.5l1.2 3.2 3.4.4-2.5 2.3.7 3.3L16 16.2"
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <path
            d="M16 3.5v25M5.5 16h21M8.2 8.2l15.6 15.6M23.8 8.2 8.2 23.8"
            stroke="#6f8b6c"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.92"
          />
          <path
            d="M16 7.5v17M9.5 16h13"
            stroke="#c0d8d4"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <circle cx="16" cy="16" r="2.6" fill="#d7ebe7" stroke="#6a5646" strokeWidth="1.15" />
          <circle cx="15.2" cy="15.2" r="0.9" fill="#fff" fillOpacity="0.65" />
        </svg>
      );
    case "washi-rose":
      return (
        <svg viewBox="0 0 44 18" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M1.5 4.2c1.2-.8 2.4.4 3.5-.2 1.1-.6 2.2.5 3.4 0 1.1-.5 2.1.6 3.3.1 1.2-.5 2.3.4 3.5-.1 1.1-.5 2.2.5 3.4.05 1.2-.4 2.3.5 3.5 0 1.1-.45 2.2.5 3.4.1 1.1-.4 2.3.55 3.4.05 1-.45 2 .6 2.8-.15v9.6c-.9.5-1.9-.2-2.9.15-1.1.4-2.1-.35-3.2.05-1.2.45-2.2-.3-3.4.05-1.1.35-2.2-.4-3.3.05-1.2.5-2.2-.25-3.4.1-1.1.35-2.2-.4-3.4.05-1.1.4-2.2-.3-3.3.1-1.2.45-2.1-.25-3.3.05-1 .3-2-.4-2.9.2V4.2z"
            fill="#eeb49c"
            stroke="#9c6a5c"
            strokeWidth="1.25"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path d="M5 7.2h34M5 11.5h34" stroke="#fff" strokeOpacity="0.38" strokeWidth="1.15" />
          <path
            d="M7 9.4h30"
            stroke="#9c6a5c"
            strokeOpacity="0.25"
            strokeWidth="0.9"
            strokeDasharray="2.2 2.4"
          />
        </svg>
      );
    case "washi-mint":
      return (
        <svg viewBox="0 0 44 18" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M1.8 3.8c1.1-.55 2.3.35 3.4-.15 1.2-.55 2.3.45 3.5.05 1.1-.4 2.2.5 3.3.05 1.2-.5 2.3.4 3.5 0 1.1-.4 2.2.55 3.4.1 1.1-.4 2.3.45 3.4 0 1.2-.5 2.2.4 3.4.1 1.1-.35 2.2.5 3.3.05 1-.4 2.1.55 2.9-.1v10c-.85.45-1.85-.15-2.8.2-1.1.4-2.15-.3-3.25.1-1.15.4-2.2-.35-3.35.05-1.1.4-2.2-.3-3.3.1-1.2.45-2.2-.25-3.4.1-1.1.35-2.2-.4-3.3.05-1.15.45-2.2-.3-3.35.1-1.1.35-2.15-.35-3.25.05-1 .35-1.95-.4-2.8.25V3.8z"
            fill="#bdd0b5"
            stroke="#6f8b6c"
            strokeWidth="1.25"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M6 9.2h32"
            stroke="#fff"
            strokeOpacity="0.45"
            strokeWidth="2"
            strokeDasharray="3.2 2.8"
            strokeLinecap="round"
          />
          <circle cx="10" cy="6.2" r="0.7" fill="#fff" fillOpacity="0.45" />
          <circle cx="34" cy="12.5" r="0.65" fill="#fff" fillOpacity="0.4" />
        </svg>
      );
    case "smile-wax":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
            <radialGradient id={g("fill")} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0%" stopColor="#a3bc9c" />
              <stop offset="100%" stopColor="#7a9874" />
            </radialGradient>
          </defs>
          <circle
            cx="16"
            cy="16.2"
            r="12.2"
            fill={`url(#${g("fill")})`}
            stroke="#4a3f37"
            strokeWidth="1.6"
            filter={`url(#${g("grain")})`}
          />
          <ellipse cx="12.5" cy="11" rx="4.5" ry="3" fill="#fff" fillOpacity="0.22" />
          <circle cx="11.4" cy="14.2" r="1.45" fill="#fffaf1" />
          <circle cx="20.6" cy="14.2" r="1.45" fill="#fffaf1" />
          <path
            d="M11.2 19.6c1.7 2.4 8.2 2.5 10 0.15"
            stroke="#fffaf1"
            strokeWidth="1.55"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "flower":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <g fill="#f1b9a0" stroke="#b9786a" strokeWidth="1.15" filter={`url(#${g("grain")})`}>
            <ellipse cx="16" cy="7.8" rx="3.8" ry="6.3" />
            <ellipse cx="16" cy="24.2" rx="3.8" ry="6.3" />
            <ellipse cx="7.8" cy="16" rx="6.3" ry="3.8" />
            <ellipse cx="24.2" cy="16" rx="6.3" ry="3.8" />
          </g>
          <g fill="#f7cbb8" opacity="0.55">
            <ellipse cx="16" cy="9" rx="2.2" ry="3.5" />
            <ellipse cx="16" cy="23" rx="2.2" ry="3.5" />
          </g>
          <circle cx="16" cy="16" r="3.4" fill="#e8c9a0" stroke="#b9786a" strokeWidth="1.1" />
          <circle cx="15.2" cy="15.2" r="1.1" fill="#fff" fillOpacity="0.45" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
            <linearGradient id={g("fill")} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#a8c4a0" />
              <stop offset="100%" stopColor="#c5d9be" />
            </linearGradient>
          </defs>
          <path
            d="M7.5 24.5c1.8-10.5 10.2-16.8 18.8-18.5-1.6 10.2-8.2 18.6-18.8 18.5z"
            fill={`url(#${g("fill")})`}
            stroke="#6f8b6c"
            strokeWidth="1.45"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M9.5 22.5c5.2-4.2 10.4-10.5 14.5-15.2"
            stroke="#6f8b6c"
            strokeWidth="1.15"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M13 18c1.8-1.6 3.6-3.5 5.2-5.4M15.5 20.5c1.5-1.4 3-3 4.4-4.6"
            stroke="#6f8b6c"
            strokeOpacity="0.45"
            strokeWidth="0.85"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="20" cy="10" rx="2.2" ry="1.4" fill="#fff" fillOpacity="0.28" transform="rotate(-35 20 10)" />
        </svg>
      );
    case "bow":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M16 14.2c-4.2-6.2-11.2-6.4-12.2-1.2 1.1 4.2 6.2 5.2 12.2 3.1 6 2.1 11.1 1.1 12.2-3.1-1-5.2-8-5-12.2 1.2z"
            fill="#e9a891"
            stroke="#9c6a5c"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M8 12.5c1.5-2.2 4-2.8 6.2-.8M24 12.5c-1.5-2.2-4-2.8-6.2-.8"
            stroke="#fff"
            strokeOpacity="0.4"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="16" cy="15.1" r="2.7" fill="#f3d3b4" stroke="#9c6a5c" strokeWidth="1.2" />
          <circle cx="15.3" cy="14.3" r="0.9" fill="#fff" fillOpacity="0.5" />
        </svg>
      );
    case "pin-dot":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <radialGradient id={g("fill")} cx="0.38" cy="0.32" r="0.7">
              <stop offset="0%" stopColor="#db9a86" />
              <stop offset="100%" stopColor="#c06a55" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="12.8" r="8.2" fill={`url(#${g("fill")})`} stroke="#4a3f37" strokeWidth="1.55" />
          <ellipse cx="13.2" cy="10" rx="3.2" ry="2.2" fill="#fff" fillOpacity="0.4" />
          <path d="M16 21.2v7.2" stroke="#4a3f37" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 28.4l-1.6 1.1M16 28.4l1.6 1.1" stroke="#4a3f37" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 36 24" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M9.5 18.2h16.8a6.1 6.1 0 0 0 1.1-12A7.6 7.6 0 0 0 12 6.8a5.6 5.6 0 0 0-2.5 11.4z"
            fill="#c8dde0"
            stroke="#6a5646"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <ellipse cx="14" cy="11" rx="5" ry="2.8" fill="#fff" fillOpacity="0.35" />
        </svg>
      );
    case "postage-stamp":
      return (
        <svg viewBox="0 0 28 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M4 3.5h20v25H4z"
            fill="#f7efe4"
            stroke="#8a7060"
            strokeWidth="1.2"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M4 3.5c0 0 .8.7 1.5 0s1.5-.7 1.5 0 1.5.7 1.5 0 1.5-.7 1.5 0 1.5.7 1.5 0 1.5-.7 1.5 0 1.5.7 1.5 0 1.5-.7 1.5 0 1.5.7 1.5 0 1.5-.7 1.5 0 1.5.7 1.5 0"
            fill="none"
            stroke="#8a7060"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <rect x="7" y="8" width="14" height="11" rx="1" fill="#e9c4b0" stroke="#9c6a5c" strokeWidth="1" />
          <circle cx="14" cy="13.5" r="2.8" fill="#c0d8d4" stroke="#6a5646" strokeWidth="0.9" />
          <path d="M8.5 22.5h11M8.5 25h8" stroke="#b9786a" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "foil-star":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <linearGradient id={g("fill")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f6e6a8" />
              <stop offset="45%" stopColor="#e8c878" />
              <stop offset="100%" stopColor="#d4a84a" />
            </linearGradient>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M16 2.8l2.2 7.4 7.7.4-6 4.8 2 7.5L16 18.6l-6 4.3 2-7.5-6-4.8 7.7-.4z"
            fill={`url(#${g("fill")})`}
            stroke="#8a6a28"
            strokeWidth="1.35"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <path
            d="M16 7l.9 3.2 3.3.2-2.5 2 .8 3.2L16 13.6"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="16" cy="14.5" r="1.3" fill="#fff8dc" fillOpacity="0.7" />
        </svg>
      );
    case "tiny-ticket":
      return (
        <svg viewBox="0 0 40 20" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <path
            d="M2 4.5h11.5a2.5 2.5 0 0 0 5 0H36v11H18.5a2.5 2.5 0 0 0-5 0H2z"
            fill="#f3e6d4"
            stroke="#8a7060"
            strokeWidth="1.25"
            strokeLinejoin="round"
            filter={`url(#${g("grain")})`}
          />
          <circle cx="16" cy="10" r="2.2" fill="none" stroke="#8a7060" strokeWidth="1" strokeDasharray="1.5 1.2" />
          <path d="M22 7.2h11M22 10h9M22 12.8h7" stroke="#b9786a" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
          <rect x="4.5" y="6.5" width="6" height="7" rx="0.8" fill="#c0d8d4" stroke="#6a5646" strokeWidth="0.9" />
        </svg>
      );
    case "pressed-flower":
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <defs>
            <Grain id={g("grain")} />
          </defs>
          <g filter={`url(#${g("grain")})`}>
            <ellipse cx="16" cy="11" rx="4.2" ry="5.5" fill="#e8b4c8" stroke="#a86a7e" strokeWidth="1.1" />
            <ellipse cx="11" cy="15.5" rx="5.2" ry="3.8" fill="#d9a0b8" stroke="#a86a7e" strokeWidth="1.1" transform="rotate(-25 11 15.5)" />
            <ellipse cx="21" cy="15.5" rx="5.2" ry="3.8" fill="#f0c4d4" stroke="#a86a7e" strokeWidth="1.1" transform="rotate(25 21 15.5)" />
            <ellipse cx="13.5" cy="20.5" rx="4.5" ry="3.5" fill="#c890a8" stroke="#a86a7e" strokeWidth="1.05" transform="rotate(-15 13.5 20.5)" />
            <ellipse cx="19.2" cy="20.2" rx="4.5" ry="3.5" fill="#e0a8c0" stroke="#a86a7e" strokeWidth="1.05" transform="rotate(18 19.2 20.2)" />
          </g>
          <circle cx="16" cy="16.5" r="2.6" fill="#e8c9a0" stroke="#b9786a" strokeWidth="1" />
          <circle cx="15.4" cy="15.8" r="0.85" fill="#fff" fillOpacity="0.5" />
          <path d="M16 19v6.5" stroke="#6f8b6c" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M16 22.5c-2.2 1-3.5 2.8-3.8 4.5M16 23c2 1.2 3.2 2.8 3.5 4.2"
            stroke="#6f8b6c"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
        </svg>
      );
    default:
      return null;
  }
}
