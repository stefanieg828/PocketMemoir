import { useMemoir } from "@/lib/memoir/store";

/** Unlock perk: invite to email the creator with ideas. */
export function GotAnIdeaSection() {
  const unlocked = useMemoir((s) => s.unlocked);

  if (!unlocked) return null;

  return (
    <section
      className="picker-section suggestions-panel"
      id="got-an-idea"
      aria-labelledby="got-an-idea-title"
    >
      <h3 className="picker-section-title" id="got-an-idea-title">
        <span className="picker-step ideas-step" aria-hidden="true">
          ✎
        </span>
        Got an idea?
      </h3>
      <p className="backup-lede">
        Email the creator at{" "}
        <a href="mailto:scraps@pocketmemoir.fun">scraps@pocketmemoir.fun</a>.
      </p>
    </section>
  );
}
