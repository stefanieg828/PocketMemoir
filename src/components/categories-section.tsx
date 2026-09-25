import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lock, Plus, RotateCcw, X } from "lucide-react";
import {
  CATEGORY_VIBES,
  PRESET_IDS,
  STARTER_IDS,
  categoryLabel,
  categoryVibe,
  defaultCategoryName,
  isCustomId,
  isPresetId,
  isStarterId,
  type CategoryVibe,
  type PresetId,
} from "@/lib/memoir/categories";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

/**
 * Sticky-note shelf manager in the Look sheet.
 * Free: six starters + Unlock tease.
 * Unlocked: presets on/off, customs, rename anything (starters + presets +
 * customs), hide, reorder. Renames are display-only; Reset restores the
 * built-in name for starters/presets.
 */
export function CategoriesSection() {
  const unlocked = useMemoir((s) => s.unlocked);
  const setUnlocked = useMemoir((s) => s.setUnlocked);
  const mode = useMemoir((s) => s.mode);
  const config = useMemoir((s) => s.categories);
  const setPresetOn = useMemoir((s) => s.setPresetOn);
  const createCategory = useMemoir((s) => s.createCategory);
  const renameCategory = useMemoir((s) => s.renameCategory);
  const resetCategoryName = useMemoir((s) => s.resetCategoryName);
  const hideCategory = useMemoir((s) => s.hideCategory);
  const showCategory = useMemoir((s) => s.showCategory);
  const removeCategory = useMemoir((s) => s.removeCategory);
  const moveCategory = useMemoir((s) => s.moveCategory);
  const focus = usePickerUi((s) => s.focus);

  const [newName, setNewName] = useState("");
  const [newVibe, setNewVibe] = useState<CategoryVibe>("peach");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (focus !== "categories") return;
    const t = window.setTimeout(() => {
      document.getElementById("shelf-categories")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [focus]);

  const onShelf = useMemo(
    () =>
      config.order.map((id) => ({
        id,
        name: categoryLabel(config, id, mode),
        defaultName: defaultCategoryName(id, mode),
        vibe: categoryVibe(config, id),
        kind: isStarterId(id) ? ("starter" as const) : isPresetId(id) ? ("preset" as const) : ("custom" as const),
        renamed: Boolean(config.names[id]),
      })),
    [config, mode],
  );

  const offPresets = PRESET_IDS.filter((id) => !config.order.includes(id));
  const hiddenStarters = STARTER_IDS.filter((id) => !config.order.includes(id));

  function commitEdit() {
    if (!editingId) return;
    renameCategory(editingId, editValue);
    setEditingId(null);
  }

  return (
    <section
      className="picker-section categories-section"
      id="shelf-categories"
      aria-labelledby="shelf-categories-title"
    >
      <h3 className="picker-section-title" id="shelf-categories-title">
        <span className="picker-step categories-step" aria-hidden="true">
          ✿
        </span>
        Your shelf
      </h3>
      <p className="categories-lede">
        {mode === "corkboard"
          ? "Boards on the wall — same sticky-note brain as the scrapbook."
          : "Spreads in the book — same sticky-note brain as the cork wall."}
      </p>

      {!unlocked ? (
        <div className="categories-lock-card">
          <p className="categories-lock-line">
            Free taste: the six starters. Unlock adds Books, Movies, Gift ideas, and boards you invent — and lets you
            rename, hide, and reorder everything (yes, even Scraps).
          </p>
          <ul className="categories-starter-list" aria-label="Starter categories">
            {onShelf.map((row) => (
              <li key={row.id} className={cn("cat-chip", `cat-vibe-${row.vibe}`)}>
                {row.name}
              </li>
            ))}
          </ul>
          <button type="button" className="sticker-cta categories-unlock-btn" onClick={() => setUnlocked(true)}>
            <Lock className="size-4" strokeWidth={2.4} aria-hidden="true" />
            Unlock more boards
          </button>
          <p className="categories-lock-hint">Same unlock as Comic &amp; Riso — free for now, no paywall.</p>
        </div>
      ) : (
        <>
          <h4 className="picker-sub">On the shelf</h4>
          <p className="categories-hint">Tap a name to make it yours. Reset brings the default back.</p>
          <ul className="categories-on-list" aria-label="Categories on your shelf">
            {onShelf.map((row, i) => (
              <li key={row.id} className={cn("cat-row", `cat-vibe-${row.vibe}`)}>
                <div className="cat-row-main">
                  {editingId === row.id ? (
                    <form
                      className="cat-rename-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        commitEdit();
                      }}
                    >
                      <input
                        className="cat-rename-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        maxLength={40}
                        aria-label={`Rename ${row.defaultName}`}
                        autoFocus
                      />
                      <button type="submit" className="kind-chip">
                        Save
                      </button>
                      <button type="button" className="kind-chip" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="cat-row-name"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditValue(row.name);
                        }}
                        title="Tap to rename"
                      >
                        {row.name}
                        {row.renamed ? (
                          <span className="cat-renamed-mark" title={`was “${row.defaultName}”`}>
                            ✎
                          </span>
                        ) : null}
                      </button>
                      <span className="cat-row-kind">
                        {row.kind === "starter" ? "starter" : row.kind === "preset" ? "preset" : "yours"}
                      </span>
                    </>
                  )}
                </div>
                <div className="cat-row-actions">
                  <button
                    type="button"
                    className="cat-icon-btn"
                    aria-label={`Move ${row.name} up`}
                    disabled={i === 0}
                    onClick={() => moveCategory(row.id, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="cat-icon-btn"
                    aria-label={`Move ${row.name} down`}
                    disabled={i === onShelf.length - 1}
                    onClick={() => moveCategory(row.id, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  {row.renamed && !isCustomId(row.id) ? (
                    <button
                      type="button"
                      className="cat-icon-btn"
                      aria-label={`Reset name to ${row.defaultName}`}
                      title={`Back to “${row.defaultName}”`}
                      onClick={() => resetCategoryName(row.id)}
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="cat-icon-btn"
                    aria-label={isCustomId(row.id) ? `Remove ${row.name}` : `Hide ${row.name}`}
                    onClick={() => (isCustomId(row.id) ? removeCategory(row.id) : hideCategory(row.id))}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {offPresets.length > 0 ? (
            <>
              <h4 className="picker-sub">Add a preset</h4>
              <div className="categories-preset-grid">
                {offPresets.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={cn("cat-preset-chip", `cat-vibe-${categoryVibe(config, id)}`)}
                    onClick={() => setPresetOn(id as PresetId, true)}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    {defaultCategoryName(id, mode)}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {hiddenStarters.length > 0 ? (
            <>
              <h4 className="picker-sub">Tucked away</h4>
              <div className="categories-preset-grid">
                {hiddenStarters.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={cn("cat-preset-chip", `cat-vibe-${categoryVibe(config, id)}`)}
                    onClick={() => showCategory(id)}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    {defaultCategoryName(id, mode)}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <h4 className="picker-sub">Make your own</h4>
          <div className="categories-custom-form">
            <input
              className="cat-rename-input"
              placeholder="e.g. Songs stuck in my head"
              value={newName}
              maxLength={40}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="New category name"
            />
            <div className="cat-vibe-row" role="radiogroup" aria-label="Color vibe">
              {CATEGORY_VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={newVibe === v}
                  aria-label={v}
                  className={cn("cat-vibe-dot", `cat-vibe-${v}`, newVibe === v && "is-selected")}
                  onClick={() => setNewVibe(v)}
                />
              ))}
            </div>
            <button
              type="button"
              className="sticker-cta categories-add-btn"
              onClick={() => {
                createCategory(newName.trim() || "My board", newVibe);
                setNewName("");
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Stick it on
            </button>
          </div>
        </>
      )}
    </section>
  );
}
