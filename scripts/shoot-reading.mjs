#!/usr/bin/env node
/**
 * Reading comfort QA: Look sheet section + shelves / boards at normal vs
 * extra large + bold, across looks, at a 390×844 phone viewport.
 *
 *   node scripts/shoot-reading.mjs [baseUrl] [--out=dir]
 *
 * Also checks: board / tab names shown in full (no ellipsis / clipping, ≤ 2
 * lines), no sideways page overflow, the Look sheet scrolls, the setting
 * persists across reload, and THEME_BOOT applies size/bold with app JS
 * blocked (no flash). Exits non-zero on any failure.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const outDir = args.find((a) => a.startsWith("--out="))?.slice(6) ?? "/workspace/shots/text-size";
mkdirSync(outDir, { recursive: true });

const SEEN = { tourSeen: true, a2hsTipDismissed: true, shelfLedeDismissed: true, corkWallTipDismissed: true };
const XB = { textSize: "xlarge", boldText: true };

const shots = [
  { name: "look-sheet-normal", state: { mode: "scrapbook", look: "storybook" }, picker: true },
  { name: "look-sheet-xlarge-bold", state: { mode: "scrapbook", look: "storybook", ...XB }, picker: true },
  { name: "look-sheet-top-xlarge-bold", state: { mode: "scrapbook", look: "storybook", ...XB }, picker: "top" },
  { name: "look-sheet-riso-large", state: { mode: "scrapbook", look: "riso", unlocked: true, textSize: "large" }, picker: true },
  { name: "look-sheet-comic-xlarge-bold", state: { mode: "corkboard", look: "comic", unlocked: true, ...XB }, picker: true },
  { name: "boards-storybook-normal", state: { mode: "corkboard", look: "storybook" } },
  { name: "boards-storybook-xlarge-bold", state: { mode: "corkboard", look: "storybook", ...XB } },
  { name: "shelf-storybook-normal", state: { mode: "scrapbook", look: "storybook" } },
  { name: "shelf-storybook-xlarge-bold", state: { mode: "scrapbook", look: "storybook", ...XB } },
  { name: "boards-comic-normal", state: { mode: "corkboard", look: "comic", unlocked: true } },
  { name: "boards-comic-xlarge-bold", state: { mode: "corkboard", look: "comic", unlocked: true, ...XB } },
  { name: "boards-riso-normal", state: { mode: "corkboard", look: "riso", unlocked: true } },
  { name: "boards-riso-xlarge-bold", state: { mode: "corkboard", look: "riso", unlocked: true, ...XB } },
  { name: "board-zoom-storybook-xlarge-bold", state: { mode: "corkboard", look: "storybook", ...XB }, path: "/?spread=out" },
  { name: "shelf-riso-xlarge-bold", state: { mode: "scrapbook", look: "riso", unlocked: true, ...XB } },
];

async function checkLayout(page) {
  return page.evaluate(() => {
    const bad = [];
    const sels = [".cork-mini-label", ".flip-tab-label", ".cork-zoom-title", ".cork-zoom-plaque", ".flip-page-title", ".reading-size-name"];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        const text = el.textContent.trim();
        if (!text || !el.getClientRects().length) continue;
        const clipped = el.scrollWidth > el.clientWidth + 1 && cs.overflow !== "visible";
        const ellipsis = cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth;
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const lines = Math.round(el.getBoundingClientRect().height / lh);
        const board = el.closest(".cork-mini-board");
        let outside = false;
        if (board) {
          const r = el.getBoundingClientRect();
          const b = board.getBoundingClientRect();
          outside = r.right > b.right + 6 || r.left < b.left - 6;
        }
        if (clipped || ellipsis || lines > 2 || outside) {
          bad.push(`${sel} "${text}"${clipped ? " clipped" : ""}${ellipsis ? " ellipsis" : ""}${lines > 2 ? ` ${lines} lines` : ""}${outside ? " outside board" : ""}`);
        }
      }
    }
    const sw = document.documentElement.scrollWidth;
    if (sw > window.innerWidth + 1) bad.push(`page overflows sideways (${sw} > ${window.innerWidth})`);
    return bad;
  });
}

async function newContext(browser, state) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript((s) => {
    if (sessionStorage.getItem("qa-seeded")) return;
    sessionStorage.setItem("qa-seeded", "1");
    localStorage.setItem("pocketmemoir.v1", JSON.stringify({ state: s, version: 0 }));
    for (const k of ["tourSeen", "a2hsTipDismissed", "shelfLedeDismissed"]) localStorage.setItem(`pocketmemoir.${k}`, "1");
  }, { ...SEEN, ...state });
  return context;
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let failures = 0;

for (const shot of shots) {
  const context = await newContext(browser, shot.state);
  const page = await context.newPage();
  const errors = [];
  // React #418 (hydration text mismatch on the prerendered page) is pre-existing on the live site.
  page.on("pageerror", (e) => !/Minified React error #418/.test(String(e)) && errors.push(String(e)));
  // getServerSnapshot: pre-existing dev-only React warning from use-pwa-install.
  page.on("console", (m) => m.type() === "error" && !/pinimg|pinterest|googletagmanager|fonts\.g|getServerSnapshot should be cached/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + (shot.path ?? "/"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  if (shot.picker) {
    await page.getByRole("button", { name: /^look/i }).first().click();
    await page.waitForSelector(".picker-dialog");
    await page.waitForTimeout(250);
    const scroll = await page.locator(".picker-dialog").evaluate((el, top) => {
      const canScroll = el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== "visible";
      if (top) return { canScroll, sh: el.scrollHeight, ch: el.clientHeight };
      document.getElementById("reading-comfort")?.scrollIntoView({ block: "start" });
      // keep the tail of "2 look" in frame so the new section reads in context
      el.scrollTop -= Math.round(el.clientHeight * 0.3);
      return { canScroll, sh: el.scrollHeight, ch: el.clientHeight };
    }, shot.picker === "top");
    if (!scroll.canScroll) errors.push(`look sheet does not scroll (${scroll.sh}/${scroll.ch})`);
    await page.waitForTimeout(300);
  }
  errors.push(...(await checkLayout(page)).map((b) => `LAYOUT: ${b}`));
  const file = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: !shot.picker });
  const info = await page.evaluate(() => ({
    ...document.documentElement.dataset,
    rootPx: getComputedStyle(document.documentElement).fontSize,
    bodyWeight: getComputedStyle(document.body).fontWeight,
  }));
  console.log(
    `${shot.name}: look=${info.look} size=${info.textSize} bold=${info.bold ?? "-"} root=${info.rootPx} bodyWeight=${info.bodyWeight}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`,
  );
  if (errors.length) failures++;
  await context.close();
}

// Interaction: pick extra large + bold in the sheet, reload, still applied.
{
  const context = await newContext(browser, { mode: "corkboard", look: "storybook" });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^look/i }).first().click();
  await page.getByRole("radio", { name: /extra large/ }).click();
  await page.getByRole("switch", { name: /bold text/ }).click();
  await page.waitForTimeout(200);
  const live = await page.evaluate(() => [document.documentElement.dataset.textSize, document.documentElement.dataset.bold, getComputedStyle(document.documentElement).fontSize]);
  await page.reload({ waitUntil: "networkidle" });
  const after = await page.evaluate(() => [document.documentElement.dataset.textSize, document.documentElement.dataset.bold, getComputedStyle(document.documentElement).fontSize]);
  const ok = live.join() === "xlarge,1,20.8px" && after.join() === live.join();
  console.log(`interaction+reload: live=${live.join(" ")} afterReload=${after.join(" ")} ${ok ? "OK" : "FAIL"}`);
  if (!ok) failures++;
  await context.close();
}

// No flash: block app JS so only the inline THEME_BOOT runs.
{
  const context = await newContext(browser, { mode: "scrapbook", look: "comic", unlocked: true, ...XB });
  await context.route(/\.(m?js|tsx?)(\?.*)?$/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const boot = await page.evaluate(() => [document.documentElement.dataset.textSize, document.documentElement.dataset.bold, getComputedStyle(document.documentElement).fontSize]);
  const ok = boot.join() === "xlarge,1,20.8px";
  console.log(`boot (app JS blocked): ${boot.join(" ")} ${ok ? "OK" : "FAIL"}`);
  if (!ok) failures++;
  await context.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
