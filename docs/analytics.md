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

| Signal                     | How                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Page views / SPA routes    | Automatic `page_view` on TanStack Router path changes (`/kept/:id` redacts scrap ids). Params unchanged: `{ page_path }` only.  |
| `unlock_success`           | When `?unlock=success` / `?unlocked=1` is handled (big scraps unlock landing)                                                   |
| `tour_complete`            | First-visit tour finished with “Start scrapping”                                                                                |
| `tour_skip`                | Tour Skip or Escape                                                                                                             |
| `a2hs_dismiss`             | “Not now” on the add-to-home-screen tip                                                                                         |
| User property `app_source` | Every document load: `play_twa` inside the Play app, `web` on the site (including Add to Home Screen)                           |
| `play_app_first_open`      | First Play/TWA open on this device. Param `app_source` = `play_twa`. Once, via localStorage `pocketmemoir.twa.playAppFirstOpen` |
| `play_app_open`            | Every Play/TWA document load (not on in-app route changes). Param `app_source` = `play_twa`                                     |

No scrap text, emails, or other PII in event params.

Play vs website uses the existing TWA check (`document.referrer` starts with
`android-app://`, remembered for the tab in `sessionStorage`). A home-screen
icon without that referrer stays `web`.

## Spot a new Play install (Realtime)

After this is deployed to pocketmemoir.fun:

1. Open [Google Analytics](https://analytics.google.com/) → the Pocket Memoir property
2. **Reports → Realtime**
3. On a phone, open the **Play app** (package `fun.pocketmemoir.app`), not the
   site in Chrome. Within about a minute, **Event count by Event name** should
   show `play_app_first_open` (first time on that device) and `play_app_open`
   (every launch). Click the event name to see parameter `app_source` =
   `play_twa`.
4. Open the site in a normal browser. Those two events should not appear.
   `app_source` = `web` is a user property on the hits, not its own event.

The first Play open **after this ships** also counts as `play_app_first_open`
for people who already had the app — the flag did not exist yet. Later opens
on that device only send `play_app_open`. Clearing site data (Chrome and the
Play app share storage for pocketmemoir.fun) lets the one-shot fire again.

### Mark `play_app_first_open` as a key event

Realtime shows the event immediately. The Admin events list can lag.

1. **Admin** (gear) → **Data display → Events** (older UI: **Configure → Events**,
   or **Conversions** — now called **Key events**)
2. When `play_app_first_open` is listed, toggle **Mark as key event**
3. If it is not listed yet: **Admin → Key events → New key event**, name
   exactly `play_app_first_open`

### Register `app_source` as a custom dimension

Needed for standard reports and explorations. Realtime does not require it.

1. **Admin → Data display → Custom definitions → Create custom dimension**
2. **User** scope — Dimension name `App source`, User property `app_source`.
   This labels hits after the property is set. If the same Chrome profile later
   opens the website, the latest value becomes `web` (TWA and Chrome share the
   `_ga` cookie). `play_app_first_open` and `play_app_open` keep `app_source`
   on the event itself.
3. **Event** scope — Dimension name `App source (event)`, Event parameter
   `app_source`. This is the param on `play_app_first_open` and `play_app_open`.

Custom dimensions only fill in for hits collected after they are created.

## See users in GA4

After deploy with a real ID:

1. **Reports → Realtime** — open pocketmemoir.fun in a private window; you
   should appear within ~30s
2. **Reports → Engagement → Events** — `page_view`, `unlock_success`, etc.
   (custom events may take up to ~24h to mark as conversions if you mark them)

## Code map

- `src/lib/memoir/analytics.ts` — ID read, gtag load, `trackEvent` / `trackPageView`
- `src/lib/memoir/play-app-analytics.ts` — `app_source`, Play first open + launch
- `src/components/analytics-listener.tsx` — SPA page views and Play/web source
- Hooks in `app-shell` (unlock), `tour-overlay`, `a2hs-tip` (unchanged events)

## TODO for Stefanie

- [ ] Create GA4 web stream for **pocketmemoir.fun**
- [ ] Add repo secret **`VITE_GA_MEASUREMENT_ID`** = `G-…`
- [ ] Confirm Realtime after next Pages deploy
