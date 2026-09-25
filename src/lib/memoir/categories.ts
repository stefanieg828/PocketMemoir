/**
 * Shelf categories = scrapbook spreads = cork boards.
 *
 * Free taste: the 6 starters (always available). Behind unlock: extra presets,
 * custom categories, rename / hide / reorder. Hidden categories that still
 * hold scraps stay on the shelf (tucked at the end) so nothing gets lost.
 */
import {
  ENTRY_BUCKETS,
  bucketForKind,
  type EntryBucket,
  type EntryKind,
  type ModeId,
} from "./types";

export const STARTER_IDS = ENTRY_BUCKETS;
export type StarterId = EntryBucket;

/** Extra presets unlocked with Comic / Riso. "Bucket List" — not Someday. */
export const PRESET_IDS = [
  "books-to-read",
  "movies-shows",
  "gift-ideas",
  "places-to-go",
  "recipes-to-try",
  "bucket-list",
] as const;

export type PresetId = (typeof PRESET_IDS)[number];

export const CATEGORY_VIBES = [
  "peach",
  "sage",
  "sky",
  "cream",
  "rose",
  "mustard",
  "ink",
] as const;

export type CategoryVibe = (typeof CATEGORY_VIBES)[number];

export type CustomCategory = {
  id: string;
  name: string;
  vibe: CategoryVibe;
};

export type CategoryConfig = {
  /** Visible categories, in shelf order. */
  order: string[];
  /** Display-name overrides. */
  names: Record<string, string>;
  customs: CustomCategory[];
};

export type CategoryKind = "starter" | "preset" | "custom";

export type ResolvedCategory = {
  id: string;
  kind: CategoryKind;
  name: string;
  defaultName: string;
  vibe: CategoryVibe;
  /** Only on the shelf because it still holds scraps. */
  tuckedAway: boolean;
};

const STARTER_DEFAULTS: Record<
  StarterId,
  { scrapbook: string; corkboard: string; vibe: CategoryVibe }
> = {
  scraps: { scrapbook: "Scraps", corkboard: "Notes", vibe: "cream" },
  people: { scrapbook: "People", corkboard: "Faces", vibe: "peach" },
  out: { scrapbook: "Out & About", corkboard: "Pins on the map", vibe: "sky" },
  everyday: { scrapbook: "Everyday", corkboard: "Desk pile", vibe: "mustard" },
  proud: { scrapbook: "Proud", corkboard: "Gold pins", vibe: "rose" },
  dreams: { scrapbook: "Dreams", corkboard: "Soft pins", vibe: "sage" },
};

const PRESET_DEFAULTS: Record<PresetId, { name: string; vibe: CategoryVibe }> = {
  "books-to-read": { name: "Books to read", vibe: "mustard" },
  "movies-shows": { name: "Movies & shows", vibe: "ink" },
  "gift-ideas": { name: "Gift ideas", vibe: "rose" },
  "places-to-go": { name: "Places to go", vibe: "sky" },
  "recipes-to-try": { name: "Recipes to try", vibe: "peach" },
  "bucket-list": { name: "Bucket List", vibe: "sage" },
};

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  order: [...STARTER_IDS],
  names: {},
  customs: [],
};

const STARTER_SET = new Set<string>(STARTER_IDS);
const PRESET_SET = new Set<string>(PRESET_IDS);
const VIBE_SET = new Set<string>(CATEGORY_VIBES);

export function isStarterId(id: string): id is StarterId {
  return STARTER_SET.has(id);
}

export function isPresetId(id: string): id is PresetId {
  return PRESET_SET.has(id);
}

export function isCustomId(id: string): boolean {
  return /^custom-[a-z0-9-]+$/i.test(id);
}

export function categoryKindOf(id: string): CategoryKind | null {
  if (isStarterId(id)) return "starter";
  if (isPresetId(id)) return "preset";
  if (isCustomId(id)) return "custom";
  return null;
}

export function defaultCategoryName(id: string, mode: ModeId = "scrapbook"): string {
  if (isStarterId(id)) {
    const d = STARTER_DEFAULTS[id];
    return mode === "corkboard" ? d.corkboard : d.scrapbook;
  }
  if (isPresetId(id)) return PRESET_DEFAULTS[id].name;
  return "New board";
}

export function defaultCategoryVibe(id: string): CategoryVibe {
  if (isStarterId(id)) return STARTER_DEFAULTS[id].vibe;
  if (isPresetId(id)) return PRESET_DEFAULTS[id].vibe;
  return "cream";
}

function cleanName(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ").slice(0, 40);
  return trimmed || fallback;
}

function cleanVibe(value: unknown, fallback: CategoryVibe = "cream"): CategoryVibe {
  return typeof value === "string" && VIBE_SET.has(value) ? (value as CategoryVibe) : fallback;
}

