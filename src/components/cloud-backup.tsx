import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CloudUpload, Copy, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  backupNow,
  fetchCloudBackup,
  turnOffCloudBackup,
  turnOnCloudBackup,
  useCloudBackup,
} from "@/lib/memoir/cloud-backup";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { isStarterShelf, useMemoir } from "@/lib/memoir/store";

const ago = (at: number) => (Date.now() - at < 60_000 ? "just now" : `${formatDistanceToNow(at)} ago`);

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success("code copied — paste it somewhere safe");
  } catch {
    toast("press and hold the code to copy it");
  }
}

async function shareCode(code: string) {
  const text = `my pocket memoir backup code: ${code}\nkeep this — it's the only way to bring my notes back on a new phone.`;
  try {
    await navigator.share({ title: "pocket memoir backup code", text });
  } catch {
    /* canceled */
  }
}

/** Inside "keep them safe": turn on, status, code, and bring back from a code. */
export function CloudBackupBlock({ onFound }: { onFound: (text: string, code: string) => void }) {
  const { code, lastAt, lastCount, busy, error, restoreOpen, setRestoreOpen } = useCloudBackup();
  const peeking = useIsPeeking();
  const [showCode, setShowCode] = useState(false);
  const [input, setInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);
  const [, tick] = useState(0);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (restoreOpen) document.getElementById("cloud-code-input")?.focus();
  }, [restoreOpen]);

  const onFind = async () => {
    setFindError(null);
    setLooking(true);
    const res = await fetchCloudBackup(input);
    setLooking(false);
    if (!res.ok) return setFindError(res.message);
    onFound(res.text, res.code);
  };

  return (
    <div className="cloud-backup" data-testid="cloud-backup">
      <p className="cloud-kicker">
        <CloudUpload className="size-4" strokeWidth={2.2} aria-hidden="true" /> auto backup · free · private
      </p>
      {code ? (
        <>
          <p className="cloud-status" data-testid="cloud-status">
            {busy
              ? "backing up…"
              : lastAt
                ? `last backed up ${ago(lastAt)}${lastCount != null ? ` · ${lastCount} scrap${lastCount === 1 ? "" : "s"}` : ""}`
                : "on — your first backup happens after your next scrap."}
          </p>
          <p className="cloud-note">
            locked with your backup code before it leaves this phone, so only you can open it. we keep your last 5
            backups.
          </p>
          {showCode ? (
            <div className="cloud-code-box">
              <code className="cloud-code" data-testid="cloud-code">
                {code}
              </code>
              <div className="backup-actions">
                <button type="button" className="kind-chip" onClick={() => void copyCode(code)}>
                  <Copy className="size-4" strokeWidth={2.2} aria-hidden="true" /> copy
                </button>
                {canShare ? (
                  <button type="button" className="kind-chip" onClick={() => void shareCode(code)}>
                    send to myself
                  </button>
                ) : null}
                <button type="button" className="footer-link" onClick={() => setShowCode(false)}>
                  hide
                </button>
              </div>
              <p className="cloud-note">
                save it in your notes app, your email, or a screenshot. new phone? type it in here to bring
                everything back. we can't see it or reset it.
              </p>
            </div>
          ) : null}
          <div className="backup-actions">
            <button
              type="button"
              className="kind-chip"
              disabled={busy || peeking}
              onClick={() =>
                void backupNow({ force: true }).then((ok) => ok && toast.success("backed up"))
              }
            >
              back up now
            </button>
            {!showCode ? (
              <button type="button" className="kind-chip" onClick={() => setShowCode(true)}>
                <KeyRound className="size-4" strokeWidth={2.2} aria-hidden="true" /> show my backup code
              </button>
            ) : null}
            <button
              type="button"
              className="footer-link"
              onClick={() => {
                if (window.confirm("turn off auto backup? your code stops working on new phones after this.")) {
                  turnOffCloudBackup();
                  setShowCode(false);
                }
              }}
            >
              turn off
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="cloud-note">
            keeps a locked copy of your scraps, photos, and stickers off this phone, so a cleared browser or a new
            phone doesn't lose them. you get a secret code; only that code opens it.
          </p>
          <div className="backup-actions">
            <button
              type="button"
              className="sticker-cta cloud-on"
              disabled={peeking}
              onClick={() => {
                turnOnCloudBackup();
                setShowCode(true);
                toast.success("auto backup is on", { description: "save your backup code — it's the only key." });
              }}
            >
              turn on auto backup
            </button>
          </div>
        </>
      )}
      {error ? <p className="backup-error">{error}</p> : null}

      {restoreOpen ? (
        <form
          className="cloud-restore"
          onSubmit={(e) => {
            e.preventDefault();
            void onFind();
          }}
        >
          <label htmlFor="cloud-code-input" className="cloud-note">
            your backup code
          </label>
          <input
            id="cloud-code-input"
            className="cloud-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <div className="backup-actions">
            <button type="submit" className="sticker-cta" disabled={looking || peeking || !input.trim()}>
              {looking ? "looking…" : "bring them back"}
            </button>
            <button type="button" className="footer-link" onClick={() => setRestoreOpen(false)}>
              cancel
            </button>
          </div>
          {findError ? (
            <p className="backup-error" role="alert">
              {findError}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="restore-link-row">
          <button type="button" className="restore-link" onClick={() => setRestoreOpen(true)}>
            new phone? bring back your notes with a code
          </button>
        </p>
      )}
    </div>
  );
}

const WELCOME_KEY = "pm.cloudWelcomeDismissed";

/** Home-screen slip on a fresh / empty shelf: offer to bring notes back from a backup code. */
export function CloudWelcome() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const entries = useMemoir((s) => s.entries);
  const code = useCloudBackup((s) => s.code);
  const openAt = usePickerUi((s) => s.openAt);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(WELCOME_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);
  const fresh = entries.length === 0 || isStarterShelf(entries);
  if (!hasHydrated || code || !fresh || dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="backup-nudge cloud-welcome on-cork" role="status" data-testid="cloud-welcome">
      <p className="backup-nudge-text">been here before? bring back your notes.</p>
      <div className="backup-nudge-actions">
        <button
          type="button"
          className="kind-chip"
          onClick={() => {
            useCloudBackup.getState().setRestoreOpen(true);
            openAt("backup");
          }}
        >
          bring back your notes
        </button>
        <button type="button" className="backup-nudge-x" aria-label="not now" onClick={dismiss}>
          <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
