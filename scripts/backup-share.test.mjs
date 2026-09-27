/**
 * Share abort detection for Keep them safe → Share.
 *   node --test scripts/backup-share.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let isShareAbort;
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
  // stub minimal browser globals backup-io touches at import/call time
  globalThis.navigator ??= {};
  const mod = await server.ssrLoadModule("/src/lib/memoir/backup-io.ts");
  isShareAbort = mod.isShareAbort;
});

after(async () => {
  await server?.close();
});

describe("isShareAbort", () => {
  it("treats AbortError / CancellationError as cancel, not failure", () => {
    assert.equal(isShareAbort(Object.assign(new Error("x"), { name: "AbortError" })), true);
    assert.equal(isShareAbort({ name: "AbortError" }), true);
    assert.equal(isShareAbort({ name: "CancellationError" }), true);
  });

  it("does not treat real share failures as cancel", () => {
    assert.equal(isShareAbort(Object.assign(new Error("x"), { name: "NotAllowedError" })), false);
    assert.equal(isShareAbort(Object.assign(new Error("x"), { name: "DataError" })), false);
    assert.equal(isShareAbort(new Error("fail")), false);
    assert.equal(isShareAbort(null), false);
    assert.equal(isShareAbort("AbortError"), false);
  });
});
