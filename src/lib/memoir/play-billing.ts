/**
 * Play Billing via Digital Goods + Payment Request (TWA / Bubblewrap playBilling).
 * Product id matches Play Console one-time IAP. Same unlock bit as Stripe success.
 */

import { isAndroidTwaReferrer } from "@/lib/memoir/installed-display";

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
  acknowledge?: (purchaseToken: string, purchaseType?: string) => Promise<void>;
};

type GetDigitalGoodsService = (paymentMethod: string) => Promise<DigitalGoodsServiceLike>;

declare global {
  interface Window {
    getDigitalGoodsService?: GetDigitalGoodsService;
  }
}

export function canUsePlayBillingApi(): boolean {
  return typeof window !== "undefined" && typeof window.getDigitalGoodsService === "function";
}

/** Prefer Play Billing on Play/TWA installs; Stripe stays for pure browser. */
export function shouldPreferPlayBilling(): boolean {
  return canUsePlayBillingApi() || isAndroidTwaReferrer();
}

export async function getPlayBillingService(): Promise<DigitalGoodsServiceLike | null> {
  if (!canUsePlayBillingApi()) return null;
  try {
    return await window.getDigitalGoodsService!(PLAY_BILLING_METHOD);
  } catch {
    return null;
  }
}

/**
 * Launch Play purchase UI for big_scraps. Returns purchaseToken on success.
 * Caller should setUnlocked(true). Acknowledge best-effort for license-tester MVP.
 */
export async function purchaseBigScraps(
  service: DigitalGoodsServiceLike,
): Promise<string | null> {
  if (typeof PaymentRequest === "undefined") {
    throw new Error("PaymentRequest unavailable");
  }

  const request = new PaymentRequest(
    [
      {
        supportedMethods: PLAY_BILLING_METHOD,
        data: { sku: PLAY_SKU_BIG_SCRAPS },
      },
    ],
    {
      total: {
        label: "Total",
        amount: { currency: "USD", value: "0" },
      },
    },
  );

  const canPay = await request.canMakePayment().catch(() => false);
  if (!canPay) {
    throw new Error("Play Billing not ready on this device");
  }

  const response = await request.show();
  const details = (response.details ?? {}) as { purchaseToken?: string };
  const purchaseToken =
    typeof details.purchaseToken === "string" ? details.purchaseToken : undefined;

  try {
    await response.complete("success");
  } catch {
    /* already completed / dismissed */
  }

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
