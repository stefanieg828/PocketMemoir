#!/usr/bin/env node
/**
 * Screenshot every Mode × Look combo (plus zoomed cork boards, the picker, and a
 * custom-ink Riso variant) at a phone viewport.
 *
 *   node scripts/shoot-looks.mjs [baseUrl] [--only=substr] [--pages]
 *
 * Writes to docs/preview/looks/. Uses the app's starter scraps (no saved entries).
 * --pages also shoots Keep / kept detail / Calendar / empty shelf per combo into
 * docs/preview/looks/pages/.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:5188").replace(/\/$/, "");
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const pages = args.includes("--pages");
const outDir = join(process.cwd(), "docs", "preview", "looks");
mkdirSync(join(outDir, "pages"), { recursive: true });

const MODES = ["scrapbook", "corkboard"];
const LOOKS = ["storybook", "comic", "riso"];
const ZOOM_BUCKET = "out";

const shots = [];
for (const mode of MODES) {
  for (const look of LOOKS) {
    shots.push({ name: `${mode}-${look}`, state: { mode, look }, path: "/" });
    if (mode === "corkboard") {
      shots.push({ name: `${mode}-${look}-zoom`, state: { mode, look }, path: `/?spread=${ZOOM_BUCKET}` });
    }
  }
}
shots.push({ name: "picker-riso", state: { mode: "scrapbook", look: "riso" }, path: "/", picker: true });
shots.push({
  name: "scrapbook-riso-custom",
  state: {
    mode: "scrapbook",
    look: "riso",
    riso: { pair: "custom", inkA: "#e0a92e", inkB: "#1b6b73", titleFont: "dm-serif", bodyFont: "courier" },
  },
  path: "/",
});
shots.push({
  name: "corkboard-riso-custom",
  state: {
    mode: "corkboard",
    look: "riso",
    riso: { pair: "custom", inkA: "#e0a92e", inkB: "#1b6b73", titleFont: "dm-serif", bodyFont: "courier" },
  },
  path: "/",
});

if (pages) {
  for (const mode of MODES) {
    for (const look of LOOKS) {
      const state = { mode, look };
      shots.push({ name: `pages/${mode}-${look}-keep`, state, path: "/keep" });
      shots.push({ name: `pages/${mode}-${look}-kept`, state, path: "/kept/seed-sam" });
      shots.push({ name: `pages/${mode}-${look}-calendar`, state, path: "/calendar" });
      shots.push({ name: `pages/${mode}-${look}-empty`, state: { ...state, entries: [] }, path: "/" });
    }
  }
}

const browser = await chromium.launch();
let failures = 0;
for (const shot of shots) {
  if (only && !shot.name.includes(only)) continue;
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript((state) => {
    window.localStorage.setItem("pocketmemoir.v1", JSON.stringify({ state, version: 0 }));
  }, shot.state);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + shot.path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  if (shot.picker) {
    await page.getByRole("button", { name: /^Look/ }).click();
    await page.waitForSelector(".picker-dialog");
    await page.addStyleTag({
      content:
        ".picker-dialog{max-height:none!important;position:absolute!important;top:12px!important;translate:-50% 0!important;transform:none!important}",
    });
    await page.waitForTimeout(400);
  }
  const file = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  const attrs = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  console.log(`${shot.name}: mode=${attrs.mode} look=${attrs.look}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
  if (errors.length) failures++;
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
