import { Share2, Star } from "lucide-react";
import { PrivacyNote } from "@/components/privacy-note";
import { openRate, shareApp } from "@/lib/memoir/app-links";

/** Rate + share + privacy line at the bottom of the make it yours sheet. */
export function AboutSection() {
  return (
    <section className="picker-section about-section" aria-labelledby="about-pm-title">
      <h3 className="picker-section-title" id="about-pm-title">
        <span className="picker-step" aria-hidden="true">
          ✿
        </span>
        love pocket memoir?
      </h3>
      <PrivacyNote />
      <div className="about-actions">
        <button
          type="button"
          className="kind-chip about-btn"
          onClick={openRate}
          title="leave a little review on Google Play"
        >
          <Star className="size-4" strokeWidth={2.2} aria-hidden="true" />
          rate pocket memoir
        </button>
        <button
          type="button"
          className="kind-chip about-btn"
          onClick={() => void shareApp()}
          title="send pocket memoir to a friend"
        >
          <Share2 className="size-4" strokeWidth={2.2} aria-hidden="true" />
          share pocket memoir
        </button>
      </div>
    </section>
  );
}
