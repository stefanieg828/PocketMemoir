/**
 * Reading comfort: text size + bold text. Free for everyone (accessibility),
 * never gated behind the big-scraps unlock. Persisted in the main store and
 * applied to <html> as data-text-size / data-bold (CSS in
 * src/styles/reading-comfort.css). READING_BOOT runs inside THEME_BOOT in
 * __root.tsx so a saved size never flashes the default on load.
 *
 * Pure module (no imports) so node tests can load it with strip-types.
 */

export const TEXT_SIZES = ["small", "normal", "large", "xlarge"] as const;

export type TextSize = (typeof TEXT_SIZES)[number];

export const DEFAULT_TEXT_SIZE: TextSize = "normal";

export const TEXT_SIZE_META: Record<TextSize, { label: string; scale: number }> = {
  small: { label: "small", scale: 0.9 },
  normal: { label: "normal", scale: 1 },
  large: { label: "large", scale: 1.15 },
  xlarge: { label: "extra large", scale: 1.3 },
};

export function normalizeTextSize(value: unknown): TextSize {
  return typeof value === "string" && (TEXT_SIZES as readonly string[]).includes(value)
    ? (value as TextSize)
    : DEFAULT_TEXT_SIZE;
}

export function normalizeBoldText(value: unknown): boolean {
  return value === true;
}

/** One step smaller (-1) or bigger (+1), clamped to the ends. */
export function stepTextSize(current: TextSize, dir: -1 | 1): TextSize {
  const i = TEXT_SIZES.indexOf(normalizeTextSize(current));
  const next = Math.min(TEXT_SIZES.length - 1, Math.max(0, i + dir));
  return TEXT_SIZES[next]!;
}

/** Minimal element shape so tests can pass a fake documentElement. */
type DatasetTarget = { dataset: Record<string, string | undefined> };

/** Apply to <html>. Safe to call on every change. */
export function applyReadingToDocument(
  textSize: TextSize,
  bold: boolean,
  root: DatasetTarget | null = typeof document === "undefined" ? null : document.documentElement,
) {
  if (!root) return;
  root.dataset.textSize = normalizeTextSize(textSize);
  if (bold) root.dataset.bold = "1";
  else delete root.dataset.bold;
}

/**
 * Inline boot fragment (plain ES5) for THEME_BOOT. Expects `d` = documentElement
 * and `s` = persisted pocketmemoir.v1 state object. Mirrors applyReadingToDocument().
 */
export const READING_BOOT =
  `var z=${JSON.stringify(TEXT_SIZES)};` +
  `d.dataset.textSize=z.indexOf(s.textSize)>=0?s.textSize:${JSON.stringify(DEFAULT_TEXT_SIZE)};` +
  `if(s.boldText===true){d.dataset.bold="1";}else{delete d.dataset.bold;}`;
