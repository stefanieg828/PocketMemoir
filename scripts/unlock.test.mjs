import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Pure URL helpers mirrored from src/lib/memoir/unlock.ts for node tests
 * (Vite import.meta.env isn't available under plain node --test).
 */
function readUnlockSuccessFromUrl(href) {
  try {
    const url = new URL(href);
    const unlock = url.searchParams.get("unlock");
    const unlocked = url.searchParams.get("unlocked");
    return unlock === "success" || unlocked === "1" || unlocked === "true";
  } catch {
    return false;
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const unlockSrc = readFileSync(join(root, "src/lib/memoir/unlock.ts"), "utf8");

describe("unlock success URL", () => {
  it("accepts ?unlock=success and ?unlocked=1", () => {
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlock=success"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlocked=1"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlocked=true"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/"), false);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlock=cancel"), false);
  });
});

describe("stripe payment link wiring", () => {
  it("bakes the live buy link as the default Payment Link", () => {
    assert.match(
      unlockSrc,
      /https:\/\/buy\.stripe\.com\/7sY8wR0jHgGh8FWbFF6Vq00/,
    );
    assert.match(unlockSrc, /VITE_STRIPE_PAYMENT_LINK/);
  });

  it("names plans all-lowercase little scraps / big scraps", () => {
    assert.match(unlockSrc, /PLAN_FREE_NAME = "little scraps"/);
    assert.match(unlockSrc, /PLAN_PAID_NAME = "big scraps"/);
    assert.doesNotMatch(unlockSrc, /PLAN_FREE_NAME = "Little scraps"/);
    assert.doesNotMatch(unlockSrc, /PLAN_PAID_NAME = "Big scraps"/);
  });
});
