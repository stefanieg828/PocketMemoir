import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { TODO_CAP, TODO_TEXT_MAX, type TodoItem } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

function newTodoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `todo-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `todo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/** "2/5 done" — empty string when there's no list. */
export function todoProgress(todos?: TodoItem[]): string {
  if (!todos?.length) return "";
  const done = todos.filter((t) => t.done).length;
  return done === todos.length ? "all done ✓" : `${done}/${todos.length} done`;
}

/** Keep-form editor: add, edit in place, check, reorder, delete. Free for everyone. */
export function TodoEditor({
  todos,
  onChange,
}: {
  todos: TodoItem[];
  onChange: (next: TodoItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const text = draft.trim().replace(/\s+/g, " ").slice(0, TODO_TEXT_MAX);
    if (!text || todos.length >= TODO_CAP) return;
    onChange([...todos, { id: newTodoId(), text, done: false }]);
    setDraft("");
  }

  function patch(id: string, next: Partial<TodoItem>) {
    onChange(todos.map((t) => (t.id === id ? { ...t, ...next } : t)));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= todos.length) return;
    const next = [...todos];
    const [row] = next.splice(i, 1);
    next.splice(j, 0, row!);
    onChange(next);
  }

  return (
    <div className="todo-editor flex flex-col gap-2">
      <span className="font-display text-sm text-muted">A to-do list, if you want</span>
      {todos.length ? (
        <ul className="todo-list" aria-label="To-do items">
          {todos.map((t, i) => (
            <li key={t.id} className={cn("todo-row", t.done && "is-done")}>
              <button
                type="button"
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.done ? `Uncheck ${t.text}` : `Check off ${t.text}`}
                className="todo-box"
                onClick={() => patch(t.id, { done: !t.done })}
              >
                {t.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </button>
              <input
                className="todo-text-input"
                value={t.text}
                maxLength={TODO_TEXT_MAX}
                aria-label="To-do item"
                onChange={(e) => patch(t.id, { text: e.target.value })}
                onBlur={(e) => {
                  if (!e.target.value.trim()) onChange(todos.filter((x) => x.id !== t.id));
                }}
              />
              <div className="todo-row-actions">
                <button
                  type="button"
                  className="cat-icon-btn"
                  aria-label={`Move ${t.text} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  className="cat-icon-btn"
                  aria-label={`Move ${t.text} down`}
                  disabled={i === todos.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  className="cat-icon-btn"
                  aria-label={`Delete ${t.text}`}
                  onClick={() => onChange(todos.filter((x) => x.id !== t.id))}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {todos.length < TODO_CAP ? (
        <div className="todo-add-row">
          <input
            className="notebook-line todo-add-input"
            value={draft}
            maxLength={TODO_TEXT_MAX}
            placeholder={todos.length ? "one more thing to do" : "first thing to check off"}
            aria-label="New to-do item"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="kind-chip todo-add-btn" onClick={add} disabled={!draft.trim()}>
            <Plus className="size-3.5" aria-hidden="true" />
            add
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Detail page checklist: tap to check off (read-only in a peek). */
export function TodoChecklist({
  todos,
  onToggle,
  readOnly = false,
}: {
  todos: TodoItem[];
  onToggle?: (id: string) => void;
  readOnly?: boolean;
}) {
  if (!todos.length) return null;
  return (
    <div className="kept-row py-3">
      <p className="font-display text-sm text-muted">
        To-do <span className="text-faint">· {todoProgress(todos)}</span>
      </p>
      <ul className="todo-list mt-2" aria-label="To-do list">
        {todos.map((t) => (
          <li key={t.id} className={cn("todo-row", t.done && "is-done")}>
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.done ? `Uncheck ${t.text}` : `Check off ${t.text}`}
              className="todo-box"
              disabled={readOnly}
              onClick={() => onToggle?.(t.id)}
            >
              {t.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </button>
            <span className="todo-text">{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
