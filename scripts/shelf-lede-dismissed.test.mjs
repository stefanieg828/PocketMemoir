/**
 * shelfLedeDismissed persist merge — hydration ordering / stale rehydrate clobber /
 * dual-write pocketmemoir.shelfLedeDismissed flag for TWA durability.
 *   node --test scripts/shelf-lede-dismissed.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let resolveShelfLedeDismissed;
let readShelfLedeDismissedFlag;
let writeShelfLedeDismissedFlag;
let SHELF_LEDE_DISMISSED_FLAG_KEY;
let server;

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    _map: map,
  };
}

before(async () => {
  const root = process.cwd();
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false },
    resolve: { alias: { "@": join(root, "src") } },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const mod = await server.ssrLoadModule("/src/lib/memoir/shelf-lede-dismissed.ts");
  resolveShelfLedeDismissed = mod.resolveShelfLedeDismissed;
  readShelfLedeDismissedFlag = mod.readShelfLedeDismissedFlag;
  writeShelfLedeDismissedFlag = mod.writeShelfLedeDismissedFlag;
  SHELF_LEDE_DISMISSED_FLAG_KEY = mod.SHELF_LEDE_DISMISSED_FLAG_KEY;
});

after(async () => {
  await server?.close();
});

describe("resolveShelfLedeDismissed", () => {
  it("shows the tip on a brand-new browser (no persisted state)", () => {
    assert.equal(resolveShelfLedeDismissed(undefined, false, false, null), false);
    assert.equal(resolveShelfLedeDismissed(null, false, false, null), false);
  });

  it("honors an explicit shelfLedeDismissed boolean from storage", () => {
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: true }, false, false, null), true);
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: false }, true, false, null), false);
  });

  it("keeps current when blob omits the field", () => {
    assert.equal(resolveShelfLedeDismissed({}, false, false, null), false);
    assert.equal(resolveShelfLedeDismissed({ tourSeen: true }, false, false, null), false);
  });

  it("keeps the live value once already hydrated (stale rehydrate must not clobber)", () => {
    // Race: X wrote shelfLedeDismissed:true; late merge still carries stale false.
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: false }, true, true), true);
    // alreadyHydrated wins even if dual-write flag disagrees.
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: false }, true, true, false), true);
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: true }, false, true, true), false);
  });

  it("prefers dual-write flag over zustand blob on first hydrate", () => {
    // TWA: blob still has shelfLedeDismissed:false (or missing) but flag says dismissed.
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: false }, false, false, true), true);
    assert.equal(resolveShelfLedeDismissed({}, false, false, true), true);
    assert.equal(resolveShelfLedeDismissed(undefined, false, false, true), true);
    // Flag "0" beats a stale blob true.
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: true }, true, false, false), false);
    // No flag → fall through to blob (explicit null).
    assert.equal(resolveShelfLedeDismissed({ shelfLedeDismissed: true }, false, false, null), true);
  });
});

describe("shelfLedeDismissed dual-write flag", () => {
  it("uses pocketmemoir.shelfLedeDismissed as the key", () => {
    assert.equal(SHELF_LEDE_DISMISSED_FLAG_KEY, "pocketmemoir.shelfLedeDismissed");
  });

  it("writes and reads 1/0", () => {
    const storage = memoryStorage();
    writeShelfLedeDismissedFlag(true, storage);
    assert.equal(storage.getItem(SHELF_LEDE_DISMISSED_FLAG_KEY), "1");
    assert.equal(readShelfLedeDismissedFlag(storage), true);

    writeShelfLedeDismissedFlag(false, storage);
    assert.equal(storage.getItem(SHELF_LEDE_DISMISSED_FLAG_KEY), "0");
    assert.equal(readShelfLedeDismissedFlag(storage), false);
  });

  it("returns null when missing or unknown", () => {
    const storage = memoryStorage();
    assert.equal(readShelfLedeDismissedFlag(storage), null);
    storage.setItem(SHELF_LEDE_DISMISSED_FLAG_KEY, "yes");
    assert.equal(readShelfLedeDismissedFlag(storage), null);
    assert.equal(readShelfLedeDismissedFlag(null), null);
  });

  it("write is a no-op without storage", () => {
    assert.doesNotThrow(() => writeShelfLedeDismissedFlag(true, null));
  });
});
