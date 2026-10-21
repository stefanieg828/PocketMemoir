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

  it("never silently swallows PaymentRequest aborts (TWA reports Play failures as cancel)", () => {
    assert.doesNotMatch(sheet, /abort\|cancel\|dismiss/);
    assert.match(sheet, /classifyPlayError/);
    assert.match(src, /getDetails\(\[PLAY_SKU_BIG_SCRAPS\]\)/);
  });

  it("UnlockSheet never renders a disabled Play CTA and has a billing debug readout", () => {
    assert.doesNotMatch(sheet, /Play Billing next/);
    assert.match(sheet, /debug=billing|"billing"/);
  });

  it("AppShell restores owned big_scraps purchases", () => {
    assert.match(shell, /restoreBigScraps/);
    assert.match(shell, /getPlayBillingService/);
  });
});
