import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

describe("unlock success URL", () => {
  it("accepts ?unlock=success and ?unlocked=1", () => {
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlock=success"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlocked=1"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlocked=true"), true);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/"), false);
    assert.equal(readUnlockSuccessFromUrl("https://pocketmemoir.fun/?unlock=cancel"), false);
  });
});
