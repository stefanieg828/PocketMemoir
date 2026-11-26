/**
 * Opt-in encrypted auto backup.
 *
 * The device makes a random backup code (shown to the user to keep). From that code we
 * derive, with PBKDF2, both an AES-GCM key and a storage id. Scraps are encrypted here,
 * in the browser, and only ciphertext goes to the verifier server (`/backup/:id`), which
 * keeps the last 5 versions. The server never sees the code, the key, an email, or the
 * scraps. Lose the code and nobody (us included) can open the backup.
 *
 * Wire format: "PMB1" | flags (1 = gzip) | iv (12 bytes) | AES-GCM ciphertext.
 */
import { create } from "zustand";
import { buildBackupText } from "./backup-io";
import { isStarterShelf, useMemoir } from "./store";
import { UNLOCK_API_BASES } from "./unlock-token";

const LS_KEY = "pocketmemoir.cloudBackup";
const DEBOUNCE_MS = 20_000;
const DAILY_MS = 24 * 3600e3;
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32

type Saved = { code: string | null; lastAt: number | null; lastCount: number | null };
export type CloudVersion = { at: number; size: number };

type CloudState = Saved & {
  busy: boolean;
  error: string | null;
  /** Asks the keep-them-safe section to open its "bring back with a code" form. */
  restoreOpen: boolean;
  setRestoreOpen: (open: boolean) => void;
};

function load(): Saved {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (raw) {
      const v = JSON.parse(raw) as Partial<Saved>;
      return { code: v.code ?? null, lastAt: v.lastAt ?? null, lastCount: v.lastCount ?? null };
    }
  } catch {
    /* ignore */
  }
  return { code: null, lastAt: null, lastCount: null };
}

export const useCloudBackup = create<CloudState>((set) => ({
  ...load(),
  busy: false,
  error: null,
  restoreOpen: false,
  setRestoreOpen: (restoreOpen) => set({ restoreOpen }),
}));

useCloudBackup.subscribe((s, prev) => {
  if (s.code === prev.code && s.lastAt === prev.lastAt && s.lastCount === prev.lastCount) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ code: s.code, lastAt: s.lastAt, lastCount: s.lastCount }));
  } catch {
    /* ignore */
  }
});

// ——— code + crypto ———

export function newBackupCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20)); // 160 bits → 32 chars
  let bits = 0;
  let acc = 0;
  let out = "";
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(acc >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return formatCode(out);
}

/** Uppercase, fix look-alikes, drop spaces/dashes. Returns null unless it's 32 chars. */
export function normalizeCode(input: string): string | null {
  const s = input
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V")
    .replace(/[^0-9A-Z]/g, "");
  if (s.length !== 32 || [...s].some((c) => !ALPHABET.includes(c))) return null;
  return s;
}

export function formatCode(code: string): string {
  const s = normalizeCode(code) ?? code;
  return s.match(/.{1,4}/g)?.join("-") ?? s;
}

const derived = new Map<string, Promise<{ key: CryptoKey; id: string }>>();
function derive(code: string) {
  const norm = normalizeCode(code);
  if (!norm) throw new Error("bad code");
  let p = derived.get(norm);
  if (!p) {
    p = (async () => {
      const enc = new TextEncoder();
      const base = await crypto.subtle.importKey("raw", enc.encode(norm), "PBKDF2", false, ["deriveBits"]);
      const bits = new Uint8Array(
        await crypto.subtle.deriveBits(
          { name: "PBKDF2", hash: "SHA-256", salt: enc.encode("pocketmemoir-backup-v1"), iterations: 150_000 },
          base,
          512,
        ),
      );
      const key = await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"]);
      const id = [...bits.slice(32)].map((b) => b.toString(16).padStart(2, "0")).join("");
      return { key, id };
    })();
    derived.set(norm, p);
  }
  return p;
}

type Bytes = Uint8Array<ArrayBuffer>;

async function pipe(data: Bytes, stream: CompressionStream | DecompressionStream): Promise<Bytes> {
  const out = new Blob([data]).stream().pipeThrough(stream as unknown as TransformStream<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function seal(code: string, text: string): Promise<Bytes> {
  const { key } = await derive(code);
  let body: Bytes = new TextEncoder().encode(text) as Bytes;
  let flags = 0;
  if (typeof CompressionStream !== "undefined") {
    try {
      body = await pipe(body, new CompressionStream("gzip"));
      flags = 1;
    } catch {
      /* send uncompressed */
    }
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, body));
  const out = new Uint8Array(4 + 1 + 12 + ct.length);
  out.set(new TextEncoder().encode("PMB1"), 0);
  out[4] = flags;
  out.set(iv, 5);
  out.set(ct, 17);
  return out;
}

async function open(code: string, buf: Bytes): Promise<string> {
  const { key } = await derive(code);
  if (new TextDecoder().decode(buf.slice(0, 4)) !== "PMB1") throw new Error("not ours");
  const flags = buf[4];
  const plain = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(5, 17) }, key, buf.slice(17)),
  );
  const body: Bytes = flags & 1 ? await pipe(plain, new DecompressionStream("gzip")) : plain;
  return new TextDecoder().decode(body);
}

