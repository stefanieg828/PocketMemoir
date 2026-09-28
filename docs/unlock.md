# Unlock — little scraps / big scraps (99¢ one-time)

One soft gate for Pocket Memoir. No App Store / Play Billing in this pass —
Play Billing stays separate for Android later.

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
