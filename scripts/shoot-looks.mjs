#!/usr/bin/env node
/**
 * Screenshot every Mode × Look combo (plus zoomed cork boards, the picker, and a
 * custom-ink Riso variant) at a phone viewport.
 *
 *   node scripts/shoot-looks.mjs [baseUrl] [--only=substr] [--pages] [--narrow] [--backup]
 *
 * Writes to docs/preview/looks/. Uses the app's starter scraps (no saved entries).
 * --pages   Keep / kept detail / Calendar / empty shelf per combo → pages/
 * --narrow  375px shelves + zooms, and every Riso title × body font → narrow/
 * --backup  "Keep them safe" section, restore confirm, backup nudge → backup/
 *
 * Every shot also checks that board / tab / label names are shown in full
 * (no ellipsis, no overflow, max two lines) and exits non-zero if not.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:5188").replace(/\/$/, "");
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const pages = args.includes("--pages");
const narrow = args.includes("--narrow");
const backup = args.includes("--backup");
const outDir = join(process.cwd(), "docs", "preview", "looks");
for (const sub of ["pages", "narrow", "backup"]) mkdirSync(join(outDir, sub), { recursive: true });

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

if (narrow) {
  for (const mode of MODES) {
    for (const look of LOOKS) {
      shots.push({ name: `narrow/${mode}-${look}-375`, state: { mode, look }, path: "/", width: 375 });
      if (mode === "corkboard") {
        shots.push({ name: `narrow/${mode}-${look}-zoom-375`, state: { mode, look }, path: `/?spread=${ZOOM_BUCKET}`, width: 375 });
      }
    }
  }
  const TITLE_FONTS = ["kaushan", "caveat-brush", "dm-serif", "permanent-marker"];
  const BODY_FONTS = ["patrick", "courier", "karla"];
  for (const titleFont of TITLE_FONTS) {
    for (const bodyFont of BODY_FONTS) {
      const riso = { pair: "rose-navy", inkA: "#d9849a", inkB: "#23305e", titleFont, bodyFont };
      for (const [mode, path, tag] of [["corkboard", "/", ""], ["corkboard", `/?spread=${ZOOM_BUCKET}`, "-zoom"], ["scrapbook", "/", ""]]) {
        shots.push({
          name: `narrow/${mode}-riso-${titleFont}-${bodyFont}${tag}-375`,
          state: { mode, look: "riso", riso },
          path,
          width: 375,
          // keep the repo light: only save the widest body font; still check all 12
          noShot: bodyFont !== "courier" || mode === "scrapbook",
        });
      }
    }
  }
}

function userEntries(n, { prefix = "u", start = Date.parse("2026-09-02"), withPhoto = false } = {}) {
  const kinds = ["note", "person", "event", "thing", "moment", "win", "place", "food", "dream"];
  const titles = ["Aunt Rosa's lemon cake", "Bus 14 driver who waves", "Seed swap at the library", "The good umbrella", "Lake day with Ines", "Fixed the bike chain", "Corner cafe, window seat", "Tomato soup, extra pepper", "Flying over the old school", "Book club: chapter 9", "Nora's new puppy", "Farmers market tote", "Bell tower at dusk", "Learned the chord"];
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i}`,
    kind: kinds[i % kinds.length],
    status: ["fresh", "soft", "keepsake"][i % 3],
    title: titles[i % titles.length],
    how: "",
    facts: "",
    note: "",
    createdAt: start + i * 3600_000,
    updatedAt: start + i * 3600_000,
    ...(withPhoto && i === 1 ? { photo: TINY_JPEG } : {}),
  }));
}
const TINY_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

let backupFile = null;
if (backup) {
  const tmp = mkdtempSync(join(tmpdir(), "pm-shoot-"));
  backupFile = join(tmp, "pocketmemoir-backup-2026-09-24.json");
  const entries = userEntries(14, { withPhoto: true });
  writeFileSync(
    backupFile,
    JSON.stringify({
      format: "pocketmemoir-backup",
      version: 1,
      app: "PocketMemoir",
      exportedAt: new Date(2026, 8, 24, 15, 10).toISOString(),
      counts: { scraps: 14, photos: 1 },
      settings: { mode: "corkboard", look: "comic", riso: {} },
      entries,
    }),
  );
  // 9 here now: 6 of them also in the file, 3 only here → merge adds 8
  const here = [...userEntries(6), ...userEntries(3, { prefix: "h", start: Date.parse("2026-09-22") })];
  const combos = [
    ["scrapbook", "storybook", "merge"],
    ["corkboard", "comic", "merge"],
    ["corkboard", "riso", "replace"],
    ["scrapbook", "riso", "merge"],
    ["corkboard", "storybook", "replace"],
    ["scrapbook", "comic", "replace"],
  ];
  for (const [mode, look, choice] of combos) {
    const state = { mode, look, entries: here, lastBackupAt: new Date(2026, 8, 12, 12).getTime() };
    shots.push({ name: `backup/${mode}-${look}-section`, state, path: "/", backupSection: true });
    shots.push({ name: `backup/${mode}-${look}-confirm`, state, path: "/", restoreConfirm: choice });
  }
  for (const [mode, look] of [["scrapbook", "riso"], ["corkboard", "storybook"], ["scrapbook", "comic"]]) {
    const recent = userEntries(12, { prefix: "n", start: Date.now() - 86_400_000 });
    shots.push({ name: `backup/${mode}-${look}-nudge`, state: { mode, look, entries: recent }, path: "/", viewportOnly: true });
  }
}

/** Names must show in full: no ellipsis, no clipped overflow, ≤ 2 lines, inside their board. */
async function checkNames(page) {
  return page.evaluate(() => {
    const bad = [];
    const sels = [".cork-mini-label", ".flip-tab-label", ".cork-zoom-title", ".cork-zoom-plaque", ".flip-page-title"];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        const text = el.textContent.trim();
        if (!text) continue;
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
    for (const el of document.querySelectorAll('[class*="tone--"], [class*="tear--"], [class*="strip--"]')) {
      bad.push(`negative seeded class on .${[...el.classList].join(".")}`);
    }
    return bad;
  });
}

const browser = await chromium.launch();
let failures = 0;
for (const shot of shots) {
  if (only && !shot.name.includes(only)) continue;
  const context = await browser.newContext({
    viewport: { width: shot.width ?? 430, height: 932 },
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
  if (shot.backupSection || shot.restoreConfirm) {
    await page.getByRole("button", { name: /^Look/ }).click();
    await page.waitForSelector(".picker-dialog");
    await page.locator("#keep-safe").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300);
  }
  if (shot.restoreConfirm) {
    await page.getByTestId("backup-file").setInputFiles(backupFile);
    const dialog = page.getByRole("alertdialog");
    await dialog.waitFor();
    if (shot.restoreConfirm === "replace") await dialog.getByRole("radio", { name: /Replace everything/ }).click();
    await page.waitForTimeout(300);
  }
  const names = await checkNames(page);
  if (names.length) errors.push(`NAMES: ${names.join("; ")}`);
  const file = join(outDir, `${shot.name}.png`);
  if (!shot.noShot) {
    const viewportOnly = shot.viewportOnly || shot.backupSection || shot.restoreConfirm;
    await page.screenshot({ path: file, fullPage: !viewportOnly });
  }
  const attrs = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  console.log(`${shot.name}: mode=${attrs.mode} look=${attrs.look}${shot.noShot ? " (checked only)" : ""}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
  if (errors.length) failures++;
  await context.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
