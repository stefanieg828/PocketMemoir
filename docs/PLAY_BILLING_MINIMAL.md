# Play Billing readiness — big scraps (one-time) via TWA

## Survey (current project)

| Area | Status |
| --- | --- |
| TWA shell | Bubblewrap `@bubblewrap/cli` 1.25 · package `fun.pocketmemoir.app` |
| `twa-manifest.json` → `features` | `{}` — **Play Billing not enabled** |
| `alphaDependencies` | `enabled: false` (must be `true` for Bubblewrap playBilling) |
| `enableNotifications` | `true` (required by Bubblewrap when playBilling is on) |
| Android deps | Only `androidbrowserhelper:2.6.2` — **no** `androidbrowserhelper:billing` |
| `DelegationService` | Empty `onCreate` — no `DigitalGoodsRequestHandler` |
| Manifest PaymentActivity / IS_READY_TO_PAY | **Absent** |
| Web unlock | Stripe Payment Link → `?unlock=success` → `setUnlocked(true)` (local) |
| Web Digital Goods / Payment Request | **Not implemented** |
| Play Console IAP product | **Not created** (blocked on Console) |

**Yellow URL bar** is an assetlinks / Play signing SHA issue, not billing. Fix SHA first.

**Policy:** On Play-distributed builds, digital unlock must use **Play Billing**, not Stripe.
Keep Stripe for pure web / non-Play installs.

---

## Recommended path (smallest viable): Bubblewrap + Digital Goods

Same unlock flag as Stripe: call existing `setUnlocked(true)` after a successful Play purchase
(and on restore via `listPurchases()`).

### A. Android wrapper (one Bubblewrap feature)

In `/workspace/PocketMemoir-android/twa-manifest.json`:

```json
"enableNotifications": true,
"features": {
  "playBilling": { "enabled": true }
},
"alphaDependencies": { "enabled": true }
```

Then (on a machine that can reach Google Maven — this box often cannot):

```bash
source /workspace/PocketMemoir-secrets/java.env
source /workspace/PocketMemoir-secrets/keystore.env
export BUBBLEWRAP_KEYSTORE_PASSWORD BUBBLEWRAP_KEY_PASSWORD
cd /workspace/PocketMemoir-android
bubblewrap update --skipVersionUpgrade
# re-apply Gradle mirrors if update wiped them (see PLAY_NEXT_STEPS.md)
bubblewrap build
# bump appVersionCode before uploading a new AAB
```

Bubblewrap injects:

- dep `com.google.androidbrowserhelper:billing:1.2.0`
- `PaymentActivity` + `PaymentService` (Play as payment method)
- `DigitalGoodsRequestHandler` on `DelegationService`

Upload the new AAB to an **internal testing** track (not production unless ready).

### B. Play Console (blocked until you click)

1. **Monetize** → **Products** → **In-app products** → Create product  
   - Product ID (suggested): `big_scraps`  
   - Name: unlock big scraps · Status: Active  
   - One-time / managed product · Price **$0.99**
2. **Setup** → **License testing** → add Gmail accounts as license testers  
   (test purchases without real charges).
3. App must be on **internal / closed / open** testing with a billing-enabled AAB.
4. Merchant / payments profile linked (Play requirement).

### C. Web (PocketMemoir-cats) — minimal code sketch

Detect TWA + Digital Goods; otherwise keep Stripe.

```ts
// src/lib/memoir/play-billing.ts (new) — outline only
const PLAY_BILLING = "https://play.google.com/billing";
export const PLAY_SKU_BIG_SCRAPS = "big_scraps";

export async function getPlayBillingService() {
  if (!("getDigitalGoodsService" in window)) return null;
  try {
    return await window.getDigitalGoodsService(PLAY_BILLING);
  } catch {
    return null;
  }
}

export async function purchaseBigScraps(service: DigitalGoodsService) {
  const request = new PaymentRequest(
    [{ supportedMethods: PLAY_BILLING, data: { sku: PLAY_SKU_BIG_SCRAPS } }],
    { total: { label: "Total", amount: { currency: "USD", value: "0" } } },
  );
  const response = await request.show();
  const purchaseToken = response.details?.purchaseToken as string | undefined;
  // MVP: acknowledge client-side is weaker; prefer Play Developer API on a tiny
  // backend later. For license-tester MVP, listPurchases + setUnlocked is enough
  // to prove the gate; do not ship production without acknowledge.
  await response.complete("success");
  return purchaseToken;
}

export async function restoreBigScraps(service: DigitalGoodsService) {
  const purchases = await service.listPurchases();
  return purchases.some((p) => p.itemId === PLAY_SKU_BIG_SCRAPS);
}
```

`UnlockSheet` primary CTA:

1. If `getPlayBillingService()` → run Play purchase → on success `setUnlocked(true)`.
2. Else → existing Stripe `window.open(STRIPE_PAYMENT_LINK)`.

On app hydrate (next to Stripe `?unlock=success` handler): if Play service exists and
`restoreBigScraps` → `setUnlocked(true)`.

That reuses the **same** memoir `unlocked` bit backups already carry.

### D. Acknowledge (production hardening — not blocking license-tester smoke)

Play refunds unacknowledged purchases after ~3 days. Smallest production path:

- Tiny server route (or Cloud Function) calling Android Publisher API
  `purchases.products.acknowledge` with the purchase token, **or**
- Temporary: use Digital Goods `consume` only if you intentionally make it
  re-buyable — **don’t** for a durable unlock; acknowledge instead.

For **tonight / license testers**, client `setUnlocked` + `listPurchases` restore is
enough to validate UX; ship acknowledge before public production.

---

## What not to do

- Do **not** open Stripe from the Play TWA for the digital unlock (policy).
- Do **not** require Capacitor for v1 — Bubblewrap playBilling is the smaller change.
- Do **not** bump production track until assetlinks has Play signing SHA **and**
  billing AAB is tested on internal track.


---

## Applied on box (2026-09-28 CT)

- `features.playBilling` + `alphaDependencies` enabled
- `minSdkVersion` raised to **23** (billing 1.2.0 requires it)
- `appVersionCode` **3** AAB at `PocketMemoir-android/app-release-bundle.aab`
- Web: `src/lib/memoir/play-billing.ts` + UnlockSheet / AppShell restore
