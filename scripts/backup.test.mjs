/**
 * Backup format round-trip + validation tests.
 *   node --test scripts/backup.test.mjs      (or: npm run test:backup)
 * Loads the real TS modules through Vite's SSR loader (no extra deps) so the
 * store's own entry normalizer is exercised too.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let m;
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
  const backup = await server.ssrLoadModule("/src/lib/memoir/backup.ts");
  const store = await server.ssrLoadModule("/src/lib/memoir/store.ts");
  m = { ...backup, normalizeStoredEntry: store.normalizeStoredEntry, SEED_IDS: store.SEED_IDS };
});

after(async () => {
  await server?.close();
});

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy";

function entry(id, extra = {}) {
  return {
    id,
    kind: "note",
    status: "fresh",
    title: `Scrap ${id}`,
    how: "",
    facts: "",
    note: "",
    createdAt: Date.parse("2026-09-01"),
    updatedAt: Date.parse("2026-09-01"),
    ...extra,
  };
}

const settings = {
  mode: "corkboard",
  look: "riso",
  riso: { pair: "custom", inkA: "#e0a92e", inkB: "#1b6b73", titleFont: "dm-serif", bodyFont: "courier" },
};

describe("backup file", () => {
  it("round-trips entries, photos and settings", () => {
    const entries = [entry("a", { photo: PHOTO, kind: "person" }), entry("b", { happenedOn: "2026-11-03" })];
    const now = new Date(2026, 8, 24, 16, 30);
    const file = m.createBackup({ entries, ...settings }, now);
    assert.equal(file.format, "pocketmemoir-backup");
    assert.equal(file.version, m.BACKUP_VERSION);
    assert.deepEqual(file.counts, { scraps: 2, photos: 1 });
    assert.equal(m.backupFileName(now), "pocketmemoir-backup-2026-09-24.json");

    const parsed = m.parseBackup(m.serializeBackup(file), m.normalizeStoredEntry);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.entries.length, 2);
    assert.equal(parsed.entries[0].photo, PHOTO);
    assert.equal(parsed.entries[0].kind, "person");
    assert.equal(parsed.entries[1].happenedOn, "2026-11-03");
    assert.equal(parsed.photos, 1);
    assert.equal(parsed.settings.mode, "corkboard");
    assert.equal(parsed.settings.look, "riso");
    assert.equal(parsed.settings.riso.inkA, "#e0a92e");
    assert.equal(parsed.settings.riso.bodyFont, "courier");
    assert.equal(parsed.exportedAt.getTime(), now.getTime());
  });

  it("rejects junk with friendly reasons and never throws", () => {
    const n = m.normalizeStoredEntry;
    assert.equal(m.parseBackup("not json {", n).reason, "not-json");
    assert.equal(m.parseBackup("[]", n).reason, "not-ours");
    assert.equal(m.parseBackup(JSON.stringify({ state: { entries: [] } }), n).reason, "not-ours");
    assert.equal(m.parseBackup(JSON.stringify({ format: "pocketmemoir-backup", version: 99, entries: [] }), n).reason, "too-new");
    assert.equal(m.parseBackup(JSON.stringify({ format: "pocketmemoir-backup", version: 1 }), n).reason, "broken");
    assert.equal(m.parseBackup(JSON.stringify({ format: "pocketmemoir-backup", version: 1, entries: [{ nope: 1 }] }), n).reason, "broken");
    for (const bad of ["not json {", "[]"]) {
      const r = m.parseBackup(bad, n);
      assert.equal(r.ok, false);
      assert.match(r.message, /PocketMemoir backup/);
    }
  });

  it("skips unreadable rows and duplicate ids, drops non-image photos", () => {
    const text = JSON.stringify({
      format: "pocketmemoir-backup",
      version: 1,
      entries: [entry("a"), { junk: true }, entry("a"), entry("c", { photo: "javascript:alert(1)" })],
      settings: { mode: "weird", look: "nope" },
    });
    const r = m.parseBackup(text, m.normalizeStoredEntry);
    assert.equal(r.ok, true);
    assert.deepEqual(r.entries.map((e) => e.id), ["a", "c"]);
    assert.equal(r.skipped, 2);
    assert.equal(r.entries[1].photo, undefined);
    assert.equal(r.settings.mode, "scrapbook");
    assert.equal(r.settings.look, "storybook");
  });

  it("accepts an empty-but-valid backup", () => {
    const r = m.parseBackup(m.serializeBackup(m.createBackup({ entries: [], ...settings })), m.normalizeStoredEntry);
    assert.equal(r.ok, true);
    assert.equal(r.entries.length, 0);
  });
});

describe("planRestore", () => {
  const here = [entry("a", { title: "mine" }), entry("b")];
  const file = [entry("a", { title: "theirs" }), entry("c"), entry("d")];

  it("merge keeps existing, adds missing, dedupes by id", () => {
    const plan = m.planRestore(here, file, "merge");
    assert.deepEqual(plan.entries.map((e) => e.id).sort(), ["a", "b", "c", "d"]);
    assert.equal(plan.entries.find((e) => e.id === "a").title, "mine");
    assert.equal(plan.added, 2);
    assert.equal(plan.alreadyHere, 1);
    assert.equal(plan.removed, 0);
  });

  it("replace swaps the shelf for the file", () => {
    const plan = m.planRestore(here, file, "replace");
    assert.deepEqual(plan.entries.map((e) => e.id), ["a", "c", "d"]);
    assert.equal(plan.entries[0].title, "theirs");
    assert.equal(plan.removed, 2);
  });
});

describe("backup nudge", () => {
  const t0 = Date.parse("2026-09-01");
  const many = (n, at, p = "k") => Array.from({ length: n }, (_, i) => entry(`${p}${i}`, { createdAt: at + i }));

  it("ignores starter scraps and waits for enough new ones", () => {
    const seeds = m.SEED_IDS.map((id) => entry(id, { createdAt: t0 + 1e9 }));
    assert.equal(m.scrapsSinceBackup(seeds, null), 0);
    assert.equal(m.shouldNudgeBackup([...seeds, ...many(9, t0)], null), false);
    assert.equal(m.shouldNudgeBackup([...seeds, ...many(10, t0)], null), true);
  });

  it("resets after a backup or a 'not now'", () => {
    const list = many(12, t0);
    assert.equal(m.shouldNudgeBackup(list, t0 + 100), false);
    assert.equal(m.shouldNudgeBackup(list, null, t0 + 100), false);
    assert.equal(m.shouldNudgeBackup([...list, ...many(10, t0 + 200, "n")], t0 + 100), true);
  });
});
