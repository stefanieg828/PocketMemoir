/**
 * Soft GA4 helpers + wiring presence.
 *   node --test scripts/analytics.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("analytics source wiring", () => {
  const analyticsSrc = readFileSync(join(root, "src/lib/memoir/analytics.ts"), "utf8");
  const playSrc = readFileSync(join(root, "src/lib/memoir/play-app-analytics.ts"), "utf8");
  const listenerSrc = readFileSync(join(root, "src/components/analytics-listener.tsx"), "utf8");
  const workflow = readFileSync(join(root, ".github/workflows/deploy-pages.yml"), "utf8");
  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  const appShell = readFileSync(join(root, "src/components/app-shell.tsx"), "utf8");
  const tour = readFileSync(join(root, "src/components/tour-overlay.tsx"), "utf8");
  const a2hs = readFileSync(join(root, "src/components/a2hs-tip.tsx"), "utf8");

  it("never hardcodes a G- measurement id in app source", () => {
    assert.doesNotMatch(analyticsSrc, /G-[A-Z0-9]{6,}/);
    assert.doesNotMatch(playSrc, /G-[A-Z0-9]{6,}/);
    assert.doesNotMatch(listenerSrc, /G-[A-Z0-9]{6,}/);
    assert.match(analyticsSrc, /VITE_GA_MEASUREMENT_ID/);
  });

  it("wires Pages build to the measurement id (secret, else the live fallback)", () => {
    assert.match(
      workflow,
      /VITE_GA_MEASUREMENT_ID:\s*\$\{\{\s*secrets\.VITE_GA_MEASUREMENT_ID\s*\|\|\s*'G-[A-Z0-9]+'\s*\}\}/,
    );
  });

  it("documents the env in .env.example", () => {
    assert.match(envExample, /VITE_GA_MEASUREMENT_ID/);
  });

  it("hooks unlock_success, tour, and a2hs_dismiss", () => {
    assert.match(appShell, /unlockSuccess|unlock_success/);
    assert.match(appShell, /AnalyticsListener/);
    assert.match(tour, /tourComplete|tour_complete/);
    assert.match(tour, /tourSkip|tour_skip/);
    assert.match(a2hs, /a2hsDismiss|a2hs_dismiss/);
  });

  it("keeps the original event names and adds Play events beside them", () => {
    assert.match(analyticsSrc, /unlockSuccess:\s*"unlock_success"/);
    assert.match(analyticsSrc, /tourComplete:\s*"tour_complete"/);
    assert.match(analyticsSrc, /tourSkip:\s*"tour_skip"/);
    assert.match(analyticsSrc, /a2hsDismiss:\s*"a2hs_dismiss"/);
    assert.match(analyticsSrc, /playAppFirstOpen:\s*"play_app_first_open"/);
    assert.match(analyticsSrc, /playAppOpen:\s*"play_app_open"/);
  });

  it("reports Play source before the first page_view", () => {
    assert.match(listenerSrc, /reportPlayAppAnalytics\(\)/);
    const pageEffect = listenerSrc.slice(listenerSrc.indexOf("lastPath"));
    assert.ok(pageEffect.indexOf("reportPlayAppAnalytics()") !== -1);
    assert.ok(pageEffect.indexOf("reportPlayAppAnalytics()") < pageEffect.indexOf("trackPageView"));
    assert.match(playSrc, /isTwaSession/);
    assert.match(playSrc, /pocketmemoir\.twa\.playAppFirstOpen/);
    assert.doesNotMatch(playSrc, /isRunningAsInstalledApp\(/);
  });
});

describe("analyticsPath + readGaMeasurementId", () => {
  let analytics;
  let server;

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
  });

  after(async () => {
    await server?.close();
  });

  it("redacts kept scrap ids", () => {
    assert.equal(analytics.analyticsPath("/kept/abc123"), "/kept/:id");
    assert.equal(analytics.analyticsPath("/"), "/");
    assert.equal(analytics.analyticsPath("/calendar"), "/calendar");
  });

  it("treats empty / missing id as disabled", () => {
    assert.equal(analytics.readGaMeasurementId({}), "");
    assert.equal(analytics.readGaMeasurementId({ VITE_GA_MEASUREMENT_ID: "  " }), "");
    assert.equal(analytics.isAnalyticsEnabled({}), false);
    assert.equal(analytics.isAnalyticsEnabled({ VITE_GA_MEASUREMENT_ID: "G-TESTONLY01" }), true);
    assert.equal(
      analytics.readGaMeasurementId({ VITE_GA_MEASUREMENT_ID: " G-TESTONLY01 " }),
      "G-TESTONLY01",
    );
  });

  it("initAnalytics is a no-op without a window / without an id", () => {
    analytics.__resetAnalyticsForTests();
    assert.equal(analytics.initAnalytics({}), false);
  });
});
