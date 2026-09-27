import { useMemoir } from "@/lib/memoir/store";

/** Unlock perk: invite to email scraps@ with ideas. */
export function GotAnIdeaSection() {
  const unlocked = useMemoir((s) => s.unlocked);

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
      </div>
    </section>
  );
}
