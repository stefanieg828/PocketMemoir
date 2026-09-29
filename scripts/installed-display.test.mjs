/**
 * isRunningAsInstalledApp — PWA display-mode, iOS standalone, Android TWA referrer.
 *   node --test scripts/installed-display.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let isRunningAsInstalledApp;
let server;

function mm(map) {
  return (query) => ({ matches: Boolean(map[query]) });
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
  const mod = await server.ssrLoadModule("/src/lib/memoir/installed-display.ts");
  isRunningAsInstalledApp = mod.isRunningAsInstalledApp;
});

after(async () => {
  await server?.close();
});

describe("isRunningAsInstalledApp", () => {
  it("is false in a normal browser tab", () => {
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({}),
        navigatorStandalone: false,
        referrer: "https://example.com/",
      }),
      false,
    );
  });

  it("detects display-mode standalone / fullscreen / minimal-ui", () => {
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({ "(display-mode: standalone)": true }),
        navigatorStandalone: false,
        referrer: "",
      }),
      true,
    );
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({ "(display-mode: fullscreen)": true }),
        navigatorStandalone: false,
        referrer: "",
      }),
      true,
    );
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({ "(display-mode: minimal-ui)": true }),
        navigatorStandalone: false,
        referrer: "",
      }),
      true,
    );
  });

  it("detects iOS navigator.standalone", () => {
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({}),
        navigatorStandalone: true,
        referrer: "",
      }),
      true,
    );
  });

  it("detects Android TWA via android-app:// referrer even when display-mode is browser", () => {
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({ "(display-mode: browser)": true }),
        navigatorStandalone: false,
        referrer: "android-app://com.example.pocketmemoir/",
      }),
      true,
    );
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({}),
        navigatorStandalone: false,
        referrer: "android-app://com.stefanie.pocketmemoir",
      }),
      true,
    );
  });

  it("does not treat unrelated referrers as TWA", () => {
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({}),
        navigatorStandalone: false,
        referrer: "https://android-app.example/",
      }),
      false,
    );
    assert.equal(
      isRunningAsInstalledApp({
        matchMedia: mm({}),
        navigatorStandalone: false,
        referrer: "",
      }),
      false,
    );
  });
});
