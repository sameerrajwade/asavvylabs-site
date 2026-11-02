# Chore League website

The public site for **Chore League**, the family chore game by SavvyLabs:
**https://choreleague.savvylabs.dev** (GitHub Pages, deployed by GitHub Actions).
The app's source lives in a separate repository.

## How it works

```
site.config.json     name, URL, store links, support email, launched flag
data/faq.json        FAQ text — rendered on the page AND as FAQPage JSON-LD
src/partials/        head (SEO, CSP), header (nav), footer — shared by every page
src/pages/*.html     page bodies; line 1 is <!--meta {"title", "description", "path", "nav"} -->
assets/              css, js (theme only), self-hosted Nunito, images
scripts/build.mjs    builds _site/ and runs the checks (no npm install needed)
```

```bash
node scripts/build.mjs                         # build into _site/ + checks
npx -y http-server _site -p 8080               # preview locally (optional)
```

Pushing to `main` builds, checks and deploys. Pull requests build and check
only. **The build fails** on: a broken internal link or image, an unfilled
`{{token}}`, a page without title/description, an inline `style=""` (blocked by
the Content Security Policy), or a personal family name.

## Content slots (to fill before launch)

| Slot | How |
|---|---|
| Phone screenshots | Add `assets/img/screens/{today,scores,approvals,setup,kidmode,winner}.png` (1080×2340, from the phone, **generic names only**). The build swaps the placeholder for the image automatically. |
| Demo video | Add `assets/video/demo.mp4` (H.264, ≤ 8 MB, 30–45 s) and `assets/img/screens/demo-poster.jpg`. |
| Testimonials | `<!-- TESTIMONIAL SLOT -->` in `src/pages/index.html` (real quotes, with permission). |
| Store links | When live: set `"launched": true` in `site.config.json`. Every "Join the early test" button becomes "Get it on Google Play". |
| Legal review | `privacy.html` / `terms.html` carry a "Template" note; remove it after review and set `legalUpdated`. |
| Support email | `supportEmail` / `securityEmail` in `site.config.json` (move to an `@savvylabs.dev` address). |

## Going live on choreleague.savvylabs.dev

1. In the DNS for **savvylabs.dev** add: `CNAME  choreleague  →  sameerrajwade.github.io`
2. Repo → Settings → Pages: custom domain `choreleague.savvylabs.dev` (already set by the
   build's `CNAME` file), wait for the certificate, then tick **Enforce HTTPS**.
3. Put `https://choreleague.savvylabs.dev/privacy.html` in Play Console (privacy policy) and
   `https://choreleague.savvylabs.dev/support.html#delete` (account deletion URL).

## Standards this site keeps

- No third-party requests: fonts, images and scripts are self-hosted; strict CSP.
- Accessible: skip link, landmarks, `aria-current` nav, visible focus, reduced-motion, AA contrast in light and dark.
- Fast: one CSS file, ~1 KB of JS, lazy images with fixed dimensions (no layout shift), video `preload="none"`.
- SEO: canonical URLs, Open Graph/Twitter cards, `MobileApplication` + `FAQPage` JSON-LD, generated sitemap with `lastmod`, robots.txt.
- Trust: `/.well-known/security.txt`, security page, account-deletion page (Google Play requirement), 404 page.

3D icons: Microsoft Fluent Emoji (MIT), see `assets/img/icons/LICENSE-fluent-emoji.txt`.
