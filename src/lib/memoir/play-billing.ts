/**
 * Play Billing via Digital Goods + Payment Request (TWA / Bubblewrap playBilling).
 * Product id matches Play Console one-time IAP. Same unlock bit as Stripe success.
 *
 * Flow: probe on sheet open (service + getDetails(['big_scraps'])), then on tap
 * build the PaymentRequest and call show() straight away (no awaits first, so
 * Chrome's transient user activation is still valid). Failures are classified
 * (see play-billing-errors.ts) and surfaced — never swallowed.
 */

import { isAndroidTwaReferrer } from "@/lib/memoir/installed-display";
import {
  describeError,
  pickItem,
  type PlayItemDetails,
  type PlayProbeStatus,
} from "@/lib/memoir/play-billing-errors";

export const PLAY_BILLING_METHOD = "https://play.google.com/billing";
export const PLAY_SKU_BIG_SCRAPS = "big_scraps";

/** Minimal Digital Goods purchase shape (Chrome / ABH). */
export type PlayPurchase = {
  itemId: string;
  purchaseToken: string;
};

export type DigitalGoodsServiceLike = {
  getDetails?: (itemIds: string[]) => Promise<unknown>;
  listPurchases: () => Promise<PlayPurchase[]>;
  /** Digital Goods v1 only (v2 auto-acknowledges Payment Request purchases). */
  acknowledge?: (purchaseToken: string, purchaseType?: string) => Promise<void>;
};

type GetDigitalGoodsService = (paymentMethod: string) => Promise<DigitalGoodsServiceLike>;

declare global {
  interface Window {
    getDigitalGoodsService?: GetDigitalGoodsService;
  }
}

const TWA_SESSION_KEY = "pm.twaSession";

export function canUsePlayBillingApi(): boolean {
  return typeof window !== "undefined" && typeof window.getDigitalGoodsService === "function";
}

/**
 * True inside the Play TWA. `document.referrer` is only `android-app://…` on the
 * launch navigation, so remember it for the tab session (survives reloads).
 */
