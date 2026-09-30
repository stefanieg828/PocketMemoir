/**
 * tourSeen persist merge — hydration ordering / stale rehydrate clobber /
 * dual-write pocketmemoir.tourSeen flag + Play TWA pocketmemoir.twa.tourSeen.
 *   node --test scripts/tour-seen.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let resolveTourSeen;
let readTourSeenFlag;
let writeTourSeenFlag;
let tourSeenFlagKey;
let isPreTourLegacySave;
let TOUR_SEEN_FLAG_KEY;
let TOUR_SEEN_TWA_FLAG_KEY;
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
  tourSeenFlagKey = mod.tourSeenFlagKey;
  isPreTourLegacySave = mod.isPreTourLegacySave;
  TOUR_SEEN_FLAG_KEY = mod.TOUR_SEEN_FLAG_KEY;
  TOUR_SEEN_TWA_FLAG_KEY = mod.TOUR_SEEN_TWA_FLAG_KEY;
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

  it("does not treat factory defaults / seed shelf as legacy (TWA drop of tourSeen)", () => {
    // Fresh install persists seeds + mode/look; if TWA drops tourSeen from the
    // blob, legacy must NOT skip the tour.
    assert.equal(resolveTourSeen({ mode: "scrapbook" }, false, false, null), false);
    assert.equal(resolveTourSeen({ look: "storybook" }, false, false, null), false);
    assert.equal(resolveTourSeen({ jacket: "corkboard" }, false, false, null), false);
    assert.equal(resolveTourSeen({ entries: [] }, false, false, null), false);
    assert.equal(
      resolveTourSeen(
        {
          mode: "scrapbook",
          look: "storybook",
          entries: [{ id: "seed-wifi", title: "wifi" }],
        },
        false,
        false,
        null,
      ),
      false,
    );
  });

  it("treats real pre-tour use (no tourSeen) as seen", () => {
    assert.equal(
      resolveTourSeen({ entries: [{ id: "kept-1", title: "mine" }] }, false, false, null),
      true,
    );
    assert.equal(resolveTourSeen({ unlocked: true }, false, false, null), true);
    assert.equal(resolveTourSeen({ lastBackupAt: 1 }, false, false, null), true);
    assert.equal(resolveTourSeen({ a2hsTipDismissed: true }, false, false, null), true);
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

  it("Play TWA with missing twa flag ignores Chrome blob tourSeen (fresh first open)", () => {
    // Shared origin: Chrome already dismissed; TWA flag never set → show tour.
    assert.equal(
      resolveTourSeen({ tourSeen: true }, false, false, null, { twa: true }),
      false,
    );
    assert.equal(
      resolveTourSeen(
        {
          tourSeen: true,
          shelfLedeDismissed: true,
          entries: [{ id: "kept-1", title: "mine" }],
          unlocked: true,
        },
        false,
        false,
        null,
        { twa: true },
      ),
      false,
    );
    // Once the user skips in TWA, the twa flag wins.
    assert.equal(
      resolveTourSeen({ tourSeen: false }, false, false, true, { twa: true }),
      true,
    );
    // Look → show again in TWA (flag "0").
    assert.equal(
      resolveTourSeen({ tourSeen: true }, true, false, false, { twa: true }),
      false,
    );
  });
});

describe("isPreTourLegacySave", () => {
  it("rejects factory defaults and seed-only shelves", () => {
    assert.equal(isPreTourLegacySave(null), false);
    assert.equal(isPreTourLegacySave({}), false);
    assert.equal(isPreTourLegacySave({ mode: "scrapbook", look: "storybook" }), false);
    assert.equal(
      isPreTourLegacySave({ entries: [{ id: "seed-wifi", title: "wifi" }] }),
      false,
    );
  });

  it("detects real prior use", () => {
    assert.equal(isPreTourLegacySave({ entries: [{ id: "abc", title: "x" }] }), true);
    assert.equal(isPreTourLegacySave({ unlocked: true }), true);
    assert.equal(isPreTourLegacySave({ pageStickers: [{ id: "s1" }] }), true);
    assert.equal(isPreTourLegacySave({ categories: { names: { people: "folks" } } }), true);
  });
});

describe("tourSeen dual-write flag", () => {
  it("uses pocketmemoir.tourSeen (Chrome) and pocketmemoir.twa.tourSeen (TWA)", () => {
    assert.equal(TOUR_SEEN_FLAG_KEY, "pocketmemoir.tourSeen");
    assert.equal(TOUR_SEEN_TWA_FLAG_KEY, "pocketmemoir.twa.tourSeen");
    assert.equal(tourSeenFlagKey(false), TOUR_SEEN_FLAG_KEY);
    assert.equal(tourSeenFlagKey(true), TOUR_SEEN_TWA_FLAG_KEY);
  });

  it("writes and reads 1/0 on the Chrome key by default", () => {
    const storage = memoryStorage();
    writeTourSeenFlag(true, storage, false);
    assert.equal(storage.getItem(TOUR_SEEN_FLAG_KEY), "1");
    assert.equal(storage.getItem(TOUR_SEEN_TWA_FLAG_KEY), null);
    assert.equal(readTourSeenFlag(storage, false), true);

    writeTourSeenFlag(false, storage, false);
    assert.equal(storage.getItem(TOUR_SEEN_FLAG_KEY), "0");
    assert.equal(readTourSeenFlag(storage, false), false);
  });

  it("Play TWA writes/reads only the twa key (Chrome flag ignored)", () => {
    const storage = memoryStorage();
    // Chrome already dismissed — must not leak into TWA reads.
    storage.setItem(TOUR_SEEN_FLAG_KEY, "1");
    assert.equal(readTourSeenFlag(storage, true), null);

    writeTourSeenFlag(true, storage, true);
    assert.equal(storage.getItem(TOUR_SEEN_TWA_FLAG_KEY), "1");
    assert.equal(storage.getItem(TOUR_SEEN_FLAG_KEY), "1"); // untouched Chrome key
    assert.equal(readTourSeenFlag(storage, true), true);

    writeTourSeenFlag(false, storage, true);
    assert.equal(storage.getItem(TOUR_SEEN_TWA_FLAG_KEY), "0");
    assert.equal(readTourSeenFlag(storage, true), false);
  });

  it("returns null when missing or unknown", () => {
    const storage = memoryStorage();
    assert.equal(readTourSeenFlag(storage, false), null);
    storage.setItem(TOUR_SEEN_FLAG_KEY, "yes");
    assert.equal(readTourSeenFlag(storage, false), null);
    assert.equal(readTourSeenFlag(null, false), null);
  });

  it("write is a no-op without storage", () => {
    assert.doesNotThrow(() => writeTourSeenFlag(true, null, false));
  });
});