export function makeCustomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `custom-${Date.now().toString(36)}`;
}

/** Validate + coerce anything from storage / a backup into a safe config. */
export function normalizeCategoryConfig(raw: unknown): CategoryConfig {
  const empty = (): CategoryConfig => ({
    order: [...STARTER_IDS],
    names: {},
    customs: [],
  });
  if (!raw || typeof raw !== "object") return empty();

  const incoming = raw as Partial<CategoryConfig>;
  const customs: CustomCategory[] = [];
  const seenCustom = new Set<string>();
  if (Array.isArray(incoming.customs)) {
    for (const row of incoming.customs) {
      if (!row || typeof row !== "object") continue;
      const id = typeof (row as CustomCategory).id === "string" ? (row as CustomCategory).id : "";
      if (!isCustomId(id) || seenCustom.has(id)) continue;
      seenCustom.add(id);
      customs.push({
        id,
        name: cleanName((row as CustomCategory).name, "My board"),
        vibe: cleanVibe((row as CustomCategory).vibe),
      });
    }
  }
  const customIds = new Set(customs.map((c) => c.id));

  const names: Record<string, string> = {};
  if (incoming.names && typeof incoming.names === "object") {
    for (const [id, value] of Object.entries(incoming.names)) {
      if (!categoryKindOf(id) && !customIds.has(id)) continue;
      if (typeof value !== "string") continue;
      const fallback = customIds.has(id)
        ? (customs.find((c) => c.id === id)?.name ?? "My board")
        : defaultCategoryName(id);
      const cleaned = cleanName(value, fallback);
      if (cleaned !== fallback) names[id] = cleaned;
    }
  }

  const known = (id: string) => isStarterId(id) || isPresetId(id) || customIds.has(id);
  const order: string[] = [];
  const seen = new Set<string>();
  const hadOrder = Array.isArray(incoming.order);
  if (hadOrder) {
    for (const id of incoming.order as unknown[]) {
      if (typeof id !== "string" || !known(id) || seen.has(id)) continue;
      seen.add(id);
      order.push(id);
    }
  } else {
    for (const id of STARTER_IDS) {
      order.push(id);
      seen.add(id);
    }
  }

  if (order.length === 0) return { order: [...STARTER_IDS], names, customs };
  return { order, names, customs };
}

export function categoryLabel(
  config: CategoryConfig,
  id: string,
  mode: ModeId = "scrapbook",
): string {
  if (config.names[id]) return config.names[id]!;
  const custom = config.customs.find((c) => c.id === id);
  if (custom) return custom.name;
  return defaultCategoryName(id, mode);
}

export function categoryVibe(config: CategoryConfig, id: string): CategoryVibe {
  const custom = config.customs.find((c) => c.id === id);
  if (custom) return custom.vibe;
  return defaultCategoryVibe(id);
}

/**
 * Resolve a scrap onto a category id. Explicit `category` wins; otherwise the
 * kind → starter bucket mapping (legacy scraps stay put).
 */
export function categoryForEntry(entry: { category?: string; kind: EntryKind }): string {
  if (typeof entry.category === "string" && entry.category.trim()) {
    return entry.category.trim();
  }
  return bucketForKind(entry.kind);
}

/**
 * Boards currently on the shelf.
 * - Free: starters only.
 * - Unlocked: whatever is in `order`.
 * - Either way: categories that still hold scraps but aren't in order are
 *   appended at the end as `tuckedAway`, so scraps stay reachable.
 */
export function resolveShelf(
  config: CategoryConfig,
  opts: {
    unlocked: boolean;
    mode?: ModeId;
    counts?: Record<string, number>;
  },
): ResolvedCategory[] {
  const mode = opts.mode ?? "scrapbook";
  const counts = opts.counts ?? {};
  const customsById = new Map(config.customs.map((c) => [c.id, c]));

  const resolve = (id: string, tuckedAway: boolean): ResolvedCategory | null => {
    let kind = categoryKindOf(id);
    if (!kind && customsById.has(id)) kind = "custom";
    if (!kind) return null;
    if (kind === "custom" && !customsById.has(id)) return null;
    const defaultName =
      kind === "custom" ? (customsById.get(id)?.name ?? "My board") : defaultCategoryName(id, mode);
    const name = config.names[id] ?? defaultName;
    const vibe =
      kind === "custom" ? (customsById.get(id)?.vibe ?? "cream") : defaultCategoryVibe(id);
    return { id, kind, name, defaultName, vibe, tuckedAway };
  };

  const out: ResolvedCategory[] = [];
  const seen = new Set<string>();

  for (const id of config.order) {
    if (!opts.unlocked && !isStarterId(id)) continue;
    const row = resolve(id, false);
    if (!row || seen.has(id)) continue;
    seen.add(id);
    out.push(row);
  }

  if (!opts.unlocked) {
    for (const id of STARTER_IDS) {
      if (seen.has(id)) continue;
      const row = resolve(id, false);
      if (!row) continue;
      seen.add(id);
      out.push(row);
    }
  }

  for (const [id, n] of Object.entries(counts)) {
    if (n <= 0 || seen.has(id)) continue;
    const row = resolve(id, true);
    if (!row) continue;
    seen.add(id);
    out.push(row);
  }

  return out;
}

