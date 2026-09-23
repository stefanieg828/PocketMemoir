import {
  ENTRY_BUCKETS,
  ENTRY_STATUSES,
  type EntryBucket,
  type EntryKind,
  type EntryStatus,
  type JacketId,
} from "./types";

export const APP_NAME = "PocketMemoir";

export const TAGLINE = "A cartoon scrapbook for the random stuff life drops on you.";

export type KindMeta = {
  label: string;
  plural: string;
  titleHint: string;
  detailHint: string;
  dateRequired: boolean;
};

export const KIND_META: Record<EntryKind, KindMeta> = {
  note: {
    label: "Note",
    plural: "Notes",
    titleHint: "wifi password",
    detailHint: "oaknest · third floor",
    dateRequired: false,
  },
  moment: {
    label: "Moment",
    plural: "Moments",
    titleHint: "first snow on Oak",
    detailHint: "the lights went and it kept falling",
    dateRequired: false,
  },
  person: {
    label: "Person",
    plural: "People",
    titleHint: "Sam",
    detailHint: "coworker · allergic to almonds",
    dateRequired: false,
  },
  place: {
    label: "Place",
    plural: "Places",
    titleHint: "the apartment on Oak",
    detailHint: "third floor, the plant by the sink",
    dateRequired: false,
  },
  thing: {
    label: "Thing",
    plural: "Things",
    titleHint: "the green lamp",
    detailHint: "kitchen shelf · would buy again",
    dateRequired: false,
  },
  event: {
    label: "Event",
    plural: "Events",
    titleHint: "Sam’s birthday",
    detailHint: "the restaurant with the green awning",
    dateRequired: true,
  },
  idea: {
    label: "Idea",
    plural: "Ideas",
    titleHint: "a tiny shelf by the door",
    detailHint: "for keys, and the one good mug",
    dateRequired: false,
  },
  list: {
    label: "List",
    plural: "Lists",
    titleHint: "before the trip",
    detailHint: "charger, the blue sweater, snacks",
    dateRequired: false,
  },
  trip: {
    label: "Trip",
    plural: "Trips",
    titleHint: "the long weekend",
    detailHint: "train at 8, window seat if we can",
    dateRequired: false,
  },
  work: {
    label: "Work",
    plural: "Work",
    titleHint: "the drawer project",
    detailHint: "ask Sam for the old sketches",
    dateRequired: false,
  },
  food: {
    label: "Food",
    plural: "Food",
    titleHint: "the green awning place",
    detailHint: "get the noodles, skip the almonds",
    dateRequired: false,
  },
  recipe: {
    label: "Recipe",
    plural: "Recipes",
    titleHint: "Sunday soup",
    detailHint: "onion, the good stock, too much pepper",
    dateRequired: false,
  },
  pet: {
    label: "Pet",
    plural: "Pets",
    titleHint: "Miso",
    detailHint: "hides when the vacuum starts",
    dateRequired: false,
  },
  health: {
    label: "Health",
    plural: "Health",
    titleHint: "the dentist who gives stickers",
    detailHint: "morning, bring the old card",
    dateRequired: false,
  },
  money: {
    label: "Money",
    plural: "Money",
    titleHint: "lamp warranty",
    detailHint: "receipt in the kitchen drawer",
    dateRequired: false,
  },
  quote: {
    label: "Quote",
    plural: "Quotes",
    titleHint: "something Sam said",
    detailHint: "“bring the good mug”",
    dateRequired: false,
  },
  dream: {
    label: "Dream",
    plural: "Dreams",
    titleHint: "the house with the round window",
    detailHint: "I was late and the train waited",
    dateRequired: false,
  },
  ticket: {
    label: "Ticket",
    plural: "Tickets",
    titleHint: "the late train",
    detailHint: "seat 14, window, keep the stub",
    dateRequired: false,
  },
  song: {
    label: "Song",
    plural: "Songs",
    titleHint: "the one from the kitchen",
    detailHint: "plays when the soup is almost done",
    dateRequired: false,
  },
  win: {
    label: "Win",
    plural: "Wins",
    titleHint: "finished the drawer",
    detailHint: "it closes. that is the whole win.",
    dateRequired: false,
  },
  lesson: {
    label: "Lesson",
    plural: "Lessons",
    titleHint: "label the box",
    detailHint: "future-you will not remember",
    dateRequired: false,
  },
};

export type BucketMeta = {
  id: EntryBucket;
  /** Shared chip label on Shelf */
  label: string;
  scrapbook: string;
  corkboard: string;
};

export const BUCKET_META: Record<EntryBucket, BucketMeta> = {
  scraps: {
    id: "scraps",
    label: "Scraps",
    scrapbook: "Scraps",
    corkboard: "Notes",
  },
  people: {
    id: "people",
    label: "People",
    scrapbook: "People",
    corkboard: "Faces",
  },
  out: {
    id: "out",
    label: "Out & about",
    scrapbook: "Out & about",
    corkboard: "Pins on the map",
  },
  everyday: {
    id: "everyday",
    label: "Everyday",
    scrapbook: "Everyday",
    corkboard: "Desk pile",
  },
  proud: {
    id: "proud",
    label: "Proud",
    scrapbook: "Proud",
    corkboard: "Gold pins",
  },
  dreams: {
    id: "dreams",
    label: "Dreams",
    scrapbook: "Dreams",
    corkboard: "Soft pins",
  },
};

/** Shelf browse chips: All + 6 buckets (not 21 kinds). */
export const FILTERS: Array<{ id: "all" | EntryBucket; label: string }> = [
  { id: "all", label: "All" },
  ...ENTRY_BUCKETS.map((id) => ({ id, label: BUCKET_META[id].label })),
];

export type StatusMeta = {
  id: EntryStatus;
  scrapbook: string;
  corkboard: string;
  /** Short chip label for move menu */
  chip: string;
};

export const STATUS_META: Record<EntryStatus, StatusMeta> = {
  fresh: {
    id: "fresh",
    scrapbook: "On the page",
    corkboard: "Up on the board",
    chip: "Fresh",
  },
  soft: {
    id: "soft",
    scrapbook: "Soft pile",
    corkboard: "Quiet corner",
    chip: "Soft",
  },
  keepsake: {
    id: "keepsake",
    scrapbook: "Keepsakes ♡",
    corkboard: "Proud pins ♡",
    chip: "Keepsake",
  },
  tucked: {
    id: "tucked",
    scrapbook: "Tucked away",
    corkboard: "Boxed up",
    chip: "Tucked",
  },
};

/** Visible status zones on Shelf (tucked stays behind a fold). */
export const SHELF_VISIBLE_STATUSES: readonly EntryStatus[] = ["fresh", "soft", "keepsake"];

export function statusLabel(status: EntryStatus, jacket: JacketId): string {
  const meta = STATUS_META[status];
  return jacket === "corkboard" ? meta.corkboard : meta.scrapbook;
}

export function bucketLabel(bucket: EntryBucket, jacket: JacketId): string {
  const meta = BUCKET_META[bucket];
  return jacket === "corkboard" ? meta.corkboard : meta.scrapbook;
}

export { ENTRY_STATUSES };
