import type { JacketId } from "./types";

export type LookMeta = {
  id: JacketId;
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

export const LOOK_META: Record<JacketId, LookMeta> = {
  scrapbook: {
    id: "scrapbook",
    name: "Scrapbook",
    line: "Cream pages, washi, a smiling seal.",
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
    line: "Cork dots, index cards, candy pins.",
    emptyTitle: "Plenty of cork left.",
    emptyBody: "Nothing pinned yet.",
    keepLabel: "Pin it",
    addHeading: "Pin something",
    dayMoment: "Pin this day",
    dayEvent: "Pin it as an event",
    keptToast: (title) => `Pinned ${title}.`,
  },
};

export const JACKET_META = LOOK_META;
