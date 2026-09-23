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
    <section className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
      <div className="empty-page" aria-hidden="true">
        <span className="washi" />
        <span className="sticker-dot dot-a" />
        <span className="sticker-dot dot-b" />
        <span className="sticker-dot dot-c" />
        <p className="font-display text-lg text-ink/45">ruled cream page</p>
        <p className="mt-2 text-xs text-faint">room for a scrap</p>
      </div>
      <h1 className="mt-8 font-display text-title font-semibold">{look.emptyTitle}</h1>
      <p className="mt-2 text-muted">{look.emptyBody}</p>
      <div className="mt-7">
        <KeepSeal toKeep size="lg" />
      </div>
    </section>
  );
}
