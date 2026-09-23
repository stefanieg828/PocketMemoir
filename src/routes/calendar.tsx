import { useMemo, useState } from "react";
import { addMonths, format, getDay, startOfMonth } from "date-fns";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Polaroid, scrapIsWide } from "@/components/polaroid";
import { daysMarkedInMonth, entriesOnDay, toDayKey } from "@/lib/memoir/dates";
import { LOOK_META } from "@/lib/memoir/jackets";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalCell = { day: null } | { day: number; date: Date };

function CalendarPage() {
  const entries = useMemoir((s) => s.entries);
  const look = LOOK_META[useMemoir((s) => s.jacket)];
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const marked = useMemo(() => daysMarkedInMonth(entries, cursor), [entries, cursor]);
  const selectedEntries = selected ? entriesOnDay(entries, selected) : [];
  const todayKey = toDayKey(new Date());
  const selectedKey = selected ? toDayKey(selected) : "";

  const cells = useMemo(() => {
    const start = startOfMonth(cursor);
    const lead = getDay(start);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const items: CalCell[] = [];
    for (let i = 0; i < lead; i++) items.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({ day: d, date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    }
    return items;
  }, [cursor]);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button
          type="button"
          className="kind-chip px-3"
          aria-label="Previous month"
          onClick={() => {
            setCursor((c) => addMonths(c, -1));
            setSelected(null);
          }}
        >
          Prev
        </button>
        <h1 className="text-center font-display text-xl font-semibold sm:text-title">
          {format(cursor, "MMMM yyyy")}
        </h1>
        <button
          type="button"
          className="kind-chip px-3"
          aria-label="Next month"
          onClick={() => {
            setCursor((c) => addMonths(c, 1));
            setSelected(null);
          }}
        >
          Next
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Dots mean a dated event, moment, trip, or checkup. No nagging.
      </p>

      <div className="scrap-card mt-6 p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-2 font-display text-xs text-faint">
              {d}
            </div>
          ))}
          {cells.map((cell, index) => {
            if (cell.day === null) {
              return <div key={`e-${index}`} className="cal-cell" />;
            }
            const dayDate = cell.date;
            const key = toDayKey(dayDate);
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const hasMark = marked.has(cell.day);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                aria-label={format(dayDate, "d MMMM yyyy")}
                onClick={() => setSelected(dayDate)}
                className={cn(
                  "cal-cell relative flex flex-col items-center justify-center rounded-md text-sm",
                  isSelected && "bg-seal text-seal-ink",
                  !isSelected && isToday && "bg-gold",
                  !isSelected && !isToday && "hover:bg-paper-deep/70",
                )}
              >
                <span>{cell.day}</span>
                {hasMark ? (
                  <span
                    className={cn(
                      "mt-0.5 size-2 rounded-full border-2 border-ink",
                      isSelected ? "bg-seal-ink" : "bg-washi",
                    )}
                  />
                ) : (
                  <span className="mt-0.5 size-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold">{format(selected, "d MMMM yyyy")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/keep"
              search={{ kind: "moment", date: selectedKey }}
              className="kind-chip no-underline"
            >
              {look.dayMoment}
            </Link>
            <Link
              to="/keep"
              search={{ kind: "event", date: selectedKey }}
              className="kind-chip bg-gold no-underline"
            >
              {look.dayEvent}
            </Link>
          </div>
          {selectedEntries.length === 0 ? (
            <p className="mt-5 text-sm text-muted">{look.emptyBody}</p>
          ) : (
            <ul className="mt-6 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2">
              {selectedEntries.map((entry) => (
                <li key={entry.id} className={cn(scrapIsWide(entry) && "sm:col-span-2")}>
                  <Polaroid entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-faint">Tap a day to see what’s there.</p>
      )}
    </section>
  );
}
