/**
 * Save to… — folder picker, share-sheet fallback, download fallback.
 *   node --test scripts/backup-save-to.test.mjs
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createServer } from "vite";

let saveBackupToChosenPlace;
let canPickSaveLocation;
let canSharePreparedFile;
let useMemoir;
let server;
let downloads;

function setNavigator(value) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    writable: true,
    value,
  });
}

function installDom() {
  downloads = [];
  const mem = {};
  setNavigator({});
  globalThis.window = {
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => {
        mem[k] = String(v);
      },
      removeItem: (k) => {
        delete mem[k];
      },
    },
    setTimeout: (...args) => setTimeout(...args),
  };
  globalThis.document = {
    head: { appendChild() {} },
    body: {
      appendChild() {},
      removeChild() {},
    },
    getElementsByTagName() {
      return [this.head];
    },
    createTextNode() {
      return {};
    },
    createElement() {
      const el = {
        href: "",
        download: "",
        rel: "",
        style: {},
        appendChild() {},
        click() {
          downloads.push({ name: el.download, href: el.href });
        },
        remove() {},
      };
      return el;
    },
  };
  globalThis.URL.createObjectURL = () => "blob:pm-test";
  globalThis.URL.revokeObjectURL = () => {};
}

before(async () => {
  installDom();
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
  const io = await server.ssrLoadModule("/src/lib/memoir/backup-io.ts");
  const store = await server.ssrLoadModule("/src/lib/memoir/store.ts");
  saveBackupToChosenPlace = io.saveBackupToChosenPlace;
  canPickSaveLocation = io.canPickSaveLocation;
  canSharePreparedFile = io.canSharePreparedFile;
  useMemoir = store.useMemoir;
});

after(async () => {
  await server?.close();
});

function resetBrowser() {
  downloads.length = 0;
  delete window.showSaveFilePicker;
  setNavigator({});
}

describe("saveBackupToChosenPlace", () => {
  it("writes the same backup JSON through showSaveFilePicker", async () => {
    resetBrowser();
    let options;
    let written = "";
    let closed = false;
    window.showSaveFilePicker = async (opts) => {
      options = opts;
      return {
        name: "grandma-drawer.json",
        async createWritable() {
          return {
            async write(data) {
              written = data;
            },
            async close() {
              closed = true;
            },
          };
        },
      };
    };

    const before = useMemoir.getState().lastBackupAt;
    const res = await saveBackupToChosenPlace();
    assert.equal(res.outcome, "picked");
    assert.equal(res.name, "grandma-drawer.json");
    assert.match(options.suggestedName, /^pocketmemoir-backup-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(options.id, "pocketmemoir-backup");
    assert.deepEqual(options.types[0].accept, { "application/json": [".json"] });
    assert.equal(closed, true);
    const json = JSON.parse(written);
    assert.equal(json.format, "pocketmemoir-backup");
    assert.equal(json.app, "PocketMemoir");
    assert.equal(json.counts.scraps, res.counts.scraps);
    assert.ok(useMemoir.getState().lastBackupAt > (before ?? 0));
    assert.equal(downloads.length, 0);
    assert.equal(canPickSaveLocation(), true);
  });

  it("stays quiet when the save dialog is canceled", async () => {
    resetBrowser();
    window.showSaveFilePicker = async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    };
    const before = useMemoir.getState().lastBackupAt;
    const res = await saveBackupToChosenPlace();
    assert.equal(res.outcome, "canceled");
    assert.equal(downloads.length, 0);
    assert.equal(useMemoir.getState().lastBackupAt, before);
  });

  it("downloads if the picker fails and the sheet cannot take a file", async () => {
    resetBrowser();
    window.showSaveFilePicker = async () => {
      throw Object.assign(new Error("nope"), { name: "SecurityError" });
    };
    navigator.share = async () => {
      throw new Error("share should not run");
    };
    navigator.canShare = () => false;
    const res = await saveBackupToChosenPlace();
    assert.equal(res.outcome, "downloaded");
    assert.equal(res.via, "picker");
    assert.equal(downloads.length, 1);
    assert.match(downloads[0].name, /^pocketmemoir-backup-/);
  });

  it("aborts a half-written picker file and still saves another way", async () => {
    resetBrowser();
    let aborted = false;
    window.showSaveFilePicker = async () => ({
      name: "half.json",
      async createWritable() {
        return {
          async write() {
            throw Object.assign(new Error("disk"), { name: "NotAllowedError" });
          },
          async close() {},
          async abort() {
            aborted = true;
          },
        };
      },
    });
    navigator.canShare = () => false;
    const res = await saveBackupToChosenPlace();
    assert.equal(aborted, true);
    assert.equal(res.outcome, "downloaded");
    assert.equal(res.via, "picker");
    assert.equal(downloads.length, 1);
  });

  it("opens the share sheet when there is no folder picker but files can be shared", async () => {
    resetBrowser();
    let sharedName = "";
    navigator.share = async ({ files }) => {
      sharedName = files[0].name;
      const text = await files[0].text();
      const json = JSON.parse(text);
      assert.equal(json.format, "pocketmemoir-backup");
    };
    navigator.canShare = ({ files }) => Array.isArray(files) && files.length === 1;
    const res = await saveBackupToChosenPlace();
    assert.equal(res.outcome, "shared");
    assert.match(sharedName, /^pocketmemoir-backup-/);
    assert.equal(downloads.length, 0);
  });

  it("downloads when share throws, and stays quiet if the sheet is dismissed", async () => {
    resetBrowser();
    navigator.canShare = () => true;
    navigator.share = async () => {
      throw Object.assign(new Error("nope"), { name: "NotAllowedError" });
    };
    const failed = await saveBackupToChosenPlace();
    assert.equal(failed.outcome, "downloaded");
    assert.equal(failed.via, "share");
    assert.equal(downloads.length, 1);

    downloads.length = 0;
    const stamped = useMemoir.getState().lastBackupAt;
    navigator.share = async () => {
      throw Object.assign(new Error("dismissed"), { name: "AbortError" });
    };
    const canceled = await saveBackupToChosenPlace();
    assert.equal(canceled.outcome, "canceled");
    assert.equal(downloads.length, 0);
    assert.equal(useMemoir.getState().lastBackupAt, stamped);
  });

  it("downloads directly when neither the picker nor file share exists", async () => {
    resetBrowser();
    const res = await saveBackupToChosenPlace();
    assert.equal(res.outcome, "downloaded");
    assert.equal(res.via, "direct");
    assert.equal(downloads.length, 1);
    assert.equal(canPickSaveLocation(), false);
  });

  it("tries share when canShare is missing but navigator.share exists", async () => {
    resetBrowser();
    let called = false;
    navigator.share = async () => {
      called = true;
    };
    const file = new File(["{}"], "x.json", { type: "application/json" });
    assert.equal(canSharePreparedFile(file), true);
    const res = await saveBackupToChosenPlace();
    assert.equal(called, true);
    assert.equal(res.outcome, "shared");
    assert.equal(downloads.length, 0);
  });

  it("does not treat a canShare throw as a file share", () => {
    resetBrowser();
    navigator.share = async () => {};
    navigator.canShare = () => {
      throw new Error("bad probe");
    };
    const file = new File(["{}"], "x.json", { type: "application/json" });
    assert.equal(canSharePreparedFile(file), false);
  });
});
