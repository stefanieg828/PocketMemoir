# Unlock — little scraps / big scraps (99¢ one-time)

One soft gate for Pocket Memoir. Browser unlocks via Stripe; Play/TWA unlocks
via Digital Goods / Play Billing (`big_scraps`) → same `setUnlocked(true)`.

## little scraps (always free)

- soft storybook look
- scrapbook / corkboard layouts
- six starter boards (rename allowed)
- free starter stickers

## big scraps (one-time 99¢)

- comic + risograph looks
- more boards / presets / customs
- hide, reorder, vibe colors
- a little idea inbox for sticker & scrap ideas
- future sticker packs (same gate)

## How unlock turns on (today)

1. **Stripe success URL** — after payment, land on  
   `https://pocketmemoir.fun/?unlock=success`  
   (also accepts `?unlocked=1`). The app calls `setUnlocked(true)`, strips the
   query, and shows a soft “you're unlocked” toast. No webhook required yet.
2. **Backup restore** — backups already include `unlocked`. Restore a copy from
   another device under **Look → Keep them safe**.
3. **Testing only** — when `VITE_STRIPE_PAYMENT_LINK` is overridden to empty:
   - Primary CTA is disabled (“Stripe link next”).
   - In **DEV**, a small “I'm testing — preview unlock” appears.
   - Or open once with `?previewUnlock=1` (session-armed; not a public free unlock).

## Stripe Payment Link (live)

Live buy link (semi-public, like a buy button):

`https://buy.stripe.com/7sY8wR0jHgGh8FWbFF6Vq00`

Success URL (set in Stripe Dashboard — do not change from the app):

`https://pocketmemoir.fun/?unlock=success`

Build wiring:

1. **GitHub Pages** — `VITE_STRIPE_PAYMENT_LINK` is set in
   `.github/workflows/deploy-pages.yml` on the build job.
2. **App default** — `src/lib/memoir/unlock.ts` falls back to the same live URL
   when the env var is unset (so local / preview builds still open the CTA).
3. **Local override** — copy `.env.example` → `.env` (gitignored) if you need a
   different link.

   ```bash
   VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
   ```

4. Redeploy. The unlock sheet primary CTA is **unlock big scraps · 99¢** and
   opens the Payment Link.

Cancel / failure URLs can return to `https://pocketmemoir.fun/` with no query;
nothing unlocks.

## UX entry points

- Look → comic or riso (opens sheet; look stays put until unlocked)
- Look → your shelf → **unlock big scraps · 99¢**
- After unlock: looks apply normally; shelf shows the full editor; CTAs hide /
  show **big scraps ✓** on gated looks (free look shows **little scraps**)

## Analytics (opens vs unlocks)

GA4 is optional and off until `VITE_GA_MEASUREMENT_ID` is set. See
[analytics.md](./analytics.md). Stripe Dashboard remains the source of truth
for paid / promo unlocks; GA tracks the soft `unlock_success` landing plus
site opens.


## Android / Play TWA

Play installs must unlock via **Play Billing** (not Stripe).

1. **Purchase** — Unlock sheet detects Digital Goods (`getDigitalGoodsService`),
   runs Payment Request for SKU `big_scraps`, then `setUnlocked(true)`.
2. **Restore** — On hydrate, `listPurchases()`; if `big_scraps` is owned →
   `setUnlocked(true)` (same toast / GA as Stripe success).
3. **Browser** — Stripe Payment Link unchanged (gated off when TWA referrer /
   Play Billing is preferred).

Code: `src/lib/memoir/play-billing.ts`, wired in `unlock-sheet.tsx` + `app-shell.tsx`.

Native shell: Bubblewrap `features.playBilling` — see
[`PLAY_BILLING_MINIMAL.md`](./PLAY_BILLING_MINIMAL.md).
Fullscreen TWA: Play App Signing SHA in assetlinks —
[`PLAY_SIGNING_SHA256.md`](./PLAY_SIGNING_SHA256.md).

## Stripe-verified web unlock (Oct 2026)

- Payment Link success URL: `https://pocketmemoir.fun/?unlock=success&session_id={CHECKOUT_SESSION_ID}`.
- The app sends `session_id` to the verifier (`GET /verify`), which checks the Checkout
  Session with Stripe (complete + paid / no_payment_required, big scraps link or price)
  and returns an Ed25519-signed token. The app verifies it offline (`src/lib/memoir/unlock-token.ts`),
  stores `unlockToken`, and includes it in backups. Bare `?unlock=success` no longer unlocks.
- Restore purchase (web): unlock sheet → email → `POST /restore` (5/hour per IP and per email).
- Verifier: personal VPS `/opt/pm-verifier` (Docker, `127.0.0.1:3088`, compose project `pmverifier`).
  Reached at `https://api.pocketmemoir.fun` once DNS + cert exist, and at
  `https://grilledcheeseandtomatosoup.fun/pm-api` meanwhile. Signing key: `/opt/pm-verifier/keys`.
- Already-unlocked installs (old local flag) stay unlocked. Play/TWA path unchanged.

## Auto-restore (Oct 25 2026)

- After a successful verify or restore, the checkout email is saved on the device
  (`unlockEmail` in `pocketmemoir.v1` plus `pocketmemoir.restoreEmail`).
- On load, if the unlock is missing but an email is saved, the app quietly calls
  `POST /restore` once per tab session (stays under the 5/hour limit).
- `navigator.storage.persist()` is requested on load.
- "paid before? restore with your email" sits under the locked shelf and sticker
  CTAs and in the unlock sheet (hidden in the Play app, which re-checks Play itself).
- Verifier `/restore` now matches by Payment Link, price, or product, checks the email
  as typed and lowercased, and expands line items. $0 promo checkouts
  (`payment_status` paid or no_payment_required, status complete) count.