// ——— network ———

async function api(path: string, init?: RequestInit): Promise<Response> {
  let last: unknown = null;
  for (const base of UNLOCK_API_BASES) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.status >= 500 && res.status !== 507) {
        last = new Error(String(res.status));
        continue;
      }
      return res;
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error("offline");
}

function hasRealScraps() {
  const { entries } = useMemoir.getState();
  return entries.length > 0 && !isStarterShelf(entries);
}

/** Encrypt + upload now. Quietly skips an empty / starter-only shelf so a fresh device can't bury a real backup. */
export async function backupNow(opts: { force?: boolean } = {}): Promise<boolean> {
  const st = useCloudBackup.getState();
  if (!st.code || st.busy) return false;
  if (!hasRealScraps() && !opts.force) return false;
  useCloudBackup.setState({ busy: true, error: null });
  try {
    const { text, backup } = buildBackupText();
    const blob = await seal(st.code, text);
    const { id } = await derive(st.code);
    const res = await api(`/backup/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: blob,
    });
    if (!res.ok) {
      const msg =
        res.status === 413
          ? "too many big photos to back up here — save to a file instead."
          : "couldn't back up just now. we'll try again soon.";
      useCloudBackup.setState({ busy: false, error: msg });
      return false;
    }
    useCloudBackup.setState({ busy: false, lastAt: Date.now(), lastCount: backup.counts.scraps });
    return true;
  } catch {
    useCloudBackup.setState({ busy: false, error: "couldn't back up just now — offline? we'll try again soon." });
    return false;
  }
}

export function turnOnCloudBackup(): string {
  const code = newBackupCode();
  useCloudBackup.setState({ code, lastAt: null, lastCount: null, error: null });
  void backupNow();
  return code;
}

export function turnOffCloudBackup() {
  useCloudBackup.setState({ code: null, lastAt: null, lastCount: null, error: null });
}

/** Start using a code that came back from another device (after its scraps were restored). */
export function adoptBackupCode(code: string) {
  const norm = normalizeCode(code);
  if (!norm) return;
  useCloudBackup.setState({ code: formatCode(norm), error: null });
}

export type FetchResult =
  | { ok: true; text: string; at: number; versions: CloudVersion[]; code: string }
  | { ok: false; message: string };

/** Find and decrypt the newest backup (or a chosen version) for a code. */
export async function fetchCloudBackup(input: string, at?: number): Promise<FetchResult> {
  const norm = normalizeCode(input);
  if (!norm) return { ok: false, message: "that code doesn't look right — it's 32 letters and numbers." };
  try {
    const { id } = await derive(norm);
    const list = await api(`/backup/${id}`);
    if (list.status === 404) return { ok: false, message: "no backup found for that code." };
    if (list.status === 429) return { ok: false, message: "too many tries — wait a bit, then try again." };
    if (!list.ok) return { ok: false, message: "couldn't reach the backup shelf. try again in a moment." };
    const versions = ((await list.json()) as { versions: CloudVersion[] }).versions;
    const pick = at ?? versions[versions.length - 1]?.at;
    const res = await api(`/backup/${id}/${pick}`);
    if (!res.ok) return { ok: false, message: "couldn't fetch that backup. try again in a moment." };
    const text = await open(norm, new Uint8Array(await res.arrayBuffer()));
    return { ok: true, text, at: pick, versions, code: formatCode(norm) };
  } catch {
    return { ok: false, message: "couldn't open that backup — double-check the code." };
  }
}

// ——— scheduler ———

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced backup after changes, plus a once-a-day backup. Call once after hydration. */
export function startCloudBackup() {
  if (started || typeof window === "undefined") return;
  started = true;
  const schedule = () => {
    if (!useCloudBackup.getState().code) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void backupNow();
    }, DEBOUNCE_MS);
  };
  useMemoir.subscribe((s, prev) => {
    if (
      s.entries !== prev.entries ||
      s.categories !== prev.categories ||
      s.pageStickers !== prev.pageStickers ||
      s.mode !== prev.mode ||
      s.look !== prev.look ||
      s.unlockToken !== prev.unlockToken
    )
      schedule();
  });
  const daily = () => {
    const { code, lastAt } = useCloudBackup.getState();
    if (code && (!lastAt || Date.now() - lastAt > DAILY_MS)) void backupNow();
  };
  daily();
  setInterval(daily, 3600e3);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && timer) {
      clearTimeout(timer);
      timer = null;
      void backupNow();
    } else if (document.visibilityState === "visible") daily();
  });
}
