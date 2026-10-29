import { useEffect, useState } from "react";
import { shouldPreferPlayBilling } from "@/lib/memoir/play-billing";
import { useUnlockUi } from "@/lib/memoir/unlock-ui";

/**
 * Small "paid before?" link under locked CTAs. Opens the unlock sheet straight
 * to the email restore form. Hidden in the Play app (Play re-checks on its own).
 */
export function RestoreLink({ className }: { className?: string }) {
  const openRestore = useUnlockUi((s) => s.openRestore);
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!shouldPreferPlayBilling());
  }, []);
  if (!show) return null;
  return (
    <p className={`restore-link-row ${className ?? ""}`}>
      paid before?{" "}
      <button type="button" className="restore-link" onClick={openRestore}>
        restore with your email
      </button>
    </p>
  );
}
