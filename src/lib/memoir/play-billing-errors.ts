/**
 * Pure helpers for the Play Billing (Digital Goods + Payment Request) path.
 * No DOM / alias imports so node --experimental-strip-types can test it.
 *
 * Key gotcha: android-browser-helper's PaymentActivity reports EVERY failure
 * ("Play Billing did not find product.", "Launching app is not verified.",
 * "BillingClient disconnected." …) as Activity.RESULT_CANCELED, which Chrome
 * surfaces as `AbortError: Payment app returned RESULT_CANCELED code…`.
 * A real user cancel in the Play sheet looks identical, so we must never
 * swallow AbortError silently — that is what made the unlock button feel dead.
 */

export type PlayFailureKind =
  | "play-closed" // RESULT_CANCELED from the TWA payment activity (cancel OR Play-side failure)
  | "user-closed" // Chrome's own payment sheet closed by the user
  | "not-supported" // payment method not available (not a Play/TWA install, Custom Tab fallback)
  | "needs-tap" // show() without transient user activation
  | "busy" // a payment sheet is already showing
  | "unknown";

export type PlayErrorInfo = { name: string; message: string };

export function describeError(err: unknown): PlayErrorInfo {
  if (err && typeof err === "object") {
    const e = err as { name?: unknown; message?: unknown };
    return {
      name: typeof e.name === "string" && e.name ? e.name : "Error",
      message: typeof e.message === "string" ? e.message : String(err),
    };
  }
  return { name: "Error", message: String(err ?? "") };
}

export function classifyPlayError(err: unknown): PlayFailureKind {
  const { name, message } = describeError(err);
  const m = message.toLowerCase();
  if (name === "AbortError") {
    if (m.includes("result_canceled") || m.includes("payment app")) return "play-closed";
    return "user-closed";
  }
  if (name === "NotSupportedError") return "not-supported";
  if (name === "SecurityError" || m.includes("user activation") || m.includes("user gesture")) {
    return "needs-tap";
  }
  if (name === "InvalidStateError") return "busy";
  if (m.includes("not supported") || m.includes("unavailable")) return "not-supported";
  return "unknown";
}

/** Soft, lowercase copy for each failure — shown inline in the unlock sheet. */
export function playFailureMessage(kind: PlayFailureKind): string {
  switch (kind) {
    case "play-closed":
      return "google play closed without a purchase — nothing was charged. if you never saw the play sheet, big scraps may not be live for your play account yet. tap unlock to try again.";
    case "user-closed":
      return "no worries — nothing was charged. tap unlock whenever you're ready.";
    case "not-supported":
      return "google play billing isn't reachable in this copy of the app. update pocket memoir from google play, then try again.";
    case "needs-tap":
      return "that took a moment — tap unlock once more to open google play.";
    case "busy":
      return "a google play window is already open — finish or close it, then try again.";
    default:
      return "couldn't open google play just now. tap unlock to try again in a moment.";
  }
}

export type PlayItemDetails = {
  itemId: string;
  title?: string;
  price?: { currency?: string; value?: string };
};

/** Normalize getDetails() output (array of ItemDetails) → items for our SKU. */
export function pickItem(details: unknown, sku: string): PlayItemDetails | null {
  if (!Array.isArray(details)) return null;
  for (const d of details) {
    if (d && typeof d === "object" && (d as { itemId?: unknown }).itemId === sku) {
      return d as PlayItemDetails;
    }
  }
  return null;
}

/** "US$0.99" style label from Play's localized price, or null. */
export function formatPlayPrice(item: PlayItemDetails | null, locale?: string): string | null {
  const cur = item?.price?.currency;
  const val = item?.price?.value;
  if (!cur || val === undefined || val === null || val === "") return null;
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: cur }).format(n);
  } catch {
    return `${val} ${cur}`;
  }
}

export type PlayProbeStatus =
  | "no-api" // window.getDigitalGoodsService missing
  | "service-error" // getDigitalGoodsService rejected / returned null
  | "no-product" // getDetails(['big_scraps']) returned nothing
  | "details-error" // getDetails threw
  | "ready";

export function probeStatusMessage(status: PlayProbeStatus, inTwa: boolean): string | null {
  switch (status) {
    case "ready":
      return null;
    case "no-api":
      return inTwa
        ? "google play billing isn't switched on in this copy of the app (it may be opening as a browser tab). update pocket memoir from google play, then reopen it."
        : null;
    case "service-error":
      return "google play billing didn't answer. make sure pocket memoir was installed from google play (your testing link), then reopen the app.";
    case "no-product":
      return "google play doesn't have big scraps ready for your account yet — nothing to buy just now. check back soon.";
    case "details-error":
      return "couldn't reach google play to load big scraps. check your connection and tap unlock to try again.";
  }
}
