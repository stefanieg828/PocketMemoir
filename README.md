# PocketMemoir

A cartoon scrapbook for the random stuff life drops on you.

Private scrapbook / corkboard for notes, people, tickets, lists, wins — not a social network and not a journaling app with prompts. Cute container, real life inside it (user photos sit in drawn frames).

**Domain:** [PocketMemoir.fun](https://PocketMemoir.fun) (Hostinger DNS → prefer GitHub Pages when UI is ready; not Vercel).

## Phone preview (Add to Home Screen)

Live app shell (scraps stay in your browser’s localStorage):

**https://stefanieg828.github.io/pocketmemoir-preview/**

- **iPhone (Safari):** open the link → Share → **Add to Home Screen**
- **Android (Chrome):** open the link → menu ⋮ → **Install app** / **Add to Home screen**

Pushes to `main` or `feature/visual-polish` on the private `PocketMemoir` repo rebuild and publish that URL (GitHub Actions → public mirror `pocketmemoir-preview`, dist only — source stays private).

## Looks

| Look | Default | Metaphor | Primary CTA |
|------|---------|----------|-------------|
| **Scrapbook** | yes | Cream album, maroon spine, washi, wax seal | **Stick it in** |
| **Corkboard** | flip | Cork dots, index cards, colored pins | **Pin it** |

Nav: **Shelf · Calendar · Look** only.

## Stack

TanStack Start / Vite / React / TypeScript (Grok Build workspace, cleaned for GitHub).

## Local

```bash
npm install
npm run dev
```

Pages-style static build (base `/pocketmemoir-preview/`):

```bash
npm run build:pages
```

## Notes

- Product direction and locked decisions: `docs/HANDOFF.md`
- Large Grok screenshots / generated artifacts were left out of this first push to keep the repo lean.
- Private repo cannot use GitHub Pages on Free plan; preview is the public static mirror above.
