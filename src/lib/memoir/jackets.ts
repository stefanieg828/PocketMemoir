import type { ModeId } from "./types";

export type ModeMeta = {
  id: ModeId;
  name: string;
  line: string;
  emptyTitle: string;
  emptyBody: string;
  keepLabel: string;
  addHeading: string;
  dayMoment: string;
  dayEvent: string;
  keptToast: (title: string) => string;
};

/** Mode copy (layout engine). Skins live in looks.ts. */
export const MODE_META: Record<ModeId, ModeMeta> = {
  scrapbook: {
    id: "scrapbook",
    name: "scrapbook",
    line: "a flip album. six spreads, one book.",
    emptyTitle: "the page is blank on purpose.",
    emptyBody: "nothing stuck in yet.",
    keepLabel: "stick it in",
    addHeading: "stick something in",
    dayMoment: "stick this day in",
    dayEvent: "stick it as an event",
    keptToast: (title) => `stuck ${title} in.`,
  },
  corkboard: {
    id: "corkboard",
    name: "corkboard",
    line: "a wall of six boards. tap one to zoom in.",
    emptyTitle: "plenty of cork left.",
    emptyBody: "nothing pinned yet.",
    keepLabel: "pin it",
    addHeading: "pin something",
    dayMoment: "pin this day",
    dayEvent: "pin it as an event",
    keptToast: (title) => `pinned ${title}.`,
  },
};

export const JACKET_META = MODE_META;
