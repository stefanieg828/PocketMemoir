#!/usr/bin/env node
/**
 * End-to-end backup round-trip in a real browser (Playwright, phone viewport):
 *   seed scraps (incl. a photo) + corkboard/riso custom inks
 *   → Save a backup (through the UI)  → wipe browser storage
 *   → Restore from a file (through the UI, "Replace")  → compare everything.
 * Then: merge restore keeps a newer scrap, and a junk file shows a friendly error.
 *
 *   node scripts/backup-roundtrip.mjs [baseUrl]
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const base = (process.argv[2] ?? "http://127.0.0.1:5188").replace(/\/$/, "");
const KEY = "pocketmemoir.v1";
const dir = mkdtempSync(join(tmpdir(), "pm-roundtrip-"));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const readState = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null")?.state ?? null, KEY);
async function openKeepSafe() {
  await page.getByRole("button", { name: /^Look/ }).click();
  await page.locator("#keep-safe").scrollIntoViewIfNeeded();
}
const step = (msg) => console.log(`✓ ${msg}`);

// 1. Seed
await page.goto(base + "/", { waitUntil: "networkidle" });
const photo = await page.evaluate(() => {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 48;
  const g = c.getContext("2d");
  g.fillStyle = "#e0a92e";
  g.fillRect(0, 0, 64, 48);
  g.fillStyle = "#1b6b73";
  g.fillRect(16, 12, 32, 24);
  return c.toDataURL("image/jpeg", 0.8);
});
const day = Date.parse("2026-09-20");
const seeded = {
  mode: "corkboard",
  look: "riso",
  riso: { pair: "custom", inkA: "#e0a92e", inkB: "#1b6b73", titleFont: "dm-serif", bodyFont: "courier" },
  entries: [
    { id: "rt-1", kind: "person", status: "keepsake", title: "Grandma June", how: "Sunday calls.", facts: "likes lilies", note: "", photo, createdAt: day, updatedAt: day },
    { id: "rt-2", kind: "event", status: "fresh", title: "Piano recital", how: "Hall B", facts: "", note: "bring flowers", happenedOn: "2026-10-12", createdAt: day + 1, updatedAt: day + 1 },
    { id: "rt-3", kind: "thing", status: "soft", title: "Blue kettle", how: "", facts: "", note: "", wouldBuyAgain: true, createdAt: day + 2, updatedAt: day + 2 },
    { id: "seed-sam", kind: "person", status: "keepsake", title: "Sam", how: "Coworker.", facts: "allergic to almonds", note: "gave the candle in 2024", createdAt: Date.parse("2024-12-01"), updatedAt: Date.parse("2024-12-01") },
  ],
};
await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify({ state: s, version: 0 })), [KEY, seeded]);
await page.reload({ waitUntil: "networkidle" });
const before = await readState();
assert.equal(before.entries.length, 4);
assert.equal(await page.evaluate(() => document.documentElement.dataset.look), "riso");
step("seeded 4 scraps (1 photo) + corkboard / riso custom inks");

// 2. Save through the UI
await openKeepSafe();
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: "Save a backup" }).click(),
]);
const name = download.suggestedFilename();
assert.match(name, /^pocketmemoir-backup-\d{4}-\d{2}-\d{2}\.json$/);
const file = join(dir, name);
await download.saveAs(file);
const json = JSON.parse(readFileSync(file, "utf8"));
assert.equal(json.format, "pocketmemoir-backup");
assert.equal(json.version, 1);
assert.deepEqual(json.counts, { scraps: 4, photos: 1 });
assert.equal(json.entries.find((e) => e.id === "rt-1").photo, photo);
assert.equal(json.settings.riso.inkB, "#1b6b73");
const afterSave = await readState();
assert.ok(afterSave.lastBackupAt > 0, "lastBackupAt stored");
await page.getByText(/Last saved/).waitFor();
step(`downloaded ${name} (${(readFileSync(file).length / 1024).toFixed(1)} KB), lastBackupAt recorded`);
await page.keyboard.press("Escape");

// 3. Wipe
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
assert.equal(await page.evaluate(() => document.documentElement.dataset.look), "storybook");
assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), "scrapbook");
step("storage cleared: back to starter scraps, scrapbook / storybook");

// 4. Restore (replace is the default on a starter-only shelf)
await openKeepSafe();
await page.getByTestId("backup-file").setInputFiles(file);
const dialog = page.getByRole("alertdialog");
await dialog.waitFor();
const title = await dialog.getByRole("heading").textContent();
assert.match(title, /^Restore 4 scraps from \w{3} \d{1,2}\?$/);
assert.equal(await dialog.getByRole("radio", { name: /Replace everything/ }).getAttribute("aria-checked"), "true");
await dialog.getByRole("button", { name: "Replace with 4 scraps" }).click();
await dialog.waitFor({ state: "detached" });
await page.waitForTimeout(300);
const restored = await readState();
const strip = (s) => ({ entries: s.entries, mode: s.mode, look: s.look, riso: s.riso });
assert.deepEqual(strip(restored), strip(before));
assert.equal(await page.evaluate(() => document.documentElement.dataset.look), "riso");
assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), "corkboard");
await page.reload({ waitUntil: "networkidle" });
assert.deepEqual(strip(await readState()), strip(before));
step(`restored "${title}" → entries, photo, mode, look, riso inks + fonts identical (also after reload)`);

// 5. Merge keeps a newer scrap and adds nothing twice
const withNew = await readState();
withNew.entries.unshift({ id: "rt-new", kind: "note", status: "fresh", title: "Newer scrap", how: "", facts: "", note: "", createdAt: Date.now(), updatedAt: Date.now() });
withNew.entries = withNew.entries.filter((e) => e.id !== "rt-3");
await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify({ state: s, version: 0 })), [KEY, withNew]);
await page.reload({ waitUntil: "networkidle" });
await openKeepSafe();
await page.getByTestId("backup-file").setInputFiles(file);
await dialog.waitFor();
assert.equal(await dialog.getByRole("radio", { name: /Add what's missing/ }).getAttribute("aria-checked"), "true");
await dialog.getByRole("button", { name: "Add 1 scrap" }).click();
await dialog.waitFor({ state: "detached" });
await page.waitForTimeout(300);
const merged = await readState();
assert.deepEqual(merged.entries.map((e) => e.id).sort(), ["rt-1", "rt-2", "rt-3", "rt-new", "seed-sam"]);
step("merge: kept the newer scrap, re-added the missing one, no duplicates");

// 6. Junk file → friendly error, nothing changed
const junk = join(dir, "not-a-backup.json");
writeFileSync(junk, '{"hello": "world"}');
await openKeepSafe();
await page.getByTestId("backup-file").setInputFiles(junk);
const alert = page.locator(".backup-error");
await alert.waitFor();
assert.match(await alert.textContent(), /isn't a PocketMemoir backup/);
assert.equal((await readState()).entries.length, 5);
step(`junk file → "${(await alert.textContent()).trim()}" (nothing changed)`);

assert.deepEqual(errors, [], `page errors: ${errors.join(" | ")}`);
await browser.close();
console.log("\nRound-trip OK");
