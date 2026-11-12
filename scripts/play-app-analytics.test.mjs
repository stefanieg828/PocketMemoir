/**
 * Play/TWA GA4: one-shot first open, per-launch open, app_source user property.
 *   node --test scripts/play-app-analytics.test.mjs
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = { VITE_GA_MEASUREMENT_ID: "G-TESTONLY01" };
const OFF = { VITE_GA_MEASUREMENT_ID: "" };

let analytics;
let play;
let installed;
let server;

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    _map: map,
  };
}

function installBrowser({ referrer = "", standalone = false } = {}) {
  const calls = [];
  const local = memoryStorage();
  const session = memoryStorage();
  const win = {
    dataLayer: [],
    localStorage: local,
    sessionStorage: session,
    matchMedia: (query) => ({ matches: standalone && query === "(display-mode: standalone)" }),
  };
  win.gtag = function gtag() {
    calls.push(Array.from(arguments));
  };
  globalThis.window = win;
  globalThis.document = {
    referrer,
    querySelector() {
      return null;
    },
    createElement() {
      return { async: true, src: "" };
    },
    head: { appendChild() {} },
  };
  globalThis.sessionStorage = session;
  return { calls, local, session };
}

function clearBrowser() {
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.sessionStorage;
}

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false },
    resolve: { alias: { "@": join(root, "src") } },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  analytics = await server.ssrLoadModule("/src/lib/memoir/analytics.ts");
  play = await server.ssrLoadModule("/src/lib/memoir/play-app-analytics.ts");
  installed = await server.ssrLoadModule("/src/lib/memoir/installed-display.ts");
});

after(async () => {
  clearBrowser();
  await server?.close();
});

beforeEach(() => {
  clearBrowser();
  analytics.__resetAnalyticsForTests();
  play.__resetPlayAppAnalyticsForTests();
});

function names(calls) {
  return calls.filter((c) => c[0] === "event").map((c) => c[1]);
}

describe("play first-open flag", () => {
  it("uses the TWA-scoped key and only the exact string 1", () => {
    assert.equal(play.PLAY_APP_FIRST_OPEN_FLAG_KEY, "pocketmemoir.twa.playAppFirstOpen");
    const storage = memoryStorage({
      "pocketmemoir.tourSeen": "1",
      "pocketmemoir.v1": JSON.stringify({ state: { tourSeen: true } }),
      "pocketmemoir.playAppFirstOpen": "1",
      [play.PLAY_APP_FIRST_OPEN_FLAG_KEY]: "0",
    });
    assert.equal(play.readPlayAppFirstOpenFlag(storage), false);
    storage.setItem(play.PLAY_APP_FIRST_OPEN_FLAG_KEY, "1");
    assert.equal(play.readPlayAppFirstOpenFlag(storage), true);
    assert.equal(play.readPlayAppFirstOpenFlag(null), false);
  });

  it("write is a no-op when storage throws, and read does not throw", () => {
    const storage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    assert.equal(play.readPlayAppFirstOpenFlag(storage), false);
    assert.equal(play.writePlayAppFirstOpenFlag(storage), false);
  });
});

describe("reportPlayAppAnalytics", () => {
  it("first Play launch sets app_source, fires both events once, and stores the flag", () => {
    const { calls, local, session } = installBrowser({
      referrer: "android-app://fun.pocketmemoir.app",
    });
    local.setItem("pocketmemoir.v1", JSON.stringify({ state: { tourSeen: true } }));
    local.setItem("pocketmemoir.tourSeen", "1");
    local.setItem("pocketmemoir.playAppFirstOpen", "1");

    const result = play.reportPlayAppAnalytics({ env: ENV });
    assert.deepEqual(result, {
      sent: true,
      source: "play_twa",
      firstOpen: true,
      open: true,
    });
    assert.equal(session.getItem("pm.twaSession"), "1");
    assert.equal(local.getItem(play.PLAY_APP_FIRST_OPEN_FLAG_KEY), "1");
    assert.equal(local.getItem("pocketmemoir.tourSeen"), "1");
    assert.equal(local.getItem("pocketmemoir.playAppFirstOpen"), "1");
    assert.equal(local.getItem("pocketmemoir.v1"), JSON.stringify({ state: { tourSeen: true } }));

    assert.equal(calls[0][0], "js");
    assert.equal(calls[1][0], "set");
    assert.equal(calls[1][1], "user_properties");
    assert.deepEqual(calls[1][2], { app_source: "play_twa" });
    assert.equal(calls[2][0], "config");
    assert.equal(calls[2][1], "G-TESTONLY01");
    assert.deepEqual(calls[2][2], {
      send_page_view: false,
      anonymize_ip: true,
      user_properties: { app_source: "play_twa" },
    });
    assert.deepEqual(names(calls), ["play_app_first_open", "play_app_open"]);
    assert.deepEqual(calls[3][2], { app_source: "play_twa" });
    assert.deepEqual(calls[4][2], { app_source: "play_twa" });
    assert.ok(
      calls.findIndex((c) => c[0] === "set") <
        calls.findIndex((c) => c[1] === "play_app_first_open"),
    );

    const again = play.reportPlayAppAnalytics({ env: ENV });
    assert.equal(again.sent, false);
    assert.equal(calls.length, 5);
  });

  it("later launches in the same tab stay Play after the referrer is gone", () => {
    const { calls, local, session } = installBrowser({
      referrer: "android-app://fun.pocketmemoir.app",
    });
    play.reportPlayAppAnalytics({ env: ENV });
    assert.equal(local.getItem(play.PLAY_APP_FIRST_OPEN_FLAG_KEY), "1");

    analytics.__resetAnalyticsForTests();
    play.__resetPlayAppAnalyticsForTests();
    calls.length = 0;
    globalThis.document.referrer = "https://pocketmemoir.fun/";

    const result = play.reportPlayAppAnalytics({ env: ENV });
    assert.equal(result.firstOpen, false);
    assert.equal(result.open, true);
    assert.equal(result.source, "play_twa");
    assert.equal(session.getItem("pm.twaSession"), "1");
    assert.deepEqual(names(calls), ["play_app_open"]);
    assert.deepEqual(calls.find((c) => c[0] === "set")[2], { app_source: "play_twa" });
  });

  it("treats a home-screen install without an android-app referrer as web", () => {
    const { calls, local } = installBrowser({ referrer: "", standalone: true });
    assert.equal(installed.isRunningAsInstalledApp(), true);

    const result = play.reportPlayAppAnalytics({ env: ENV });
    assert.deepEqual(result, { sent: true, source: "web", firstOpen: false, open: false });
    assert.equal(local.getItem(play.PLAY_APP_FIRST_OPEN_FLAG_KEY), null);
    assert.deepEqual(names(calls), []);
    assert.deepEqual(calls.find((c) => c[0] === "set")[2], { app_source: "web" });
    assert.equal(calls.find((c) => c[0] === "config")[2].user_properties.app_source, "web");
  });

  it("does not consume the first-open flag when analytics is off", () => {
    const storage = memoryStorage();
    const { calls } = installBrowser({ referrer: "android-app://fun.pocketmemoir.app" });
    const result = play.reportPlayAppAnalytics({ env: OFF, storage });
    assert.deepEqual(result, { sent: false, source: null, firstOpen: false, open: false });
    assert.equal(storage.getItem(play.PLAY_APP_FIRST_OPEN_FLAG_KEY), null);
    assert.equal(calls.filter((c) => c[0] === "event" || c[0] === "config").length, 0);
  });

  it("still sends the one-shot when storage throws, and retries next launch", () => {
    installBrowser({ referrer: "" });
    const storage = {
      getItem() {
        throw new Error("quota");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    const first = play.reportPlayAppAnalytics({ env: ENV, inTwa: true, storage });
    assert.equal(first.firstOpen, true);
    assert.equal(first.open, true);

    play.__resetPlayAppAnalyticsForTests();
    analytics.__resetAnalyticsForTests();
    const second = play.reportPlayAppAnalytics({ env: ENV, inTwa: true, storage });
    assert.equal(second.firstOpen, true);
  });

  it("leaves unlock_success and page_view params unchanged", () => {
    const { calls } = installBrowser({ referrer: "https://pocketmemoir.fun/" });
    play.reportPlayAppAnalytics({ env: ENV, inTwa: false });
    analytics.trackEvent(analytics.GA_EVENTS.unlockSuccess, { via: "landing" }, ENV);
    analytics.trackPageView("/kept/abc123", ENV);

    const unlock = calls.find((c) => c[1] === "unlock_success");
    const page = calls.find((c) => c[1] === "page_view");
    assert.deepEqual(unlock, ["event", "unlock_success", { via: "landing" }]);
    assert.deepEqual(page, ["event", "page_view", { page_path: "/kept/:id" }]);
    assert.equal(analytics.GA_EVENTS.unlockSuccess, "unlock_success");
    assert.equal(analytics.GA_EVENTS.tourComplete, "tour_complete");
    assert.equal(analytics.GA_EVENTS.tourSkip, "tour_skip");
    assert.equal(analytics.GA_EVENTS.a2hsDismiss, "a2hs_dismiss");
    assert.equal(analytics.GA_APP_SOURCE.playTwa, "play_twa");
    assert.equal(analytics.GA_APP_SOURCE.web, "web");
  });

  it("config without user properties stays send_page_view false and anonymize_ip", () => {
    const { calls } = installBrowser();
    assert.equal(analytics.initAnalytics(ENV), true);
    assert.deepEqual(calls.find((c) => c[0] === "config")[2], {
      send_page_view: false,
      anonymize_ip: true,
    });
  });
});
