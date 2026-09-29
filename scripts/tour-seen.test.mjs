/**
 * tourSeen persist merge — hydration ordering / stale rehydrate clobber /
 * dual-write pocketmemoir.tourSeen flag for TWA durability.
 *   node --test scripts/tour-seen.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let resolveTourSeen;
let readTourSeenFlag;
let writeTourSeenFlag;
let TOUR_SEEN_FLAG_KEY;
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
  const mod = await server.ssrLoadModule("/src/lib/memoir/tour-seen.ts");
  resolveTourSeen = mod.resolveTourSeen;
  readTourSeenFlag = mod.readTourSeenFlag;
  writeTourSeenFlag = mod.writeTourSeenFlag;
  TOUR_SEEN_FLAG_KEY = mod.TOUR_SEEN_FLAG_KEY;
});

after(async () => {
  await server?.close();
});

describe("resolveTourSeen", () => {
  it("shows the tour on a brand-new browser (no persisted state)", () => {
    assert.equal(resolveTourSeen(undefined, false, false, null), false);
    assert.equal(resolveTourSeen(null, false, false, null), false);
  });

  it("honors an explicit tourSeen boolean from storage", () => {
    assert.equal(resolveTourSeen({ tourSeen: true }, false, false, null), true);
    assert.equal(resolveTourSeen({ tourSeen: false }, true, false, null), false);
  });

  it("treats pre-tour legacy saves (shelf/settings, no tourSeen) as seen", () => {
    assert.equal(resolveTourSeen({ mode: "scrapbook" }, false, false, null), true);
    assert.equal(resolveTourSeen({ look: "storybook" }, false, false, null), true);
    assert.equal(resolveTourSeen({ jacket: "corkboard" }, false, false, null), true);
    assert.equal(resolveTourSeen({ entries: [] }, false, false, null), true);
  });

  it("does not treat empty {} as legacy", () => {
    assert.equal(resolveTourSeen({}, false, false, null), false);
  });

  it("keeps the live value once already hydrated (stale rehydrate must not clobber)", () => {
    // Race: skip wrote tourSeen:true; late merge still carries stale false.
    assert.equal(resolveTourSeen({ tourSeen: false }, true, true), true);
    // Look → show the tour again wrote false; late merge must not restore true.
    assert.equal(resolveTourSeen({ tourSeen: true }, false, true), false);
    // alreadyHydrated wins even if dual-write flag disagrees.
    assert.equal(resolveTourSeen({ tourSeen: false }, true, true, false), true);
    assert.equal(resolveTourSeen({ tourSeen: true }, false, true, true), false);
  });

  it("prefers dual-write flag over zustand blob on first hydrate", () => {
    // TWA: blob still has tourSeen:false (or missing) but flag says skipped.
    assert.equal(resolveTourSeen({ tourSeen: false }, false, false, true), true);
    assert.equal(resolveTourSeen({}, false, false, true), true);
    assert.equal(resolveTourSeen(undefined, false, false, true), true);
    // Look → show again: flag "0" beats a stale blob true.
    assert.equal(resolveTourSeen({ tourSeen: true }, true, false, false), false);
    // No flag → fall through to blob / legacy (explicit null).
    assert.equal(resolveTourSeen({ tourSeen: true }, false, false, null), true);
  });
});

describe("tourSeen dual-write flag", () => {
  it("uses pocketmemoir.tourSeen as the key", () => {
    assert.equal(TOUR_SEEN_FLAG_KEY, "pocketmemoir.tourSeen");
  });

  it("writes and reads 1/0", () => {
    const storage = memoryStorage();
    writeTourSeenFlag(true, storage);
    assert.equal(storage.getItem(TOUR_SEEN_FLAG_KEY), "1");
    assert.equal(readTourSeenFlag(storage), true);

    writeTourSeenFlag(false, storage);
    assert.equal(storage.getItem(TOUR_SEEN_FLAG_KEY), "0");
    assert.equal(readTourSeenFlag(storage), false);
  });

  it("returns null when missing or unknown", () => {
    const storage = memoryStorage();
    assert.equal(readTourSeenFlag(storage), null);
    storage.setItem(TOUR_SEEN_FLAG_KEY, "yes");
    assert.equal(readTourSeenFlag(storage), null);
    assert.equal(readTourSeenFlag(null), null);
  });

  it("write is a no-op without storage", () => {
    assert.doesNotThrow(() => writeTourSeenFlag(true, null));
  });
});
