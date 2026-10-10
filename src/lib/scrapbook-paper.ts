import { hashSeed } from "@/lib/utils";

/** Scrapbook album page surface presets (CSS classes: album-paper-{id}). */
export const SCRAPBOOK_PAPERS = [
  "cream-ruled",
  "blush-dots",
  "mint-grid",
  "kraft-flecks",
  "lavender-dots",
  "floral-washi",
] as const;

export type ScrapbookPaper = (typeof SCRAPBOOK_PAPERS)[number];

export function isScrapbookPaper(value: unknown): value is ScrapbookPaper {
  return typeof value === "string" && (SCRAPBOOK_PAPERS as readonly string[]).includes(value);
}

/** Stable paper pick from any id string (shelf contents, route, etc.). */
export function paperFor(seed: string): ScrapbookPaper {
  const n = hashSeed(seed);
  return SCRAPBOOK_PAPERS[n % SCRAPBOOK_PAPERS.length]!;
}

/** CSS class for an album page surface. */
export function paperClassName(paper: ScrapbookPaper): string {
  return `album-paper-${paper}`;
}

/**
 * Paper for the shelf album: empty pages share one seed; filled pages hash
 * sorted entry ids so the surface stays stable as you browse, and changes
 * when the set of scraps on the page changes.
 */
export function paperForShelf(entryIds: readonly string[]): ScrapbookPaper {
  if (entryIds.length === 0) return paperFor("new-album");
  // Include length so adding/removing a scrap can turn the page.
  return paperFor([...entryIds].sort().join("+") + `:${entryIds.length}`);
}
