#!/usr/bin/env node
/**
 * Harvest the TanStack Start / Nitro Vercel static dir into `dist/` for GitHub Pages.
 * Strips accidental NUL bytes from prerendered HTML and duplicates index → 404.html
 * so client routes resolve on project Pages.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, ".vercel", "output", "static");
const dest = join(root, "dist");

if (!existsSync(src)) {
  console.error(
    "[pages-dist] missing .vercel/output/static — run vite build with GITHUB_PAGES first",
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const indexPath = join(dest, "index.html");
if (!existsSync(indexPath)) {
  console.error("[pages-dist] no index.html in static output");
  process.exit(1);
}

const cleaned = readFileSync(indexPath).filter((b) => b !== 0);

/** Public origin used for self-referencing canonical tags. */
const SITE_ORIGIN = "https://pocketmemoir.fun";

/** Paths that should have a 200 HTML file on GitHub Pages (foo.html → /foo). */
const PRERENDERED_ROUTES = ["/", "/calendar", "/keep"];

function canonicalHref(path) {
  if (path === "/" || path === "") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path}`;
}

/**
 * Ensure a self-referencing canonical is present (or replace an existing one)
 * so each route file tells Google its own URL, not /index.html.
 */
function withCanonical(htmlBuf, path) {
  const href = canonicalHref(path);
  let html = Buffer.from(htmlBuf).toString("utf8");
  const tag = `<link rel="canonical" href="${href}"/>`;
  if (/rel=["']canonical["']/.test(html)) {
    html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag);
  } else if (html.includes("</head>")) {
    html = html.replace("</head>", `${tag}</head>`);
  }
  return Buffer.from(html);
}

const indexHtml = withCanonical(cleaned, "/");
writeFileSync(indexPath, indexHtml);
// SPA fallback for client-only routes such as /kept/:id.
writeFileSync(join(dest, "404.html"), indexHtml);
writeFileSync(join(dest, ".nojekyll"), "");

// Real files so /calendar and /keep return 200 instead of the 404 shell,
// each with its own canonical and no trailing-slash directory redirect.
for (const path of PRERENDERED_ROUTES) {
  if (path === "/") continue;
  writeFileSync(join(dest, `${path.slice(1)}.html`), withCanonical(cleaned, path));
}

// Custom domain for GitHub Pages (also copied from public/ via Vite when present).
const cnameSrc = join(root, "public", "CNAME");
const cnameBody = existsSync(cnameSrc) ? readFileSync(cnameSrc, "utf8").trim() : "pocketmemoir.fun";
writeFileSync(join(dest, "CNAME"), `${cnameBody}\n`);

console.log("[pages-dist] wrote dist/ from .vercel/output/static (SPA + 404 fallback)");
