import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/memoir/play-billing.ts"), "utf8");
const sheet = readFileSync(join(root, "src/components/unlock-sheet.tsx"), "utf8");
const shell = readFileSync(join(root, "src/components/app-shell.tsx"), "utf8");

describe("play billing wiring", () => {
  it("uses SKU big_scraps and Play billing method", () => {
    assert.match(src, /PLAY_SKU_BIG_SCRAPS = "big_scraps"/);
    assert.match(src, /https:\/\/play\.google\.com\/billing/);
    assert.match(src, /setUnlocked|purchaseBigScraps|restoreBigScraps/);
  });

  it("UnlockSheet imports Play path and prefers it over Stripe in TWA", () => {
    assert.match(sheet, /from "@\/lib\/memoir\/play-billing"/);
    assert.match(sheet, /purchaseBigScraps/);
    assert.match(sheet, /shouldPreferPlayBilling/);
  });

  it("AppShell restores owned big_scraps purchases", () => {
    assert.match(shell, /restoreBigScraps/);
    assert.match(shell, /getPlayBillingService/);
  });
});
