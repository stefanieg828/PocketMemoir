# Unlock (99¢ one-time)

One soft gate for Pocket Memoir. No App Store / Play Billing in this pass —
Play Billing stays separate for Android later.

## Free (always)

- Soft Storybook look
- Scrapbook / corkboard layouts
- Six starter boards (rename allowed)
- Free starter stickers

## Unlock (one-time 99¢)

- Comic + Risograph looks
- More boards / presets / customs
- Hide, reorder, vibe colors
- Got an idea? email to scraps@
- Future sticker packs (same gate)

## How unlock turns on (today)

1. **Stripe success URL** — after payment, land on  
   `https://pocketmemoir.fun/?unlock=success`  
   (also accepts `?unlocked=1`). The app calls `setUnlocked(true)`, strips the
   query, and shows a soft “you're unlocked” toast. No webhook required yet.
2. **Backup restore** — backups already include `unlocked`. Restore a copy from
   another device under **Look → Keep them safe**.
3. **Testing only** — when `VITE_STRIPE_PAYMENT_LINK` is empty:
   - Primary CTA is disabled (“Stripe link next”).
   - In **DEV**, a small “I'm testing — preview unlock” appears.
   - Or open once with `?previewUnlock=1` (session-armed; not a public free unlock).

## Stripe Payment Link (Stefanie, later)

1. In Stripe Dashboard, create a **Payment Link** for **$0.99** (one-time).
2. Set the **success URL** to:  
   `https://pocketmemoir.fun/?unlock=success`
3. Copy the Payment Link URL.
4. Set it at build time:

   ```bash
   VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
   ```

   Or leave empty until ready — the sheet stays friendly and gated.

5. Redeploy. The unlock sheet primary CTA becomes **Unlock for 99¢** and opens
   the Payment Link.

Cancel / failure URLs can return to `https://pocketmemoir.fun/` with no query;
nothing unlocks.

## UX entry points

- Look → Comic or Riso (opens sheet; look stays put until unlocked)
- Look → Your shelf → **Unlock more boards · 99¢**
- After unlock: looks apply normally; shelf shows the full editor; CTAs hide /
  show **Unlocked ✓**
