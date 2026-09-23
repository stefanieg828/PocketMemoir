import { format } from "date-fns";
import { isCalendarKind } from "./types";
import type { MemoirEntry } from "./types";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const YEAR = /^\d{4}$/;

export function hasDayDate(value?: string): boolean {
  return Boolean(value && DAY.test(value));
}

export function toDayKey(day: Date): string {
  return format(day, "yyyy-MM-dd");
}

export function formatHappenedOn(value?: string): string | null {
  if (!value) return null;
  if (YEAR.test(value)) return value;
  if (MONTH.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return format(new Date(year, month - 1, 1), "MMM yyyy");
  }
  if (DAY.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return format(new Date(year, month - 1, day), "d MMM yyyy");
  }
  return value;
}

export function marksCalendar(entry: MemoirEntry): boolean {
  if (!hasDayDate(entry.happenedOn)) return false;
  return isCalendarKind(entry.kind);
}

export function entriesOnDay(entries: MemoirEntry[], day: Date): MemoirEntry[] {
  const key = toDayKey(day);
  return entries.filter((entry) => marksCalendar(entry) && entry.happenedOn === key);
}

export function daysMarkedInMonth(entries: MemoirEntry[], month: Date): Set<number> {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const marked = new Set<number>();
  for (const entry of entries) {
    if (!marksCalendar(entry) || !entry.happenedOn) continue;
    const [y, m, d] = entry.happenedOn.split("-").map(Number);
    if (y === year && m === mon + 1) marked.add(d);
  }
  return marked;
}