export function isTwaSession(): boolean {
  if (typeof window === "undefined") return false;
  if (isAndroidTwaReferrer()) {
    try {
      sessionStorage.setItem(TWA_SESSION_KEY, "1");
    } catch {
      /* private mode */
    }
    return true;
  }
  try {
    return sessionStorage.getItem(TWA_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Prefer Play Billing on Play/TWA installs; Stripe stays for pure browser. */
export function shouldPreferPlayBilling(): boolean {
  return canUsePlayBillingApi() || isTwaSession();
}

/* ——— tiny diagnostics log (read by the hidden billing debug readout) ——— */

export type BillingDiag = Record<string, string>;
let diag: BillingDiag = {};
const diagListeners = new Set<() => void>();

export function setDiag(key: string, value: string) {
  if (diag[key] === value) return;
  diag = { ...diag, [key]: value };
  for (const fn of diagListeners) fn();
}

/** Stable snapshot (new object only on change) for useSyncExternalStore. */
export function getDiagSnapshot(): BillingDiag {
  return diag;
}

export function subscribeDiag(fn: () => void): () => void {
  diagListeners.add(fn);
  return () => {
    diagListeners.delete(fn);
  };
}

function errText(err: unknown) {
  const { name, message } = describeError(err);
  return `${name}: ${message}`.slice(0, 300);
}

function envDiag() {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent;
  const chrome = /Chrome\/([\d.]+)/.exec(ua)?.[1] ?? "?";
  let standalone = "?";
  try {
    standalone = String(window.matchMedia("(display-mode: standalone)").matches);
  } catch {
    /* ignore */
  }
  setDiag("chrome", chrome);
  setDiag("referrer", document.referrer || "(none)");
  setDiag("twa session", String(isTwaSession()));
  setDiag("display standalone", standalone);
  setDiag("getDigitalGoodsService", String(canUsePlayBillingApi()));
  setDiag("PaymentRequest", String(typeof PaymentRequest !== "undefined"));
}

export async function getPlayBillingService(): Promise<DigitalGoodsServiceLike | null> {
  if (!canUsePlayBillingApi()) return null;
  try {
    const service = await window.getDigitalGoodsService!(PLAY_BILLING_METHOD);
    setDiag("service", service ? "ok" : "null");
    return service ?? null;
  } catch (err) {
    setDiag("service", errText(err));
    return null;
  }
}

export type PlayProbe = {
  status: PlayProbeStatus;
  service: DigitalGoodsServiceLike | null;
  item: PlayItemDetails | null;
  owned: boolean;
};

/** Service + getDetails(['big_scraps']) + listPurchases, with every step logged. */
export async function probePlayBilling(): Promise<PlayProbe> {
  envDiag();
  if (!canUsePlayBillingApi()) {
    setDiag("service", "n/a (no Digital Goods API)");
    return { status: "no-api", service: null, item: null, owned: false };
  }
  const service = await getPlayBillingService();
  if (!service) return { status: "service-error", service: null, item: null, owned: false };

  let owned = false;
  try {
    const purchases = await service.listPurchases();
    owned = purchases.some((p) => p.itemId === PLAY_SKU_BIG_SCRAPS);
    setDiag(
      "listPurchases",
      purchases.length ? purchases.map((p) => p.itemId).join(", ") : "[] (none)",
    );
  } catch (err) {
    setDiag("listPurchases", errText(err));
  }

  if (typeof service.getDetails !== "function") {
    setDiag("getDetails", "n/a (method missing)");
    return { status: "ready", service, item: null, owned };
  }
  try {
    const details = await service.getDetails([PLAY_SKU_BIG_SCRAPS]);
    const item = pickItem(details, PLAY_SKU_BIG_SCRAPS);
    setDiag("getDetails", JSON.stringify(details ?? null).slice(0, 400));
    if (!item) return { status: "no-product", service, item: null, owned };
    return { status: "ready", service, item, owned };
  } catch (err) {
    setDiag("getDetails", errText(err));
    return { status: "details-error", service, item: null, owned };
  }
}

/**
 * Launch Play purchase UI for big_scraps. Returns purchaseToken on success.
 * Call synchronously from the tap handler (no awaits before) so show() keeps
 * user activation. Throws the raw PaymentRequest error — classify it upstream.
 */
export async function purchaseBigScraps(
  service: DigitalGoodsServiceLike,
): Promise<string | null> {
  if (typeof PaymentRequest === "undefined") {
    const err = new Error("PaymentRequest unavailable");
    err.name = "NotSupportedError";
    setDiag("purchase", errText(err));
    throw err;
  }

  setDiag("purchase", "show() …");
  let response: PaymentResponse;
  try {
    const request = new PaymentRequest(
      [
        {
          supportedMethods: PLAY_BILLING_METHOD,
          data: { sku: PLAY_SKU_BIG_SCRAPS },
        },
      ],
      {
        // Play ignores this total and shows the real Play Console price.
        total: {
          label: "Total",
          amount: { currency: "USD", value: "0" },
        },
      },
    );
    response = await request.show();
  } catch (err) {
    setDiag("purchase", errText(err));
    throw err;
  }

  const details = (response.details ?? {}) as { purchaseToken?: string };
  const purchaseToken =
    typeof details.purchaseToken === "string" ? details.purchaseToken : undefined;
  setDiag("purchase", purchaseToken ? "success (token received)" : "success (no token)");

  try {
    await response.complete("success");
  } catch {
    /* already completed / dismissed */
  }

  // Non-consumable: never consume(). v1 acknowledge is best-effort; v2 auto-acks.
  if (purchaseToken && typeof service.acknowledge === "function") {
    try {
      await service.acknowledge(purchaseToken, "onetime");
    } catch {
      /* license-tester MVP: unlock still applies; harden with Publisher API later */
    }
  }

  return purchaseToken ?? null;
}

export async function restoreBigScraps(service: DigitalGoodsServiceLike): Promise<boolean> {
  try {
    const purchases = await service.listPurchases();
    return purchases.some((p) => p.itemId === PLAY_SKU_BIG_SCRAPS);
  } catch {
    return false;
  }
}
