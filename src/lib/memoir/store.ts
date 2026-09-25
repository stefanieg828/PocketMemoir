import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { BackupSettings } from "./backup";
import {
  DEFAULT_CATEGORY_CONFIG,
  addCustom,
  hideCategory,
  moveCategory,
  normalizeCategoryConfig,
  removeCustom,
  renameCategory,
  resetCategoryName,
  showCategory,
  togglePreset,
  type CategoryConfig,
  type CategoryVibe,
  type PresetId,
} from "./categories";
import { DEFAULT_RISO, LOOK_SKINS, normalizeRiso } from "./looks";
import type {
  EntryStatus,
  LookId,
  MemoirDraft,
  MemoirEntry,
  ModeId,
  RisoPrefs,
} from "./types";
import { bucketForKind, normalizeKind, normalizeLook, normalizeMode, normalizeStatus } from "./types";

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
    status: "keepsake",
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
    status: "fresh",
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
    status: "fresh",
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
    status: "soft",
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
    status: "keepsake",
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
    status: "soft",
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
    status: "fresh",
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
  /** Layout engine: flip album vs wall of boards. */
  mode: ModeId;
  /** Skin: storybook / comic / riso. */
  look: LookId;
  riso: RisoPrefs;
  /**
   * Same gate as Comic / Riso Looks. Free taste = starters only; unlock opens
   * presets, customs, rename / hide / reorder. Selecting an unlock Look (or
   * tapping Unlock on the categories tease) turns this on — no paywall yet.
   */
  unlocked: boolean;
  categories: CategoryConfig;
  /** When the last backup file was saved (ms), or null if never. */
  lastBackupAt: number | null;
  /** "Not now" on the backup nudge (ms). */
  backupNudgeDismissedAt: number | null;
  hasHydrated: boolean;
  storageFull: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (mode: ModeId) => void;
  setLook: (look: LookId) => void;
  setRiso: (patch: Partial<RisoPrefs>) => void;
  setUnlocked: (unlocked: boolean) => void;
  clearStorageFull: () => void;
  addEntry: (draft: MemoirDraft) => MemoirEntry;
  updateEntry: (id: string, draft: MemoirDraft) => void;
  setEntryStatus: (id: string, status: EntryStatus) => void;
  removeEntry: (id: string) => void;
  markBackedUp: (at?: number) => void;
  dismissBackupNudge: () => void;
  /** Swap in restored scraps (already merged/replaced) and optionally settings. */
  applyRestore: (entries: MemoirEntry[], settings?: BackupSettings) => void;
  setPresetOn: (id: PresetId, on: boolean) => void;
  createCategory: (name: string, vibe?: CategoryVibe) => string;
  renameCategory: (id: string, name: string) => void;
  resetCategoryName: (id: string) => void;
  hideCategory: (id: string) => void;
  showCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
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
    status: draft.status
      ? normalizeStatus(draft.status)
      : base
        ? normalizeStatus(base.status)
        : "fresh",
    title: draft.title.trim(),
    how: draft.how.trim(),
    facts: draft.facts.trim(),
    note: draft.note.trim(),
    wouldBuyAgain: kind === "thing" ? Boolean(draft.wouldBuyAgain) : undefined,
    photo: draft.photo,
    happenedOn: draft.happenedOn?.trim() || undefined,
    category: draft.category?.trim() || base?.category,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}

const SEED_STATUS = Object.fromEntries(SEEDS.map((s) => [s.id, s.status])) as Record<
  string,
  EntryStatus
>;

export function normalizeStoredEntry(raw: unknown): MemoirEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<MemoirEntry>;
  if (typeof entry.id !== "string" || typeof entry.title !== "string") return null;
  const kind = normalizeKind(entry.kind);
  // First migrate: missing status → seed’s demo shelf if known, else fresh
  const status =
    "status" in entry
      ? normalizeStatus(entry.status)
      : normalizeStatus(SEED_STATUS[entry.id] ?? "fresh");
  return {
    id: entry.id,
    kind,
    status,
    title: entry.title,
    how: typeof entry.how === "string" ? entry.how : "",
    facts: typeof entry.facts === "string" ? entry.facts : "",
    note: typeof entry.note === "string" ? entry.note : "",
    wouldBuyAgain: kind === "thing" ? Boolean(entry.wouldBuyAgain) : undefined,
    photo: typeof entry.photo === "string" ? entry.photo : undefined,
    happenedOn: typeof entry.happenedOn === "string" ? entry.happenedOn : undefined,
    category: typeof entry.category === "string" && entry.category.trim()
      ? entry.category.trim()
      : undefined,
    createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
    updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
  };
}

