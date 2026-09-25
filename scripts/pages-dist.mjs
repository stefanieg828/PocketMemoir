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
  console.error("[pages-dist] missing .vercel/output/static — run vite build with GITHUB_PAGES first");
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
writeFileSync(indexPath, cleaned);
writeFileSync(join(dest, "404.html"), cleaned);
writeFileSync(join(dest, ".nojekyll"), "");

// Custom domain for GitHub Pages (also copied from public/ via Vite when present).
const cnameSrc = join(root, "public", "CNAME");
const cnameBody = existsSync(cnameSrc)
  ? readFileSync(cnameSrc, "utf8").trim()
  : "pocketmemoir.fun";
writeFileSync(join(dest, "CNAME"), `${cnameBody}\n`);

console.log("[pages-dist] wrote dist/ from .vercel/output/static (SPA + 404 fallback)");
