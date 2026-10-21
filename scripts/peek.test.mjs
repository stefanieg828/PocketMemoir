/**
 * Peek create/parse + invariants: peek ≠ backup, peek does not unlock / merge.
 *   node --test scripts/peek.test.mjs
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
  const peek = await server.ssrLoadModule("/src/lib/memoir/peek.ts");
  const backup = await server.ssrLoadModule("/src/lib/memoir/backup.ts");
  const store = await server.ssrLoadModule("/src/lib/memoir/store.ts");
  const session = await server.ssrLoadModule("/src/lib/memoir/peek-session.ts");
  m = {
    ...peek,
    createBackup: backup.createBackup,
    serializeBackup: backup.serializeBackup,
    normalizeStoredEntry: store.normalizeStoredEntry,
    useMemoir: store.useMemoir,
    usePeekSession: session.usePeekSession,
  };
});

after(async () => {
  await server?.close();
});

const PHOTO =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy";

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
  riso: {
    pair: "custom",
    inkA: "#e0a92e",
    inkB: "#1b6b73",
    titleFont: "dm-serif",
    bodyFont: "courier",
  },
};

describe("peek file", () => {
  it("round-trips entries, photos, look, and categories — never unlocked", () => {
    const entries = [
      entry("a", { photo: PHOTO, kind: "person" }),
      entry("b", { happenedOn: "2026-11-03" }),
    ];
    const categories = {
      order: ["scraps", "people", "books-to-read"],
      names: { scraps: "Bits" },
      customs: [{ id: "custom-abc12345", name: "Songs", vibe: "rose" }],
    };
    const now = new Date(2026, 8, 27, 13, 0);
    const file = m.createPeek({ entries, ...settings, categories }, now);
    assert.equal(file.kind, "pocketmemoir-peek");
    assert.equal(file.version, m.PEEK_VERSION);
    assert.deepEqual(file.counts, { scraps: 2, photos: 1 });
    assert.equal(m.peekFileName(now), "pocketmemoir-peek-2026-09-27.json");
    assert.equal("unlocked" in file, false);
    assert.equal(m.peekHasUnlockField(file), false);

    const parsed = m.parsePeek(m.serializePeek(file), m.normalizeStoredEntry);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.entries.length, 2);
    assert.equal(parsed.entries[0].photo, PHOTO);
    assert.equal(parsed.mode, "corkboard");
    assert.equal(parsed.look, "riso");
    assert.equal(parsed.riso.inkA, "#e0a92e");
    assert.equal(parsed.categories.names.scraps, "Bits");
    assert.equal(parsed.createdAt.getTime(), now.getTime());
    assert.equal("unlocked" in parsed, false);
  });

  it("rejects junk, backups, and never throws", () => {
    const n = m.normalizeStoredEntry;
    assert.equal(m.parsePeek("not json {", n).reason, "not-json");
    assert.equal(m.parsePeek("[]", n).reason, "not-ours");
    assert.equal(
      m.parsePeek(JSON.stringify({ format: "pocketmemoir-backup", version: 2, entries: [] }), n)
        .reason,
      "is-backup",
    );
    assert.equal(
      m.parsePeek(JSON.stringify({ kind: "pocketmemoir-peek", version: 99, entries: [] }), n)
        .reason,
      "too-new",
    );
    assert.equal(
      m.parsePeek(JSON.stringify({ kind: "pocketmemoir-peek", version: 1 }), n).reason,
      "broken",
    );
    const backupText = m.serializeBackup(
      m.createBackup({ entries: [entry("x")], ...settings, unlocked: true }),
    );
    const asBackup = m.parsePeek(backupText, n);
    assert.equal(asBackup.ok, false);
    assert.equal(asBackup.reason, "is-backup");
    assert.match(asBackup.message, /backup/i);
  });

  it("skips unreadable rows and duplicate ids", () => {
    const text = JSON.stringify({
      kind: "pocketmemoir-peek",
      version: 1,
      entries: [entry("a"), { junk: true }, entry("a"), entry("c")],
      mode: "scrapbook",
      look: "storybook",
    });
    const r = m.parsePeek(text, m.normalizeStoredEntry);
    assert.equal(r.ok, true);
    assert.deepEqual(
      r.entries.map((e) => e.id),
      ["a", "c"],
    );
    assert.equal(r.skipped, 2);
  });
});

describe("peek session invariants", () => {
  it("startPeek does not unlock or merge into the owner's store", () => {
    const store = m.useMemoir.getState();
    const unlockedBefore = store.unlocked;
    const entryIdsBefore = store.entries.map((e) => e.id).slice().sort();
    const entryCountBefore = store.entries.length;

    // Ensure owner is locked for this invariant check.
    m.useMemoir.setState({ unlocked: false });

    const peek = m.createPeek({
      entries: [entry("friend-1", { title: "Friend scrap" }), entry("friend-2")],
      mode: "corkboard",
      look: "comic",
      riso: settings.riso,
      categories: {
        order: ["scraps", "people", "bucket-list"],
        names: {},
        customs: [],
      },
    });
    const parsed = m.parsePeek(m.serializePeek(peek), m.normalizeStoredEntry);
    assert.equal(parsed.ok, true);

    m.usePeekSession.getState().startPeek(parsed);

    const after = m.useMemoir.getState();
    assert.equal(after.unlocked, false, "peek must not unlock");
    assert.equal(after.entries.length, entryCountBefore, "peek must not merge entries");
    assert.deepEqual(
      after.entries.map((e) => e.id).slice().sort(),
      entryIdsBefore,
    );
    assert.equal(
      after.entries.some((e) => e.id === "friend-1"),
      false,
      "friend scraps must not land in owner store",
    );

    const session = m.usePeekSession.getState();
    assert.equal(session.active, true);
    assert.equal(session.entries.length, 2);
    assert.equal(session.look, "comic");
    assert.equal(session.mode, "corkboard");

    m.usePeekSession.getState().endPeek();
    assert.equal(m.usePeekSession.getState().active, false);
    assert.equal(m.usePeekSession.getState().entries.length, 0);
    assert.equal(m.useMemoir.getState().unlocked, false);
    assert.equal(m.useMemoir.getState().entries.length, entryCountBefore);

    // restore prior unlocked for other tests sharing the store
    m.useMemoir.setState({ unlocked: unlockedBefore });
  });

  it("createPeek never embeds unlocked even when owner is unlocked", () => {
    const file = m.createPeek({
      entries: [entry("a")],
      ...settings,
      // @ts-expect-error — unlocked must be ignored if somehow passed
      unlocked: true,
    });
    assert.equal("unlocked" in file, false);
    const text = m.serializePeek(file);
    assert.equal(text.includes('"unlocked"'), false);
  });
});
