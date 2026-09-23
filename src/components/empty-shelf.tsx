import { AlbumPage } from "@/components/album-page";
import { KeepSeal } from "@/components/keep-seal";
import { LOOK_META } from "@/lib/memoir/jackets";
import { useMemoir } from "@/lib/memoir/store";

export function EmptyShelf() {
  const jacket = useMemoir((s) => s.jacket);
  const look = LOOK_META[jacket];

  if (jacket === "corkboard") {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
        <div className="empty-cork" aria-hidden="true">
          <div className="ghost-card">
            <span className="pin pin-b" />
            <p className="font-display text-lg text-ink/50">index card</p>
            <p className="mt-2 text-xs text-faint">waiting for a pin</p>
          </div>
        </div>
        <h1 className="mt-8 font-display text-title font-semibold">{look.emptyTitle}</h1>
        <p className="mt-2 text-muted">{look.emptyBody}</p>
        <div className="mt-7">
          <KeepSeal toKeep size="lg" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl py-2">
      <AlbumPage empty seed="new-album">
        <div className="album-empty-scene">
          <span className="washi washi-b album-loose-tape" aria-hidden="true" />
          <span className="washi washi-d" aria-hidden="true" style={{ top: "auto", bottom: "3.2rem", left: "1.4rem" }} />
          <span className="sticker-dot dot-a" aria-hidden="true" />
          <span className="sticker-dot dot-b" aria-hidden="true" />
          <span className="sticker-dot dot-c" aria-hidden="true" />
          <span className="sticker-dot dot-d" aria-hidden="true" />
          <span className="doodle-star" aria-hidden="true" style={{ top: "1.2rem", left: "1.4rem", bottom: "auto", right: "auto" }}>
            ★
          </span>
          <span className="doodle-heart doodle-b" aria-hidden="true" style={{ bottom: "1.6rem", right: "1.3rem" }}>
            ♡
          </span>
          <span className="wax-accent" aria-hidden="true" />
          <h1 className="font-display text-title font-semibold">{look.emptyTitle}</h1>
          <p className="mt-2 text-muted">{look.emptyBody}</p>
          <span className="page-scribble" aria-hidden="true" />
          <p className="mt-2 font-display text-sm text-faint">Plenty of page left.</p>
          <div className="mt-8">
            <KeepSeal toKeep size="lg" />
          </div>
        </div>
      </AlbumPage>
    </section>
  );
}
