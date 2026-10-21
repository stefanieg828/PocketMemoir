/**
 * To-do lists (free) + subcategories on any board (big scraps).
 *   node --test scripts/todos-subcats.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let cats;
let types;
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
  cats = await server.ssrLoadModule("/src/lib/memoir/categories.ts");
  types = await server.ssrLoadModule("/src/lib/memoir/types.ts");
});

after(async () => {
  await server?.close();
});

describe("normalizeTodos", () => {
  it("older scraps without todos stay undefined", () => {
    assert.equal(types.normalizeTodos(undefined), undefined);
    assert.equal(types.normalizeTodos([]), undefined);
  });
  it("keeps valid rows, drops junk, dedupes ids", () => {
    const out = types.normalizeTodos([
      { id: "a", text: " rake  leaves ", done: true },
      { id: "a", text: "mow", done: "yes" },
      { text: "" },
      null,
      "x",
    ]);
    assert.equal(out.length, 2);
    assert.deepEqual(out[0], { id: "a", text: "rake leaves", done: true });
    assert.equal(out[1].done, false);
    assert.notEqual(out[1].id, "a");
  });
});

describe("subcategories on any board", () => {
  it("custom board + preset can hold custom chips; survive normalize", () => {
    let { config, id: board } = cats.addCustom(cats.DEFAULT_CATEGORY_CONFIG, { name: "house" });
    config = cats.togglePreset(config, "gift-ideas", true);
    const a = cats.addCustomKind(config, board, "outside to-dos");
    const b = cats.addCustomKind(a.config, "gift-ideas", "for mom");
    const c = cats.addCustomKind(b.config, "everyday", "inside to-dos");
    const n = cats.normalizeCategoryConfig(JSON.parse(JSON.stringify(c.config)));
    assert.equal(n.kindExtras[board].customs[0].label, "outside to-dos");
    assert.equal(n.kindExtras["gift-ideas"].customs[0].label, "for mom");
    assert.equal(n.kindExtras.everyday.customs[0].label, "inside to-dos");
    const chips = cats.kindsForBucket(n, board, true);
    assert.deepEqual(chips.map((x) => x.label), ["Note", "outside to-dos"]);
    assert.equal(cats.kindsForBucket(n, board, false).length, 1);
    const renamed = cats.renameKind(n, board, a.id, "yard");
    assert.equal(cats.kindsForBucket(renamed, board, true)[1].label, "yard");
    const removed = cats.removeCustom(renamed, board);
    assert.equal(removed.kindExtras[board], undefined);
  });
  it("entryMatchesChip", () => {
    assert.ok(cats.entryMatchesChip({ kind: "note", stickerId: "custom-kind-ab" }, "custom-kind-ab"));
    assert.ok(!cats.entryMatchesChip({ kind: "note", stickerId: "custom-kind-ab" }, "note"));
    assert.ok(cats.entryMatchesChip({ kind: "note" }, "note"));
    assert.ok(cats.entryMatchesChip({ kind: "food" }, "all"));
  });
});
