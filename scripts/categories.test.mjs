/**
 * Category config: presets, customs, rename (starters + presets), hidden-with-scraps.
 *   node --test scripts/categories.test.mjs
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
  m = await server.ssrLoadModule("/src/lib/memoir/categories.ts");
});

after(async () => {
  await server?.close();
});

describe("categories", () => {
  it("ships Bucket List (not Someday) among presets", () => {
    assert.ok(m.PRESET_IDS.includes("bucket-list"));
    assert.equal(m.defaultCategoryName("bucket-list"), "Bucket List");
    assert.ok(!m.PRESET_IDS.some((id) => id.includes("someday")));
  });

  it("free shelf is the six starters only", () => {
    const cfg = m.normalizeCategoryConfig({
      order: [...m.STARTER_IDS, "books-to-read", "bucket-list"],
      names: {},
      customs: [],
    });
    const shelf = m.resolveShelf(cfg, { unlocked: false });
    assert.deepEqual(
      shelf.map((c) => c.id),
      [...m.STARTER_IDS],
    );
  });

  it("unlocked shelf can add Books + Movies + Bucket List", () => {
    let cfg = m.DEFAULT_CATEGORY_CONFIG;
    cfg = m.togglePreset(cfg, "books-to-read", true);
    cfg = m.togglePreset(cfg, "movies-shows", true);
    cfg = m.togglePreset(cfg, "bucket-list", true);
    const shelf = m.resolveShelf(cfg, { unlocked: true });
    const ids = shelf.map((c) => c.id);
    assert.ok(ids.includes("books-to-read"));
    assert.ok(ids.includes("movies-shows"));
    assert.ok(ids.includes("bucket-list"));
  });

  it("renames starters and presets (display only) and can reset", () => {
    let cfg = m.togglePreset(m.DEFAULT_CATEGORY_CONFIG, "books-to-read", true);
    cfg = m.renameCategory(cfg, "scraps", "Bits & bobs");
    cfg = m.renameCategory(cfg, "books-to-read", "To be read-ish");
    assert.equal(m.categoryLabel(cfg, "scraps"), "Bits & bobs");
    assert.equal(m.categoryLabel(cfg, "books-to-read"), "To be read-ish");
    assert.equal(m.defaultCategoryName("books-to-read"), "Books to read");
    cfg = m.resetCategoryName(cfg, "books-to-read");
    assert.equal(m.categoryLabel(cfg, "books-to-read"), "Books to read");
    assert.equal(m.categoryLabel(cfg, "scraps"), "Bits & bobs");
  });

  it("custom categories join the shelf", () => {
    const { config, id } = m.addCustom(m.DEFAULT_CATEGORY_CONFIG, {
      name: "Songs stuck in my head",
      vibe: "rose",
    });
    assert.ok(id.startsWith("custom-"));
    const shelf = m.resolveShelf(config, { unlocked: true });
    assert.ok(shelf.some((c) => c.id === id && c.name === "Songs stuck in my head"));
  });

  it("hidden category with scraps still appears tuckedAway", () => {
    let cfg = m.togglePreset(m.DEFAULT_CATEGORY_CONFIG, "books-to-read", true);
    cfg = m.hideCategory(cfg, "books-to-read");
    const shelf = m.resolveShelf(cfg, {
      unlocked: true,
      counts: { "books-to-read": 2 },
    });
    const row = shelf.find((c) => c.id === "books-to-read");
    assert.ok(row);
    assert.equal(row.tuckedAway, true);
  });

  it("legacy scraps without category fall back to kind→starter", () => {
    assert.equal(m.categoryForEntry({ kind: "person" }), "people");
    assert.equal(m.categoryForEntry({ kind: "note", category: "books-to-read" }), "books-to-read");
  });
});
