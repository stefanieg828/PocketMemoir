import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
  CATEGORY_VIBES,
  PRESET_IDS,
  STARTER_IDS,
  categoryLabel,
  categoryVibe,
  defaultCategoryName,
  hiddenKindsForBucket,
  isCustomId,
  isPresetId,
  isStarterId,
  kindsForBucket,
  type CategoryVibe,
  type PresetId,
} from "@/lib/memoir/categories";
import { KIND_META } from "@/lib/memoir/copy";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import { cn } from "@/lib/utils";

/**
 * Sticky-note shelf manager in the Look sheet.
 * Free: six starters you can rename + Unlock tease for more boards.
 * Unlocked: presets on/off, customs, rename anything (starters + presets +
 * customs), hide, reorder, editable stickers per board, and a tiny idea notepad.
 * Renames are display-only; Reset restores the built-in name for starters/presets.
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
  const renameKind = useMemoir((s) => s.renameKind);
  const resetKindName = useMemoir((s) => s.resetKindName);
  const hideKind = useMemoir((s) => s.hideKind);
  const showKind = useMemoir((s) => s.showKind);
  const addCustomKind = useMemoir((s) => s.addCustomKind);
  const removeCustomKind = useMemoir((s) => s.removeCustomKind);
  const suggestions = useMemoir((s) => s.suggestions);
  const addSuggestion = useMemoir((s) => s.addSuggestion);
  const removeSuggestion = useMemoir((s) => s.removeSuggestion);
  const focus = usePickerUi((s) => s.focus);

  const [newName, setNewName] = useState("");
  const [newVibe, setNewVibe] = useState<CategoryVibe>("peach");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [stickersOpen, setStickersOpen] = useState(false);
  const [stickerBoard, setStickerBoard] = useState<string>(STARTER_IDS[0]);
  const [editingKind, setEditingKind] = useState<string | null>(null);
  const [editKindValue, setEditKindValue] = useState("");
  const [newSticker, setNewSticker] = useState("");
  const [ideaText, setIdeaText] = useState("");

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

  /** Free shelf: always the six starters (rename allowed; no hide/reorder/presets). */
  const freeStarters = useMemo(
    () =>
      STARTER_IDS.map((id) => ({
        id,
        name: categoryLabel(config, id, mode),
        defaultName: defaultCategoryName(id, mode),
        vibe: categoryVibe(config, id),
        renamed: Boolean(config.names[id]),
      })),
    [config, mode],
  );

  const offPresets = PRESET_IDS.filter((id) => !config.order.includes(id));
  const hiddenStarters = STARTER_IDS.filter((id) => !config.order.includes(id));

  const starterBoards = useMemo(
    () => STARTER_IDS.map((id) => ({ id, name: categoryLabel(config, id, mode) })),
    [config, mode],
  );

  const boardStickers = useMemo(
    () => kindsForBucket(config, stickerBoard, true),
    [config, stickerBoard],
  );
  const hiddenOnBoard = useMemo(
    () => hiddenKindsForBucket(config, stickerBoard),
    [config, stickerBoard],
  );

  function commitEdit() {
    if (!editingId) return;
    renameCategory(editingId, editValue);
    setEditingId(null);
  }

  function commitKindEdit() {
    if (!editingKind) return;
    renameKind(stickerBoard, editingKind, editKindValue);
    setEditingKind(null);
  }

  function renderRenameMain(row: {
    id: string;
    name: string;
    defaultName: string;
    renamed: boolean;
    kind?: "starter" | "preset" | "custom";
  }) {
    if (editingId === row.id) {
      return (
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
      );
    }
    return (
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
        {row.kind ? (
          <span className="cat-row-kind">
            {row.kind === "starter" ? "starter" : row.kind === "preset" ? "preset" : "yours"}
          </span>
        ) : null}
      </>
    );
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
      {!unlocked ? (
        <div className="categories-lock-card">
          <p className="categories-lock-line">
            Free: six plain starter boards you can rename. Unlock adds more boards (Books, Movies, Gift ideas, and ones
            you invent), editable stickers on each board, hide &amp; reorder, and a tiny “Got an idea?” notepad.
          </p>
          <p className="categories-hint">Tap a name to make it yours. Reset brings the default back.</p>
          <ul className="categories-on-list" aria-label="Starter categories">
            {freeStarters.map((row) => (
              <li key={row.id} className={cn("cat-row", `cat-vibe-${row.vibe}`)}>
                <div className="cat-row-main">{renderRenameMain(row)}</div>
                <div className="cat-row-actions">
                  {row.renamed ? (
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
                </div>
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
          <p className="categories-hint">Tap a name to make it yours. Reset brings the default back.</p>
          <ul className="categories-on-list" aria-label="Categories on your shelf">
            {onShelf.map((row, i) => (
              <li key={row.id} className={cn("cat-row", `cat-vibe-${row.vibe}`)}>
                <div className="cat-row-main">{renderRenameMain(row)}</div>
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

          <div className="stickers-panel">
            <button
              type="button"
              className="stickers-panel-toggle"
              aria-expanded={stickersOpen}
              onClick={() => setStickersOpen((v) => !v)}
            >
              <span>Stickers on this board</span>
              {stickersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {stickersOpen ? (
              <div className="stickers-panel-body">
                <p className="categories-hint">
                  Rename or hide the built-in chips, or add your own. Customs save as a Note underneath so older scraps
                  stay readable.
                </p>
                <div className="stickers-board-tabs" role="tablist" aria-label="Starter board">
                  {starterBoards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="tab"
                      aria-selected={stickerBoard === b.id}
                      className={cn("kind-chip kind-chip-soft", stickerBoard === b.id && "bg-gold")}
                      onClick={() => {
                        setStickerBoard(b.id);
                        setEditingKind(null);
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <ul className="categories-on-list stickers-kind-list" aria-label="Stickers on this board">
                  {boardStickers.map((chip) => {
                    const defaultLabel = chip.custom
                      ? chip.label
                      : KIND_META[chip.builtinKind].label;
                    const renamed =
                      !chip.custom && Boolean(config.kindExtras?.[stickerBoard]?.renames?.[chip.id]);
                    return (
                      <li key={chip.id} className="cat-row">
                        <div className="cat-row-main">
                          {editingKind === chip.id ? (
                            <form
                              className="cat-rename-form"
                              onSubmit={(e) => {
                                e.preventDefault();
                                commitKindEdit();
                              }}
                            >
                              <input
                                className="cat-rename-input"
                                value={editKindValue}
                                onChange={(e) => setEditKindValue(e.target.value)}
                                maxLength={40}
                                aria-label={`Rename sticker ${chip.label}`}
                                autoFocus
                              />
                              <button type="submit" className="kind-chip">
                                Save
                              </button>
                              <button type="button" className="kind-chip" onClick={() => setEditingKind(null)}>
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="cat-row-name"
                                onClick={() => {
                                  setEditingKind(chip.id);
                                  setEditKindValue(chip.label);
                                }}
                                title="Tap to rename"
                              >
                                {chip.label}
                                {renamed ? (
                                  <span className="cat-renamed-mark" title={`was “${defaultLabel}”`}>
                                    ✎
                                  </span>
                                ) : null}
                              </button>
                              <span className="cat-row-kind">{chip.custom ? "yours" : "builtin"}</span>
                            </>
                          )}
                        </div>
                        <div className="cat-row-actions">
                          {renamed ? (
                            <button
                              type="button"
                              className="cat-icon-btn"
                              aria-label={`Reset name to ${defaultLabel}`}
                              title={`Back to “${defaultLabel}”`}
                              onClick={() => resetKindName(stickerBoard, chip.id)}
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          ) : null}
                          {chip.custom ? (
                            <button
                              type="button"
                              className="cat-icon-btn"
                              aria-label={`Delete ${chip.label}`}
                              onClick={() => removeCustomKind(stickerBoard, chip.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cat-icon-btn"
                              aria-label={`Hide ${chip.label}`}
                              onClick={() => hideKind(stickerBoard, chip.id)}
                            >
                              <EyeOff className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {hiddenOnBoard.length > 0 ? (
                  <>
                    <p className="categories-hint">Hidden builtins — tap to show again.</p>
                    <div className="categories-preset-grid">
                      {hiddenOnBoard.map((kid) => (
                        <button
                          key={kid}
                          type="button"
                          className="cat-preset-chip"
                          onClick={() => showKind(stickerBoard, kid)}
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          {KIND_META[kid].label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                <div className="categories-custom-form stickers-add-row">
                  <input
                    className="cat-rename-input"
                    placeholder="New sticker name"
                    value={newSticker}
                    maxLength={40}
                    onChange={(e) => setNewSticker(e.target.value)}
                    aria-label="New sticker name"
                  />
                  <button
                    type="button"
                    className="sticker-cta categories-add-btn"
                    onClick={() => {
                      const label = newSticker.trim() || "Sticker";
                      addCustomKind(stickerBoard, label);
                      setNewSticker("");
                    }}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add sticker
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="suggestions-panel" id="got-an-idea">
            <h4 className="picker-sub">Got an idea?</h4>
            <p className="categories-hint">
              A pocket notepad for app wishes — stays on this device for now. No forum, no send.
            </p>
            <div className="suggestions-form">
              <textarea
                className="suggestions-input"
                rows={2}
                maxLength={280}
                placeholder="e.g. a sticker for recipes I invent…"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                aria-label="Suggestion"
              />
              <button
                type="button"
                className="sticker-cta categories-add-btn"
                onClick={() => {
                  addSuggestion(ideaText);
                  setIdeaText("");
                }}
              >
                Save
              </button>
            </div>
            {suggestions.length > 0 ? (
              <ul className="suggestions-list" aria-label="Saved ideas">
                {suggestions.map((s) => (
                  <li key={s.id} className="suggestions-row">
                    <span className="suggestions-text">{s.text}</span>
                    <button
                      type="button"
                      className="cat-icon-btn"
                      aria-label="Remove idea"
                      onClick={() => removeSuggestion(s.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
