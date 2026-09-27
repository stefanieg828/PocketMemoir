import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useMemoir } from "@/lib/memoir/store";

/** Unlock perk: jot ideas locally + mailto scraps@ for the creator. */
export function GotAnIdeaSection() {
  const unlocked = useMemoir((s) => s.unlocked);
  const suggestions = useMemoir((s) => s.suggestions);
  const addSuggestion = useMemoir((s) => s.addSuggestion);
  const removeSuggestion = useMemoir((s) => s.removeSuggestion);
  const [ideaText, setIdeaText] = useState("");

  if (!unlocked) return null;

  return (
    <section className="picker-section" aria-labelledby="got-an-idea-title">
      <div className="suggestions-panel" id="got-an-idea">
        <h4 className="picker-sub" id="got-an-idea-title">
          Got an idea?
        </h4>
        <p className="categories-hint">
          Email the creator at{" "}
          <a href="mailto:scraps@pocketmemoir.fun">scraps@pocketmemoir.fun</a>{" "}
          and maybe your ideas will come to fruition!
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
    </section>
  );
}
