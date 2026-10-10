import { X } from "lucide-react";
import { toast } from "sonner";
import { scrapsSinceBackup, shouldNudgeBackup } from "@/lib/memoir/backup";
import { presentSaveToOutcome, saveBackupToChosenPlace } from "@/lib/memoir/backup-io";
import { usePickerUi } from "@/lib/memoir/picker-ui";
import { useIsPeeking } from "@/lib/memoir/peek-session";
import { useMemoir } from "@/lib/memoir/store";

/** Small, dismissible slip after BACKUP_NUDGE_AFTER new scraps since the last backup. */
export function BackupNudge() {
  const hasHydrated = useMemoir((s) => s.hasHydrated);
  const entries = useMemoir((s) => s.entries);
  const lastBackupAt = useMemoir((s) => s.lastBackupAt);
  const dismissedAt = useMemoir((s) => s.backupNudgeDismissedAt);
  const dismiss = useMemoir((s) => s.dismissBackupNudge);
  const openPickerAt = usePickerUi((s) => s.openAt);
  const peeking = useIsPeeking();

  if (peeking || !hasHydrated || !shouldNudgeBackup(entries, lastBackupAt, dismissedAt)) return null;
  const n = scrapsSinceBackup(entries, lastBackupAt);

  return (
    <div className="backup-nudge on-cork" role="status">
      <p className="backup-nudge-text">
        {n} new scraps since {lastBackupAt ? "your last backup" : "you started"}. Keep a copy?
      </p>
      <div className="backup-nudge-actions">
        <button
          type="button"
          className="kind-chip backup-nudge-save"
          onClick={() => {
            void saveBackupToChosenPlace()
              .then((res) => presentSaveToOutcome(res))
              .catch(() => toast.error("Couldn't make the file just now. Try again in a moment."));
          }}
        >
          Save to…
        </button>
        <button type="button" className="footer-link backup-nudge-more" onClick={() => openPickerAt("backup")}>
          More
        </button>
        <button type="button" className="backup-nudge-x" aria-label="Not now" onClick={dismiss}>
          <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
