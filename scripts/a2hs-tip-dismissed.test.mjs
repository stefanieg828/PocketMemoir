/**
 * a2hsTipDismissed persist merge — hydration ordering / stale rehydrate clobber /
 * dual-write pocketmemoir.a2hsTipDismissed flag for TWA durability.
 *   node --test scripts/a2hs-tip-dismissed.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let resolveA2hsTipDismissed;
let readA2hsTipDismissedFlag;
let writeA2hsTipDismissedFlag;
let A2HS_TIP_DISMISSED_FLAG_KEY;
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
  const mod = await server.ssrLoadModule("/src/lib/memoir/a2hs-tip-dismissed.ts");
  resolveA2hsTipDismissed = mod.resolveA2hsTipDismissed;
  readA2hsTipDismissedFlag = mod.readA2hsTipDismissedFlag;
  writeA2hsTipDismissedFlag = mod.writeA2hsTipDismissedFlag;
  A2HS_TIP_DISMISSED_FLAG_KEY = mod.A2HS_TIP_DISMISSED_FLAG_KEY;
});

after(async () => {
  await server?.close();
});

describe("resolveA2hsTipDismissed", () => {
  it("shows the tip on a brand-new browser (no persisted state)", () => {
    assert.equal(resolveA2hsTipDismissed(undefined, false, false, null), false);
    assert.equal(resolveA2hsTipDismissed(null, false, false, null), false);
  });

  it("honors an explicit a2hsTipDismissed boolean from storage", () => {
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: true }, false, false, null), true);
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: false }, true, false, null), false);
  });

  it("keeps current when blob omits the field", () => {
    assert.equal(resolveA2hsTipDismissed({}, false, false, null), false);
    assert.equal(resolveA2hsTipDismissed({ tourSeen: true }, false, false, null), false);
  });

  it("keeps the live value once already hydrated (stale rehydrate must not clobber)", () => {
    // Race: X wrote a2hsTipDismissed:true; late merge still carries stale false.
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: false }, true, true), true);
    // alreadyHydrated wins even if dual-write flag disagrees.
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: false }, true, true, false), true);
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: true }, false, true, true), false);
  });

  it("prefers dual-write flag over zustand blob on first hydrate", () => {
    // TWA: blob still has a2hsTipDismissed:false (or missing) but flag says dismissed.
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: false }, false, false, true), true);
    assert.equal(resolveA2hsTipDismissed({}, false, false, true), true);
    assert.equal(resolveA2hsTipDismissed(undefined, false, false, true), true);
    // Flag "0" beats a stale blob true.
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: true }, true, false, false), false);
    // No flag → fall through to blob (explicit null).
    assert.equal(resolveA2hsTipDismissed({ a2hsTipDismissed: true }, false, false, null), true);
  });
});

describe("a2hsTipDismissed dual-write flag", () => {
  it("uses pocketmemoir.a2hsTipDismissed as the key", () => {
    assert.equal(A2HS_TIP_DISMISSED_FLAG_KEY, "pocketmemoir.a2hsTipDismissed");
  });

  it("writes and reads 1/0", () => {
    const storage = memoryStorage();
    writeA2hsTipDismissedFlag(true, storage);
    assert.equal(storage.getItem(A2HS_TIP_DISMISSED_FLAG_KEY), "1");
    assert.equal(readA2hsTipDismissedFlag(storage), true);

    writeA2hsTipDismissedFlag(false, storage);
    assert.equal(storage.getItem(A2HS_TIP_DISMISSED_FLAG_KEY), "0");
    assert.equal(readA2hsTipDismissedFlag(storage), false);
  });

  it("returns null when missing or unknown", () => {
    const storage = memoryStorage();
    assert.equal(readA2hsTipDismissedFlag(storage), null);
    storage.setItem(A2HS_TIP_DISMISSED_FLAG_KEY, "yes");
    assert.equal(readA2hsTipDismissedFlag(storage), null);
    assert.equal(readA2hsTipDismissedFlag(null), null);
  });

  it("write is a no-op without storage", () => {
    assert.doesNotThrow(() => writeA2hsTipDismissedFlag(true, null));
  });
});
