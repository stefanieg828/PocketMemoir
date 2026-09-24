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
    name: "Scrapbook",
    line: "A flip album. Six spreads, one book.",
    emptyTitle: "The page is blank on purpose.",
    emptyBody: "Nothing stuck in yet.",
    keepLabel: "Stick it in",
    addHeading: "Stick something in",
    dayMoment: "Stick this day in",
    dayEvent: "Stick it as an event",
    keptToast: (title) => `Stuck ${title} in.`,
  },
  corkboard: {
    id: "corkboard",
    name: "Corkboard",
    line: "A wall of six boards. Tap one to zoom in.",
    emptyTitle: "Plenty of cork left.",
    emptyBody: "Nothing pinned yet.",
    keepLabel: "Pin it",
    addHeading: "Pin something",
    dayMoment: "Pin this day",
    dayEvent: "Pin it as an event",
    keptToast: (title) => `Pinned ${title}.`,
  },
};

export const JACKET_META = MODE_META;
