/**
 * tourSeen persist merge — hydration ordering / stale rehydrate clobber.
 *   node --test scripts/tour-seen.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let resolveTourSeen;
let server;

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
});

after(async () => {
  await server?.close();
});

describe("resolveTourSeen", () => {
  it("shows the tour on a brand-new browser (no persisted state)", () => {
    assert.equal(resolveTourSeen(undefined, false), false);
    assert.equal(resolveTourSeen(null, false), false);
  });

  it("honors an explicit tourSeen boolean from storage", () => {
    assert.equal(resolveTourSeen({ tourSeen: true }, false), true);
    assert.equal(resolveTourSeen({ tourSeen: false }, true), false);
  });

  it("treats pre-tour legacy saves (shelf/settings, no tourSeen) as seen", () => {
    assert.equal(resolveTourSeen({ mode: "scrapbook" }, false), true);
    assert.equal(resolveTourSeen({ look: "storybook" }, false), true);
    assert.equal(resolveTourSeen({ jacket: "corkboard" }, false), true);
    assert.equal(resolveTourSeen({ entries: [] }, false), true);
  });

  it("does not treat empty {} as legacy", () => {
    assert.equal(resolveTourSeen({}, false), false);
  });

  it("keeps the live value once already hydrated (stale rehydrate must not clobber)", () => {
    // Race: skip wrote tourSeen:true; late merge still carries stale false.
    assert.equal(resolveTourSeen({ tourSeen: false }, true, true), true);
    // Look → show the tour again wrote false; late merge must not restore true.
    assert.equal(resolveTourSeen({ tourSeen: true }, false, true), false);
  });
});
