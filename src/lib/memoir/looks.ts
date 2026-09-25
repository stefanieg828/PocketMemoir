import type { LookId, RisoPrefs } from "./types";

export type LookSkin = {
  id: LookId;
  name: string;
  line: string;
  /** Future 99¢ unlock marker — purely cosmetic for now (no paywall). */
  unlock: boolean;
  /** Short kicker shown above Shelf headings. */
  kicker: string;
};

export const LOOK_SKINS: Record<LookId, LookSkin> = {
  storybook: {
    id: "storybook",
    name: "Soft Storybook",
    line: "Watercolor washes, peach & sage, loose ink, pressed flowers.",
    unlock: false,
    kicker: "soft storybook",
  },
  comic: {
    id: "comic",
    name: "Comic",
    line: "Heavy ink, CMYK brights, halftone dots, starbursts.",
    unlock: true,
    kicker: "comic edition",
  },
  riso: {
    id: "riso",
    name: "Risograph Zine",
    line: "Two inks on grainy cream, torn edges, off-register stamps.",
    unlock: true,
    kicker: "risograph zine",
  },
};

export type RisoInkPair = { id: string; name: string; a: string; b: string };

/** Curated two-ink pairs that read as real riso drum colors. `a` = accent/shadow ink, `b` = key ink. */
export const RISO_INK_PAIRS: readonly RisoInkPair[] = [
  { id: "rose-navy", name: "Dusty rose + navy", a: "#d9849a", b: "#23305e" },
  { id: "mustard-teal", name: "Mustard + teal", a: "#e3b23c", b: "#1f6f78" },
  { id: "coral-blue", name: "Coral + federal blue", a: "#f06b5b", b: "#2b3f8f" },
  { id: "mint-plum", name: "Mint + plum", a: "#7fc8a9", b: "#5b2a52" },
  { id: "orange-green", name: "Orange + forest", a: "#f28c38", b: "#24533f" },
  { id: "pink-black", name: "Fluoro pink + black", a: "#ff5fa2", b: "#26221f" },
  { id: "sky-brick", name: "Sky + brick", a: "#7cb6de", b: "#9a3b2e" },
  { id: "yellow-purple", name: "Yellow + purple", a: "#f4d35e", b: "#4b3a8c" },
];

export type FontChoice = { id: string; name: string; stack: string };

export const RISO_TITLE_FONTS: readonly FontChoice[] = [
  { id: "kaushan", name: "Brush script", stack: '"Kaushan Script", cursive' },
  { id: "caveat-brush", name: "Marker brush", stack: '"Caveat Brush", cursive' },
  { id: "dm-serif", name: "Zine serif", stack: '"DM Serif Display", Georgia, serif' },
  { id: "permanent-marker", name: "Sharpie", stack: '"Permanent Marker", cursive' },
];

export const RISO_BODY_FONTS: readonly FontChoice[] = [
  { id: "patrick", name: "Handwritten", stack: '"Patrick Hand", "Comic Neue", cursive' },
  { id: "courier", name: "Typewriter", stack: '"Courier Prime", ui-monospace, monospace' },
  { id: "karla", name: "Plain print", stack: '"Karla", ui-sans-serif, system-ui, sans-serif' },
];

export const DEFAULT_RISO: RisoPrefs = {
  pair: "rose-navy",
  inkA: "#d9849a",
  inkB: "#23305e",
  titleFont: "kaushan",
  bodyFont: "patrick",
};

const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeRiso(value: unknown): RisoPrefs {
  if (!value || typeof value !== "object") return { ...DEFAULT_RISO };
  const raw = value as Partial<RisoPrefs>;
  const pair =
    raw.pair === "custom" || RISO_INK_PAIRS.some((p) => p.id === raw.pair)
      ? (raw.pair as string)
      : DEFAULT_RISO.pair;
  const curated = RISO_INK_PAIRS.find((p) => p.id === pair);
  const inkA = typeof raw.inkA === "string" && HEX.test(raw.inkA) ? raw.inkA : (curated?.a ?? DEFAULT_RISO.inkA);
  const inkB = typeof raw.inkB === "string" && HEX.test(raw.inkB) ? raw.inkB : (curated?.b ?? DEFAULT_RISO.inkB);
  const titleFont = RISO_TITLE_FONTS.some((f) => f.id === raw.titleFont)
    ? (raw.titleFont as string)
    : DEFAULT_RISO.titleFont;
  const bodyFont = RISO_BODY_FONTS.some((f) => f.id === raw.bodyFont)
    ? (raw.bodyFont as string)
    : DEFAULT_RISO.bodyFont;
  return { pair, inkA, inkB, titleFont, bodyFont };
}

/** Resolved CSS custom properties for the current riso prefs. */
export function risoCssVars(prefs: RisoPrefs): Record<string, string> {
  const curated = RISO_INK_PAIRS.find((p) => p.id === prefs.pair);
  const a = prefs.pair === "custom" ? prefs.inkA : (curated?.a ?? prefs.inkA);
  const b = prefs.pair === "custom" ? prefs.inkB : (curated?.b ?? prefs.inkB);
  const title = RISO_TITLE_FONTS.find((f) => f.id === prefs.titleFont) ?? RISO_TITLE_FONTS[0]!;
  const body = RISO_BODY_FONTS.find((f) => f.id === prefs.bodyFont) ?? RISO_BODY_FONTS[0]!;
  return {
    "--riso-a": a,
    "--riso-b": b,
    "--riso-title": title.stack,
    "--riso-body": body.stack,
  };
}

/** Apply mode/look/riso to <html>. Safe to call on every change. */
export function applyThemeToDocument(mode: string, look: LookId, riso: RisoPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.dataset.look = look;
  // Legacy hook kept so older selectors don't break mid-migration.
  root.dataset.jacket = mode;
  const vars = risoCssVars(riso);
  for (const [k, v] of Object.entries(vars)) {
    if (look === "riso") root.style.setProperty(k, v);
    else root.style.removeProperty(k);
  }
}
