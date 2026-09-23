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

export const LOOKS = ["scrapbook", "corkboard"] as const;

export type JacketId = (typeof LOOKS)[number];

export type MemoirEntry = {
  id: string;
  kind: EntryKind;
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
};

const KIND_SET = new Set<string>(ENTRY_KINDS);

export function isEntryKind(value: unknown): value is EntryKind {
  return typeof value === "string" && KIND_SET.has(value);
}

export function normalizeKind(value: unknown): EntryKind {
  return isEntryKind(value) ? value : "note";
}

export function normalizeJacket(value: unknown): JacketId {
  if (value === "corkboard" || value === "ash") return "corkboard";
  return "scrapbook";
}

export function isCalendarKind(kind: EntryKind): boolean {
  return CALENDAR_KINDS.includes(kind);
}