export function countByCategory(
  entries: readonly { category?: string; kind: EntryKind; status?: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    // Tucked scraps still "live" in their category for reachability.
    const id = categoryForEntry(entry);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export function togglePreset(config: CategoryConfig, id: PresetId, on: boolean): CategoryConfig {
  const order = config.order.filter((x) => x !== id);
  if (on) order.push(id);
  return { ...config, order };
}

export function addCustom(
  config: CategoryConfig,
  input: { name: string; vibe?: CategoryVibe; id?: string },
): { config: CategoryConfig; id: string } {
  const id = input.id && isCustomId(input.id) ? input.id : makeCustomId();
  const custom: CustomCategory = {
    id,
    name: cleanName(input.name, "My board"),
    vibe: cleanVibe(input.vibe),
  };
  const customs = [...config.customs.filter((c) => c.id !== id), custom];
  const order = config.order.includes(id) ? config.order : [...config.order, id];
  return { config: { ...config, customs, order }, id };
}

export function renameCategory(config: CategoryConfig, id: string, name: string): CategoryConfig {
  const fallback = config.customs.find((c) => c.id === id)?.name ?? defaultCategoryName(id);
  const cleaned = cleanName(name, fallback);
  const names = { ...config.names };
  if (cleaned === fallback) delete names[id];
  else names[id] = cleaned;
  const customs = config.customs.map((c) => (c.id === id ? { ...c, name: cleaned } : c));
  return { ...config, names, customs };
}

/** Drop a rename so tabs/boards show the built-in name again (starters + presets). */
export function resetCategoryName(config: CategoryConfig, id: string): CategoryConfig {
  if (!(id in config.names)) return config;
  const names = { ...config.names };
  delete names[id];
  return { ...config, names };
}

export function hideCategory(config: CategoryConfig, id: string): CategoryConfig {
  return { ...config, order: config.order.filter((x) => x !== id) };
}

export function showCategory(config: CategoryConfig, id: string): CategoryConfig {
  if (config.order.includes(id)) return config;
  return { ...config, order: [...config.order, id] };
}

export function removeCustom(config: CategoryConfig, id: string): CategoryConfig {
  if (!isCustomId(id)) return hideCategory(config, id);
  const names = { ...config.names };
  delete names[id];
  return {
    order: config.order.filter((x) => x !== id),
    names,
    customs: config.customs.filter((c) => c.id !== id),
  };
}

export function moveCategory(config: CategoryConfig, id: string, dir: -1 | 1): CategoryConfig {
  const i = config.order.indexOf(id);
  if (i < 0) return config;
  const j = i + dir;
  if (j < 0 || j >= config.order.length) return config;
  const order = [...config.order];
  const [row] = order.splice(i, 1);
  order.splice(j, 0, row!);
  return { ...config, order };
}

export function setCustomVibe(
  config: CategoryConfig,
  id: string,
  vibe: CategoryVibe,
): CategoryConfig {
  return {
    ...config,
    customs: config.customs.map((c) =>
      c.id === id ? { ...c, vibe: cleanVibe(vibe, c.vibe) } : c,
    ),
  };
}

/** Sensible default kind when sticking a scrap onto a category. */
export function defaultKindForCategory(id: string): EntryKind {
  if (isStarterId(id)) {
    return (BUCKET_KINDS_SAFE[id]?.[0] ?? "note") as EntryKind;
  }
  if (id === "recipes-to-try") return "recipe";
  if (id === "places-to-go") return "place";
  if (id === "books-to-read" || id === "movies-shows" || id === "gift-ideas" || id === "bucket-list") {
    return "list";
  }
  return "note";
}

// Local copy of starter→kinds head so we don't re-export the whole map.
const BUCKET_KINDS_SAFE: Record<string, readonly EntryKind[]> = {
  scraps: ["note", "idea", "list", "quote"],
  people: ["person", "pet"],
  out: ["place", "trip", "ticket", "event", "moment"],
  everyday: ["thing", "food", "recipe", "work", "money", "health", "song"],
  proud: ["win", "lesson"],
  dreams: ["dream"],
};
