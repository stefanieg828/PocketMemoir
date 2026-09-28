# Analytics — site opens vs unlocks (GA4)

Soft Google Analytics 4 for Pocket Memoir. **Off unless** a Measurement ID is
set at build time. No hardcoded fake ID — analytics stays dark until Stefanie
creates a GA4 property and wires the ID into the Pages deploy.

Stripe still owns paid + promo counts (Payment Link / Dashboard). GA4 is for
**site opens** (page views) and light engagement events like unlock landings
and tour / install tips — not a payment source of truth.

## Env / secret name

Use this name everywhere (local `.env`, GitHub Actions):

```text
VITE_GA_MEASUREMENT_ID
```

Value shape: `G-XXXXXXXXXX` (GA4 Measurement ID). Leave unset or empty →
gtag never loads.

### Local

Copy `.env.example` → `.env` (gitignored) and add:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### GitHub Pages (live pocketmemoir.fun)

1. Repo → **Settings → Secrets and variables → Actions**
2. New repository secret named **`VITE_GA_MEASUREMENT_ID`** with your `G-…` value
3. Push to `feature/visual-polish` or `main` (or run **Deploy GitHub Pages**
   workflow manually). The build job passes:

   ```yaml
   VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
   ```

4. Until the secret exists, the expression resolves empty and analytics stays
   off — safe to merge before creating the property.

## Create a GA4 property (Stefanie)

1. Open [Google Analytics](https://analytics.google.com/) → **Admin** (gear)
2. **Create property** — name e.g. `Pocket Memoir`, timezone America/Chicago,
   currency USD
3. Create a **Web** data stream — URL `https://pocketmemoir.fun`
4. Copy the **Measurement ID** (`G-XXXXXXXXXX`)
5. Paste it into the GitHub secret above and redeploy
6. Optional: Admin → Data streams → your stream → **Configure tag settings** /
   consent defaults later if you want a cookie banner; today’s load is
   soft (script only when ID is present) with `anonymize_ip`

## What we send (privacy-light)

| Signal | How |
|--------|-----|
| Page views / SPA routes | Automatic `page_view` on TanStack Router path changes (`/kept/:id` redacts scrap ids) |
| `unlock_success` | When `?unlock=success` / `?unlocked=1` is handled (big scraps unlock landing) |
| `tour_complete` | First-visit tour finished with “Start scrapping” |
| `tour_skip` | Tour Skip or Escape |
| `a2hs_dismiss` | “Not now” on the add-to-home-screen tip |

No scrap text, emails, or other PII in event params.

## See users in GA4

After deploy with a real ID:

1. **Reports → Realtime** — open pocketmemoir.fun in a private window; you
   should appear within ~30s
2. **Reports → Engagement → Events** — `page_view`, `unlock_success`, etc.
   (custom events may take up to ~24h to mark as conversions if you mark them)

## Code map

- `src/lib/memoir/analytics.ts` — ID read, gtag load, `trackEvent` / `trackPageView`
- `src/components/analytics-listener.tsx` — SPA page views
- Hooks in `app-shell` (unlock), `tour-overlay`, `a2hs-tip`

## TODO for Stefanie

- [ ] Create GA4 web stream for **pocketmemoir.fun**
- [ ] Add repo secret **`VITE_GA_MEASUREMENT_ID`** = `G-…`
- [ ] Confirm Realtime after next Pages deploy
