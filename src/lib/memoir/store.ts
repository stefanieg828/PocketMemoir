import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { JacketId, MemoirDraft, MemoirEntry } from "./types";
import { normalizeJacket, normalizeKind } from "./types";

const STORAGE_KEY = "pocketmemoir.v1";

export const SEED_IDS = [
  "seed-wifi",
  "seed-sam",
  "seed-bday",
  "seed-snow",
  "seed-lamp",
  "seed-win",
  "seed-dentist",
] as const;

const SEEDS: MemoirEntry[] = [
  {
    id: "seed-win",
    kind: "win",
    title: "Finished the drawer",
    how: "It closes. That is the whole win.",
    facts: "",
    note: "",
    createdAt: Date.parse("2026-09-20"),
    updatedAt: Date.parse("2026-09-20"),
  },
  {
    id: "seed-dentist",
    kind: "health",
    title: "The dentist who gives stickers",
    how: "Morning. Bring the old card.",
    facts: "",
    note: "",
    happenedOn: "2026-09-28",
    createdAt: Date.parse("2026-09-10"),
    updatedAt: Date.parse("2026-09-10"),
  },
  {
    id: "seed-bday",
    kind: "event",
    title: "Sam’s birthday",
    how: "The restaurant with the green awning.",
    facts: "",
    note: "don’t forget the almonds",
    happenedOn: "2026-11-03",
    createdAt: Date.parse("2026-09-01"),
    updatedAt: Date.parse("2026-09-01"),
  },
  {
    id: "seed-lamp",
    kind: "thing",
    title: "The green lamp",
    how: "Kitchen shelf.",
    facts: "would buy again",
    note: "",
    wouldBuyAgain: true,
    createdAt: Date.parse("2025-03-02"),
    updatedAt: Date.parse("2025-03-02"),
  },
  {
    id: "seed-sam",
    kind: "person",
    title: "Sam",
    how: "Coworker.",
    facts: "allergic to almonds",
    note: "gave the candle in 2024",
    createdAt: Date.parse("2024-12-01"),
    updatedAt: Date.parse("2024-12-01"),
  },
  {
    id: "seed-snow",
    kind: "moment",
    title: "First snow on Oak",
    how: "The lights went and it kept falling.",
    facts: "",
    note: "",
    happenedOn: "2019-01-20",
    createdAt: Date.parse("2019-01-20"),
    updatedAt: Date.parse("2019-01-20"),
  },
  {
    id: "seed-wifi",
    kind: "note",
    title: "Wifi is oaknest",
    how: "Third floor. The plant knows.",
    facts: "",
    note: "",
    createdAt: Date.parse("2024-06-01"),
    updatedAt: Date.parse("2024-06-01"),
  },
];

type MemoirState = {
  entries: MemoirEntry[];
  jacket: JacketId;
  hasHydrated: boolean;
  storageFull: boolean;
  setHasHydrated: (value: boolean) => void;
  setJacket: (jacket: JacketId) => void;
  clearStorageFull: () => void;
  addEntry: (draft: MemoirDraft) => MemoirEntry;
  updateEntry: (id: string, draft: MemoirDraft) => void;
  removeEntry: (id: string) => void;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `kept-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const memory: Record<string, string> = {};

const memoryStorage: StateStorage = {
  getItem: (name) => memory[name] ?? null,
  setItem: (name, value) => {
    memory[name] = value;
  },
  removeItem: (name) => {
    delete memory[name];
  },
};

const browserStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return memoryStorage.getItem(name);
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") {
      memoryStorage.setItem(name, value);
      return;
    }
    try {
      window.localStorage.setItem(name, value);
      if (useMemoir.getState().storageFull) {
        useMemoir.setState({ storageFull: false });
      }
    } catch {
      if (!useMemoir.getState().storageFull) {
        useMemoir.setState({ storageFull: true });
      }
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") {
      memoryStorage.removeItem(name);
      return;
    }
    window.localStorage.removeItem(name);
  },
};

function fromDraft(draft: MemoirDraft, base?: MemoirEntry): MemoirEntry {
  const now = Date.now();
  const kind = normalizeKind(draft.kind);
  return {
    id: base?.id ?? createId(),
    kind,
    title: draft.title.trim(),
    how: draft.how.trim(),
    facts: draft.facts.trim(),
    note: draft.note.trim(),
    wouldBuyAgain: kind === "thing" ? Boolean(draft.wouldBuyAgain) : undefined,
    photo: draft.photo,
    happenedOn: draft.happenedOn?.trim() || undefined,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeStoredEntry(raw: unknown): MemoirEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<MemoirEntry>;
  if (typeof entry.id !== "string" || typeof entry.title !== "string") return null;
  const kind = normalizeKind(entry.kind);
  return {
    id: entry.id,
    kind,
    title: entry.title,
    how: typeof entry.how === "string" ? entry.how : "",
    facts: typeof entry.facts === "string" ? entry.facts : "",
    note: typeof entry.note === "string" ? entry.note : "",
    wouldBuyAgain: kind === "thing" ? Boolean(entry.wouldBuyAgain) : undefined,
    photo: typeof entry.photo === "string" ? entry.photo : undefined,
    happenedOn: typeof entry.happenedOn === "string" ? entry.happenedOn : undefined,
    createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
    updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
  };
}

export const useMemoir = create<MemoirState>()(
  persist(
    (set, get) => ({
      entries: SEEDS,
      jacket: "scrapbook",
      hasHydrated: false,
      storageFull: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setJacket: (jacket) => set({ jacket }),
      clearStorageFull: () => set({ storageFull: false }),
      addEntry: (draft) => {
        const entry = fromDraft(draft);
        set({ entries: [entry, ...get().entries] });
        return entry;
      },
      updateEntry: (id, draft) => {
        set({
          entries: get().entries.map((entry) =>
            entry.id === id ? fromDraft(draft, entry) : entry,
          ),
        });
      },
      removeEntry: (id) =>
        set({ entries: get().entries.filter((entry) => entry.id !== id) }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => browserStorage),
      partialize: (state) => ({ entries: state.entries, jacket: state.jacket }),
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<MemoirState>;
        const entries = Array.isArray(incoming.entries)
          ? incoming.entries
              .map(normalizeStoredEntry)
              .filter((entry): entry is MemoirEntry => Boolean(entry))
          : current.entries;
        return {
          ...current,
          jacket: normalizeJacket(incoming.jacket),
          entries,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function matchesQuery(entry: MemoirEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [entry.title, entry.how, entry.facts, entry.note, entry.kind, entry.happenedOn]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function isStarterShelf(entries: MemoirEntry[]) {
  if (entries.length === 0) return false;
  return entries.every((entry) => entry.id.startsWith("seed-"));
}