export const useMemoir = create<MemoirState>()(
  persist(
    (set, get) => ({
      entries: SEEDS,
      mode: "scrapbook",
      look: "storybook",
      riso: { ...DEFAULT_RISO },
      unlocked: false,
      categories: { ...DEFAULT_CATEGORY_CONFIG, order: [...DEFAULT_CATEGORY_CONFIG.order], names: {}, customs: [] },
      lastBackupAt: null,
      backupNudgeDismissedAt: null,
      hasHydrated: false,
      storageFull: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (mode) => set({ mode }),
      setLook: (look) => {
        // Unlock Looks (Comic / Riso) also unlock category editing — same gate, no paywall yet.
        const unlock = LOOK_SKINS[look]?.unlock === true;
        set(unlock ? { look, unlocked: true } : { look });
      },
      setRiso: (patch) => set({ riso: normalizeRiso({ ...get().riso, ...patch }) }),
      setUnlocked: (unlocked) => set({ unlocked }),
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
      setEntryStatus: (id, status) => {
        const next = normalizeStatus(status);
        set({
          entries: get().entries.map((entry) =>
            entry.id === id
              ? { ...entry, status: next, updatedAt: Date.now() }
              : entry,
          ),
        });
      },
      removeEntry: (id) =>
        set({ entries: get().entries.filter((entry) => entry.id !== id) }),
      markBackedUp: (at = Date.now()) => set({ lastBackupAt: at, backupNudgeDismissedAt: null }),
      dismissBackupNudge: () => set({ backupNudgeDismissedAt: Date.now() }),
      applyRestore: (entries, settings) =>
        set(
          settings
            ? {
                entries,
                mode: normalizeMode(settings.mode),
                look: normalizeLook(settings.look),
                riso: normalizeRiso(settings.riso),
                unlocked: settings.unlocked ?? get().unlocked,
                categories: settings.categories
                  ? normalizeCategoryConfig(settings.categories)
                  : get().categories,
              }
            : { entries },
        ),
      setPresetOn: (id, on) => set({ categories: togglePreset(get().categories, id, on) }),
      createCategory: (name, vibe) => {
        const { config, id } = addCustom(get().categories, { name, vibe });
        set({ categories: config });
        return id;
      },
      renameCategory: (id, name) => set({ categories: renameCategory(get().categories, id, name) }),
      resetCategoryName: (id) => set({ categories: resetCategoryName(get().categories, id) }),
      hideCategory: (id) => set({ categories: hideCategory(get().categories, id) }),
      showCategory: (id) => set({ categories: showCategory(get().categories, id) }),
      removeCategory: (id) => set({ categories: removeCustom(get().categories, id) }),
      moveCategory: (id, dir) => set({ categories: moveCategory(get().categories, id, dir) }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => browserStorage),
      partialize: (state) => ({
        entries: state.entries,
        mode: state.mode,
        look: state.look,
        riso: state.riso,
        unlocked: state.unlocked,
        categories: state.categories,
        lastBackupAt: state.lastBackupAt,
        backupNudgeDismissedAt: state.backupNudgeDismissedAt,
      }),
      merge: (persisted, current) => {
        // Older saves stored `jacket` (scrapbook | corkboard) and no look → storybook.
        const incoming = (persisted ?? {}) as Partial<MemoirState> & { jacket?: unknown };
        const entries = Array.isArray(incoming.entries)
          ? incoming.entries
              .map(normalizeStoredEntry)
              .filter((entry): entry is MemoirEntry => Boolean(entry))
          : current.entries;
        const unlocked =
          typeof incoming.unlocked === "boolean"
            ? incoming.unlocked
            : LOOK_SKINS[normalizeLook(incoming.look)]?.unlock === true
              ? true
              : current.unlocked;
        return {
          ...current,
          mode: normalizeMode(incoming.mode ?? incoming.jacket),
          look: normalizeLook(incoming.look),
          riso: normalizeRiso(incoming.riso),
          unlocked,
          categories: normalizeCategoryConfig(incoming.categories),
          lastBackupAt: typeof incoming.lastBackupAt === "number" ? incoming.lastBackupAt : null,
          backupNudgeDismissedAt:
            typeof incoming.backupNudgeDismissedAt === "number" ? incoming.backupNudgeDismissedAt : null,
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
  const hay = [
    entry.title,
    entry.how,
    entry.facts,
    entry.note,
    entry.kind,
    bucketForKind(entry.kind),
    entry.status,
    entry.happenedOn,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function isStarterShelf(entries: MemoirEntry[]) {
  if (entries.length === 0) return false;
  return entries.every((entry) => entry.id.startsWith("seed-"));
}
