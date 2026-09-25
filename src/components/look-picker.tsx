import { useEffect, type CSSProperties, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock } from "lucide-react";
import { BackupSection } from "@/components/backup-section";
import { CategoriesSection } from "@/components/categories-section";
import { MODE_META } from "@/lib/memoir/jackets";
import {
  LOOK_SKINS,
  RISO_BODY_FONTS,
  RISO_INK_PAIRS,
  RISO_TITLE_FONTS,
  risoCssVars,
} from "@/lib/memoir/looks";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useMemoir } from "@/lib/memoir/store";
import { LOOK_IDS, MODES, type LookId, type ModeId } from "@/lib/memoir/types";
import { cn } from "@/lib/utils";

/**
 * Two separate settings: Mode (layout engine) and Look (skin).
 * Riso adds ink + type options. Comic / Riso carry a cosmetic "Unlock" badge only.
 */
export function LookPicker({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const mode = useMemoir((s) => s.mode);
  const look = useMemoir((s) => s.look);
  const setMode = useMemoir((s) => s.setMode);
  const setLook = useMemoir((s) => s.setLook);
  const setTourSeen = useMemoir((s) => s.setTourSeen);
  const open = usePickerUi((s) => s.open);
  const focus = usePickerUi((s) => s.focus);
  const setOpen = usePickerUi((s) => s.setOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen, setOpen]);

  useEffect(() => {
    if (!open || !focus) return;
    const target = focus === "categories" ? "shelf-categories" : focus === "backup" ? "keep-safe" : null;
    if (!target) return;
    const id = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [open, focus]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="app-nav-link"
          aria-label={`Look, currently ${MODE_META[mode].name} · ${LOOK_SKINS[look].name}`}
        >
          Look
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="picker-overlay fixed inset-0 z-50" />
        <Dialog.Content className="picker-dialog fixed top-1/2 left-1/2 z-50 max-h-[min(92dvh,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto">
          <Dialog.Title className="picker-title">Make it yours</Dialog.Title>
          <Dialog.Description className="picker-desc">
            Mode is the layout. Look is the paper. Same scraps either way.
          </Dialog.Description>

          <PickerSection step="1" title="Mode">
            <div role="radiogroup" aria-label="Mode" className="picker-grid picker-grid-2">
              {MODES.map((id) => (
                <ModeCard key={id} id={id} selected={id === mode} onPick={() => setMode(id)} />
              ))}
            </div>
          </PickerSection>

          <PickerSection step="2" title="Look">
            <div role="radiogroup" aria-label="Look" className="picker-grid picker-grid-3">
              {LOOK_IDS.map((id) => (
                <LookCard key={id} id={id} selected={id === look} onPick={() => setLook(id)} />
              ))}
            </div>
          </PickerSection>

          {look === "riso" ? <RisoOptions /> : null}

          <CategoriesSection />

          <BackupSection />

          <section className="picker-section tour-replay-section" aria-label="Tour">
            <button
              type="button"
              className="tour-replay"
              onClick={() => {
                setOpen(false);
                setTourSeen(false);
              }}
            >
              Show the tour again
            </button>
          </section>

          <div className="picker-footer">
            <p className="picker-using">
              {MODE_META[mode].name} · {LOOK_SKINS[look].name}
            </p>
            <Dialog.Close asChild>
              <button type="button" className="kind-chip picker-done">
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PickerSection({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="picker-section">
      <h3 className="picker-section-title">
        <span className="picker-step" aria-hidden="true">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function ModeCard({ id, selected, onPick }: { id: ModeId; selected: boolean; onPick: () => void }) {
  const meta = MODE_META[id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={cn("picker-card", selected && "is-selected")}
    >
      <span className={cn("mode-swatch", `mode-swatch-${id}`)} aria-hidden="true">
        {id === "scrapbook" ? (
          <>
            <span className="ms-page ms-page-l" />
            <span className="ms-page ms-page-r" />
          </>
        ) : (
          <>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="ms-board" />
            ))}
          </>
        )}
      </span>
      <span className="picker-card-name">{meta.name}</span>
      <span className="picker-card-line">{meta.line}</span>
    </button>
  );
}

function LookCard({ id, selected, onPick }: { id: LookId; selected: boolean; onPick: () => void }) {
  const skin = LOOK_SKINS[id];
  const riso = useMemoir((s) => s.riso);
  const style = id === "riso" ? (risoCssVars(riso) as CSSProperties) : undefined;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={cn("picker-card picker-card-look", selected && "is-selected")}
    >
      {skin.unlock ? (
        <span className="unlock-badge" title="Future unlock — free for now">
          <Lock className="size-3" strokeWidth={2.5} aria-hidden="true" />
          Unlock
        </span>
      ) : (
        <span className="unlock-badge unlock-badge-free">Free</span>
      )}
      <span className={cn("look-swatch", `look-swatch-${id}`)} style={style} aria-hidden="true">
        <span className="ls-title">{id === "storybook" ? "Memoir" : id === "comic" ? "POW!" : "Zine"}</span>
        <span className="ls-dots">
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>
      <span className="picker-card-name">{skin.name}</span>
      <span className="picker-card-line">{skin.line}</span>
    </button>
  );
}

function RisoOptions() {
  const riso = useMemoir((s) => s.riso);
  const setRiso = useMemoir((s) => s.setRiso);
  const vars = risoCssVars(riso);

  return (
    <PickerSection step="3" title="Riso inks & type">
      <p className="picker-hint">Two inks, grain, torn edges and stamps stay. Swap the drums and the lettering.</p>

      <h4 className="picker-sub">Ink pair</h4>
      <div role="radiogroup" aria-label="Ink pair" className="ink-grid">
        {RISO_INK_PAIRS.map((pair) => {
          const on = riso.pair === pair.id;
          return (
            <button
              key={pair.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={pair.name}
              className={cn("ink-chip", on && "is-selected")}
              onClick={() => setRiso({ pair: pair.id, inkA: pair.a, inkB: pair.b })}
            >
              <span className="ink-dots" aria-hidden="true">
                <span style={{ background: pair.a }} />
                <span style={{ background: pair.b }} />
              </span>
              <span className="ink-name">{pair.name}</span>
            </button>
          );
        })}
        <div className={cn("ink-chip ink-chip-custom", riso.pair === "custom" && "is-selected")}>
          <span className="ink-dots">
            <label className="ink-picker" aria-label="Custom accent ink">
              <input
                type="color"
                value={vars["--riso-a"]}
                onChange={(e) => setRiso({ pair: "custom", inkA: e.target.value, inkB: vars["--riso-b"] })}
              />
            </label>
            <label className="ink-picker" aria-label="Custom key ink">
              <input
                type="color"
                value={vars["--riso-b"]}
                onChange={(e) => setRiso({ pair: "custom", inkA: vars["--riso-a"], inkB: e.target.value })}
              />
            </label>
          </span>
          <span className="ink-name">Custom</span>
        </div>
      </div>

      <h4 className="picker-sub">Title lettering</h4>
      <div role="radiogroup" aria-label="Title font" className="font-grid">
        {RISO_TITLE_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={riso.titleFont === f.id}
            className={cn("font-chip", riso.titleFont === f.id && "is-selected")}
            onClick={() => setRiso({ titleFont: f.id })}
          >
            <span className="font-chip-sample" style={{ fontFamily: f.stack }}>
              Pocket Memoir
            </span>
            <span className="font-chip-name">{f.name}</span>
          </button>
        ))}
      </div>

      <h4 className="picker-sub">Notes & labels</h4>
      <div role="radiogroup" aria-label="Body font" className="font-grid">
        {RISO_BODY_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={riso.bodyFont === f.id}
            className={cn("font-chip", riso.bodyFont === f.id && "is-selected")}
            onClick={() => setRiso({ bodyFont: f.id })}
          >
            <span className="font-chip-sample font-chip-sample-body" style={{ fontFamily: f.stack }}>
              tiny proof of being there
            </span>
            <span className="font-chip-name">{f.name}</span>
          </button>
        ))}
      </div>
    </PickerSection>
  );
}
