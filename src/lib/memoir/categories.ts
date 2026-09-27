/**
 * Shelf categories = scrapbook spreads = cork boards.
 *
 * Free taste: the 6 starters (always available; rename allowed). Behind unlock:
 * extra presets, custom categories, hide / reorder, and editable sticker chips
 * (kindExtras). Hidden categories that still hold scraps stay on the shelf
 * (tucked at the end) so nothing gets lost.
 */
import { KIND_META } from "./copy";
import {
  BUCKET_KINDS,
  ENTRY_BUCKETS,
  bucketForKind,
  isEntryKind,
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

/** Per-starter sticker chip overrides (unlocked). */
export type KindExtrasBucket = {
  /** Display labels for builtin kinds or custom ids. */
  renames?: Record<string, string>;
  /** Builtin kinds hidden from chips (not hard-deleted). */
  hidden?: string[];
  /** User-added sticker chips for this board. */
  customs?: { id: string; label: string }[];
};

export type CategoryConfig = {
  /** Visible categories, in shelf order. */
  order: string[];
  /** Display-name overrides. */
  names: Record<string, string>;
  customs: CustomCategory[];
  /**
   * Sticker chip edits keyed by starter bucket id. Omitted / empty for free
   * users and older saves. normalize fills an empty object.
   */
  kindExtras?: Record<string, KindExtrasBucket>;
};

/** One chip on the keep-form kind row. */
export type StickerChip = {
  id: string;
  label: string;
  custom: boolean;
  /** Builtin EntryKind used when saving (customs fall back to a board default). */
  builtinKind: EntryKind;
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
  // Same plain names for scrapbook + corkboard. Free users can rename these six.
  scraps: { scrapbook: "Thoughts", corkboard: "Thoughts", vibe: "cream" },
  people: { scrapbook: "People", corkboard: "People", vibe: "peach" },
  out: { scrapbook: "Places", corkboard: "Places", vibe: "sky" },
  everyday: { scrapbook: "To-Do", corkboard: "To-Do", vibe: "mustard" },
  proud: { scrapbook: "Achievements", corkboard: "Achievements", vibe: "rose" },
  dreams: { scrapbook: "Goals", corkboard: "Goals", vibe: "sage" },
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
  kindExtras: {},
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

/** Custom sticker chip ids (not board customs). */
export function isCustomKindId(id: string): boolean {
  return /^custom-kind-[a-z0-9-]+$/i.test(id);
}

export function makeCustomKindId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom-kind-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `custom-kind-${Date.now().toString(36)}`;
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

function normalizeKindExtras(raw: unknown): Record<string, KindExtrasBucket> {
  const out: Record<string, KindExtrasBucket> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [bucket, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isStarterId(bucket) || !value || typeof value !== "object") continue;
    const row = value as KindExtrasBucket;
    const builtins = new Set<string>(BUCKET_KINDS[bucket] ?? []);
    const renames: Record<string, string> = {};
    if (row.renames && typeof row.renames === "object") {
      for (const [kid, label] of Object.entries(row.renames)) {
        if (typeof label !== "string") continue;
        const cleaned = cleanName(label, "");
        if (!cleaned) continue;
        if (builtins.has(kid) || isCustomKindId(kid)) renames[kid] = cleaned;
      }
    }
    const hidden: string[] = [];
    const seenHidden = new Set<string>();
    if (Array.isArray(row.hidden)) {
      for (const kid of row.hidden) {
        if (typeof kid !== "string" || !builtins.has(kid) || seenHidden.has(kid)) continue;
        seenHidden.add(kid);
        hidden.push(kid);
      }
    }
    const customs: { id: string; label: string }[] = [];
    const seenCustomKind = new Set<string>();
    if (Array.isArray(row.customs)) {
      for (const c of row.customs) {
        if (!c || typeof c !== "object") continue;
        const id = typeof (c as { id?: unknown }).id === "string" ? (c as { id: string }).id : "";
        if (!isCustomKindId(id) || seenCustomKind.has(id)) continue;
        seenCustomKind.add(id);
        customs.push({
          id,
          label: cleanName((c as { label?: unknown }).label, "Sticker"),
        });
      }
    }
    if (Object.keys(renames).length === 0 && hidden.length === 0 && customs.length === 0) continue;
    const bucketExtras: KindExtrasBucket = {};
    if (Object.keys(renames).length) bucketExtras.renames = renames;
    if (hidden.length) bucketExtras.hidden = hidden;
    if (customs.length) bucketExtras.customs = customs;
    out[bucket] = bucketExtras;
  }
  return out;
}

/** Validate + coerce anything from storage / a backup into a safe config. */
export function normalizeCategoryConfig(raw: unknown): CategoryConfig {
  const empty = (): CategoryConfig => ({
    order: [...STARTER_IDS],
    names: {},
    customs: [],
    kindExtras: {},
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

  const kindExtras = normalizeKindExtras(incoming.kindExtras);

  if (order.length === 0) return { order: [...STARTER_IDS], names, customs, kindExtras };
  return { order, names, customs, kindExtras };
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
    ...config,
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
    return (BUCKET_KINDS[id]?.[0] ?? "note") as EntryKind;
  }
  if (id === "recipes-to-try") return "recipe";
  if (id === "places-to-go") return "place";
  if (id === "books-to-read" || id === "movies-shows" || id === "gift-ideas" || id === "bucket-list") {
    return "list";
  }
  return "note";
}

function kindExtrasFor(config: CategoryConfig, bucket: string): KindExtrasBucket {
  return config.kindExtras?.[bucket] ?? {};
}

function setKindExtras(
  config: CategoryConfig,
  bucket: string,
  next: KindExtrasBucket | null,
): CategoryConfig {
  const kindExtras = { ...(config.kindExtras ?? {}) };
  if (!next || (!next.renames && !next.hidden?.length && !next.customs?.length)) {
    delete kindExtras[bucket];
  } else {
    const cleaned: KindExtrasBucket = {};
    if (next.renames && Object.keys(next.renames).length) cleaned.renames = next.renames;
    if (next.hidden?.length) cleaned.hidden = next.hidden;
    if (next.customs?.length) cleaned.customs = next.customs;
    if (!cleaned.renames && !cleaned.hidden && !cleaned.customs) delete kindExtras[bucket];
    else kindExtras[bucket] = cleaned;
  }
  return { ...config, kindExtras };
}

function pruneExtras(extras: KindExtrasBucket): KindExtrasBucket | null {
  const cleaned: KindExtrasBucket = {};
  if (extras.renames && Object.keys(extras.renames).length) cleaned.renames = extras.renames;
  if (extras.hidden?.length) cleaned.hidden = extras.hidden;
  if (extras.customs?.length) cleaned.customs = extras.customs;
  return cleaned.renames || cleaned.hidden || cleaned.customs ? cleaned : null;
}

/**
 * Ordered sticker chips for a board.
 * Free (locked): fixed BUCKET_KINDS. Unlocked: builtins minus hidden + customs,
 * with renames applied.
 */
export function kindsForBucket(
  config: CategoryConfig,
  bucket: string,
  unlocked: boolean,
): StickerChip[] {
  if (!isStarterId(bucket)) {
    const k = defaultKindForCategory(bucket);
    return [{ id: k, label: KIND_META[k].label, custom: false, builtinKind: k }];
  }
  const builtins = BUCKET_KINDS[bucket];
  if (!unlocked) {
    return builtins.map((k) => ({
      id: k,
      label: KIND_META[k].label,
      custom: false,
      builtinKind: k,
    }));
  }
  const extras = kindExtrasFor(config, bucket);
  const hidden = new Set(extras.hidden ?? []);
  const renames = extras.renames ?? {};
  const chips: StickerChip[] = [];
  for (const k of builtins) {
    if (hidden.has(k)) continue;
    chips.push({
      id: k,
      label: renames[k] ?? KIND_META[k].label,
      custom: false,
      builtinKind: k,
    });
  }
  for (const c of extras.customs ?? []) {
    chips.push({
      id: c.id,
      label: renames[c.id] ?? c.label,
      custom: true,
      builtinKind: (builtins[0] ?? "note") as EntryKind,
    });
  }
  return chips;
}

/** Builtin kinds hidden on a starter (for the stickers editor "show again" list). */
export function hiddenKindsForBucket(config: CategoryConfig, bucket: string): EntryKind[] {
  if (!isStarterId(bucket)) return [];
  const hidden = kindExtrasFor(config, bucket).hidden ?? [];
  const builtins = new Set<string>(BUCKET_KINDS[bucket]);
  return hidden.filter((k): k is EntryKind => builtins.has(k) && isEntryKind(k));
}

export function renameKind(
  config: CategoryConfig,
  bucket: string,
  kindId: string,
  label: string,
): CategoryConfig {
  if (!isStarterId(bucket)) return config;
  const builtins = new Set<string>(BUCKET_KINDS[bucket]);
  const extras = { ...kindExtrasFor(config, bucket) };
  const isCustom = (extras.customs ?? []).some((c) => c.id === kindId);
  if (!builtins.has(kindId) && !isCustom) return config;

  const fallback = isCustom
    ? (extras.customs!.find((c) => c.id === kindId)?.label ?? "Sticker")
    : KIND_META[kindId as EntryKind].label;
  const cleaned = cleanName(label, fallback);
  const renames = { ...(extras.renames ?? {}) };
  if (isCustom) {
    extras.customs = (extras.customs ?? []).map((c) =>
      c.id === kindId ? { ...c, label: cleaned } : c,
    );
    delete renames[kindId];
  } else if (cleaned === fallback) {
    delete renames[kindId];
  } else {
    renames[kindId] = cleaned;
  }
  extras.renames = Object.keys(renames).length ? renames : undefined;
  return setKindExtras(config, bucket, pruneExtras(extras));
}

/** Drop a rename so the chip shows KIND_META / custom base label again. */
export function resetKindName(config: CategoryConfig, bucket: string, kindId: string): CategoryConfig {
  if (!isStarterId(bucket)) return config;
  const extras = { ...kindExtrasFor(config, bucket) };
  if (!extras.renames?.[kindId]) return config;
  const renames = { ...extras.renames };
  delete renames[kindId];
  extras.renames = Object.keys(renames).length ? renames : undefined;
  return setKindExtras(config, bucket, pruneExtras(extras));
}

export function hideKind(config: CategoryConfig, bucket: string, kindId: string): CategoryConfig {
  if (!isStarterId(bucket)) return config;
  const builtins = new Set<string>(BUCKET_KINDS[bucket]);
  if (!builtins.has(kindId)) return config;
  const extras = { ...kindExtrasFor(config, bucket) };
  const hidden = [...(extras.hidden ?? [])];
  if (!hidden.includes(kindId)) hidden.push(kindId);
  extras.hidden = hidden;
  return setKindExtras(config, bucket, pruneExtras(extras));
}

export function showKind(config: CategoryConfig, bucket: string, kindId: string): CategoryConfig {
  if (!isStarterId(bucket)) return config;
  const extras = { ...kindExtrasFor(config, bucket) };
  if (!extras.hidden?.includes(kindId)) return config;
  extras.hidden = extras.hidden.filter((k) => k !== kindId);
  if (!extras.hidden.length) extras.hidden = undefined;
  return setKindExtras(config, bucket, pruneExtras(extras));
}

export function addCustomKind(
  config: CategoryConfig,
  bucket: string,
  label: string,
  id?: string,
): { config: CategoryConfig; id: string } {
  if (!isStarterId(bucket)) return { config, id: "" };
  const kindId = id && isCustomKindId(id) ? id : makeCustomKindId();
  const extras = { ...kindExtrasFor(config, bucket) };
  const customs = [...(extras.customs ?? []).filter((c) => c.id !== kindId)];
  customs.push({ id: kindId, label: cleanName(label, "Sticker") });
  extras.customs = customs;
  return { config: setKindExtras(config, bucket, pruneExtras(extras)), id: kindId };
}

export function removeCustomKind(
  config: CategoryConfig,
  bucket: string,
  kindId: string,
): CategoryConfig {
  if (!isStarterId(bucket) || !isCustomKindId(kindId)) return config;
  const extras = { ...kindExtrasFor(config, bucket) };
  extras.customs = (extras.customs ?? []).filter((c) => c.id !== kindId);
  if (!extras.customs.length) extras.customs = undefined;
  if (extras.renames?.[kindId]) {
    const renames = { ...extras.renames };
    delete renames[kindId];
    extras.renames = Object.keys(renames).length ? renames : undefined;
  }
  return setKindExtras(config, bucket, pruneExtras(extras));
}

/**
 * Display label for a scrap's sticker. Custom stickerId -> custom label (or
 * orphan -> builtin kind label). Renamed builtins use kindExtras renames.
 */
export function stickerLabelForEntry(
  entry: { kind: EntryKind; stickerId?: string; category?: string },
  config: CategoryConfig,
): string {
  const sid = typeof entry.stickerId === "string" ? entry.stickerId.trim() : "";
  if (sid && isCustomKindId(sid)) {
    for (const extras of Object.values(config.kindExtras ?? {})) {
      const custom = extras.customs?.find((c) => c.id === sid);
      if (custom) return extras.renames?.[sid] ?? custom.label;
    }
    return KIND_META[entry.kind]?.label ?? "Note";
  }
  const kindKey = sid && isEntryKind(sid) ? sid : entry.kind;
  const bucket =
    (typeof entry.category === "string" && isStarterId(entry.category)
      ? entry.category
      : bucketForKind(kindKey)) as EntryBucket;
  const rename = config.kindExtras?.[bucket]?.renames?.[kindKey];
  if (rename) return rename;
  return KIND_META[kindKey]?.label ?? KIND_META[entry.kind].label;
}

/** Resolve keep-form selection into kind + stickerId for storage. */
export function selectionFromSticker(chip: StickerChip): { kind: EntryKind; stickerId?: string } {
  if (chip.custom) return { kind: chip.builtinKind, stickerId: chip.id };
  return { kind: chip.builtinKind, stickerId: undefined };
}
