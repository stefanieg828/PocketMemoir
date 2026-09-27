/**
 * Site unlock (99¢ one-time) — Stripe Payment Link plugs in later.
 * No webhook yet: success URL / restore backup / DEV preview unlock the gate.
 */

/** Build-time Payment Link. Empty until Stefanie creates one. */
export const STRIPE_PAYMENT_LINK = String(
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_STRIPE_PAYMENT_LINK as string | undefined)) ||
    "",
).trim();

const PREVIEW_SESSION_KEY = "pm.previewUnlock";

export function hasStripePaymentLink() {
  return STRIPE_PAYMENT_LINK.length > 0;
}

/** DEV builds always allow a soft preview path. */
export function isUnlockDevPreview() {
  return Boolean(typeof import.meta !== "undefined" && import.meta.env?.DEV);
}

/**
 * One-shot / session testing path for production builds without a Payment Link.
 * Honors `?previewUnlock=1` (strips it) or a prior session flag — never a public free CTA.
 */
export function consumePreviewUnlockFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(PREVIEW_SESSION_KEY) === "1") return true;
  } catch {
    /* private mode */
  }
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("previewUnlock") !== "1") return false;
    url.searchParams.delete("previewUnlock");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
    try {
      sessionStorage.setItem(PREVIEW_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

export function canPreviewUnlock(): boolean {
  if (isUnlockDevPreview()) return true;
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(PREVIEW_SESSION_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    return new URL(window.location.href).searchParams.get("previewUnlock") === "1";
  } catch {
    return false;
  }
}

/** Success query params Stripe (or a manual test) may land on. */
export function readUnlockSuccessFromUrl(href = typeof window !== "undefined" ? window.location.href : ""): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    const unlock = url.searchParams.get("unlock");
    const unlocked = url.searchParams.get("unlocked");
    return unlock === "success" || unlocked === "1" || unlocked === "true";
  } catch {
    return false;
  }
}

/** Strip unlock / unlocked success params without a reload. */
export function stripUnlockSuccessParams() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    let dirty = false;
    for (const key of ["unlock", "unlocked"] as const) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        dirty = true;
      }
    }
    if (!dirty) return;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

export const UNLOCK_PRICE_LABEL = "99¢";
export const UNLOCK_MAILTO = "mailto:scraps@pocketmemoir.fun?subject=pocket%20memoir%20unlock";
