export const ENTRY_KINDS = [
  "note",
  "moment",
  "person",
  "place",
  "thing",
  "event",
  "idea",
  "list",
  "trip",
  "work",
  "food",
  "recipe",
  "pet",
  "health",
  "money",
  "quote",
  "dream",
  "ticket",
  "song",
  "win",
  "lesson",
] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

export const CALENDAR_KINDS: readonly EntryKind[] = ["event", "moment", "trip", "health"];

export const ENTRY_BUCKETS = [
  "scraps",
  "people",
  "out",
  "everyday",
  "proud",
  "dreams",
] as const;

export type EntryBucket = (typeof ENTRY_BUCKETS)[number];

export const BUCKET_KINDS: Record<EntryBucket, readonly EntryKind[]> = {
  scraps: ["note", "idea", "list", "quote"],
  people: ["person", "pet"],
  out: ["place", "trip", "ticket", "event", "moment"],
  everyday: ["thing", "food", "recipe", "work", "money", "health", "song"],
  proud: ["win", "lesson"],
  dreams: ["dream"],
};

const KIND_TO_BUCKET = Object.fromEntries(
  (Object.entries(BUCKET_KINDS) as Array<[EntryBucket, readonly EntryKind[]]>).flatMap(
    ([bucket, kinds]) => kinds.map((kind) => [kind, bucket]),
  ),
) as Record<EntryKind, EntryBucket>;

export function bucketForKind(kind: EntryKind): EntryBucket {
  return KIND_TO_BUCKET[kind] ?? "scraps";
}

export const ENTRY_STATUSES = ["fresh", "soft", "keepsake", "tucked"] as const;

export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const LOOKS = ["scrapbook", "corkboard"] as const;

export type JacketId = (typeof LOOKS)[number];

export type MemoirEntry = {
  id: string;
  kind: EntryKind;
  status: EntryStatus;
  title: string;
  how: string;
  facts: string;
  note: string;
  wouldBuyAgain?: boolean;
  photo?: string;
  happenedOn?: string;
  createdAt: number;
  updatedAt: number;
};

export type MemoirDraft = {
  kind: EntryKind;
  title: string;
  how: string;
  facts: string;
  note: string;
  wouldBuyAgain?: boolean;
  photo?: string;
  happenedOn?: string;
  status?: EntryStatus;
};

const KIND_SET = new Set<string>(ENTRY_KINDS);
const STATUS_SET = new Set<string>(ENTRY_STATUSES);

export function isEntryKind(value: unknown): value is EntryKind {
  return typeof value === "string" && KIND_SET.has(value);
}

export function normalizeKind(value: unknown): EntryKind {
  return isEntryKind(value) ? value : "note";
}

export function isEntryStatus(value: unknown): value is EntryStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

export function normalizeStatus(value: unknown): EntryStatus {
  return isEntryStatus(value) ? value : "fresh";
}

export function normalizeJacket(value: unknown): JacketId {
  if (value === "corkboard" || value === "ash") return "corkboard";
  return "scrapbook";
}

export function isCalendarKind(kind: EntryKind): boolean {
  return CALENDAR_KINDS.includes(kind);
}
