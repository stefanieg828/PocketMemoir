import { toast } from "sonner";
import { isTwaSession } from "@/lib/memoir/play-billing";

export const SITE_URL = "https://pocketmemoir.fun";
export const PLAY_PACKAGE = "fun.pocketmemoir.app";
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;
export const PLAY_MARKET_URL = `market://details?id=${PLAY_PACKAGE}`;
export const PRIVACY_URL = "/privacy/";
export const SHARE_LINE = "pocket memoir is a tiny scrapbook that lives on your phone. come keep some scraps with me:";

/** Rate: in the Play app jump to the store page; on web open the Play listing in a new tab. */
export function openRate() {
  if (typeof window === "undefined") return;
  if (isTwaSession()) {
    window.location.href = PLAY_MARKET_URL;
    // If market:// isn't handled, fall back to the web listing.
    window.setTimeout(() => {
      if (document.visibilityState === "visible") window.location.href = PLAY_URL;
    }, 900);
    return;
  }
  window.open(PLAY_URL, "_blank", "noopener");
}

/** Share: native share sheet when there is one, otherwise copy the link. */
export async function shareApp() {
  const data = { title: "pocket memoir", text: SHARE_LINE, url: SITE_URL };
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${SHARE_LINE} ${SITE_URL}`);
    toast("link copied. pass it along whenever you like ♥");
  } catch {
    toast(`share this link: ${SITE_URL}`);
  }
}
