/** Public origin for self-referencing canonical URLs and the sitemap. */
export const SITE_ORIGIN = "https://pocketmemoir.fun";

/**
 * Build a canonical URL: origin + path, with no trailing slash and no
 * `index.html`. Query strings and hashes are dropped.
 */
export function canonicalUrl(path: string): string {
  const raw = path.trim() || "/";
  let cleaned = (raw.split(/[?#]/, 1)[0] ?? raw).replace(/\/index\.html$/i, "");
  if (cleaned.length > 1) cleaned = cleaned.replace(/\/+$/, "");
  if (cleaned === "" || cleaned === "/") return SITE_ORIGIN;
  if (!cleaned.startsWith("/")) cleaned = `/${cleaned}`;
  return `${SITE_ORIGIN}${cleaned}`;
}
