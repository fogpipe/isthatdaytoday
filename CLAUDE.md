# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static one-page site that answers "Is it &lt;X&gt; day today?" with a giant YES. The page itself lives in `public/index.html` — one HTML file with inline CSS and JS, no framework. `public/emojis.js` is a lazy-loaded emoji picker dataset. `functions/` holds two Cloudflare Pages Functions: `_middleware.js` pre-renders per-day HTML at the edge, `og.png.js` generates social-card images. See *Edge rendering* below.

## Commands (via `just`)

- `just start` — serve `public/` locally via Caddy. Port comes from `$PORT` (set to `8788` in `.env.local`, loaded by direnv). Doesn't run the Pages Functions; use `wrangler pages dev public --compatibility-date=2026-05-14` for that.
- `just status` — `scripts/status.sh` curls `localhost:$PORT` to confirm the dev server is up.
- `just deps` — `deno install --node-modules-dir=auto` to populate `node_modules/` for the Pages Functions (Deno is the local package manager; the functions still run on Cloudflare Workers).
- `just release` — runs `deps` then deploys to Cloudflare Pages (`isthatdaytoday`) via `wrangler`.
- `just tf <args>` — run `tofu -chdir=infra`
- `just tf-init` / `just tf-plan` / `just tf-apply` — OpenTofu init/plan/apply for the Cloudflare Pages + DNS setup
- `just tf-import` — re-import the Pages project + custom domains into state

No test suite, no linter, no traditional build step — `wrangler` bundles the functions itself from `node_modules`.

## Routing model

The app is a single page that branches on `location.pathname`:

- **Root (`/`)** — renders the configurator form with preset chips. Submitting the form navigates to `/<day>?...params`.
- **Any other path (`/<day>`)** — treats the path segment as the day name (with `-`/`_`/`+` converted to spaces) and renders the answer view. `_redirects` (Cloudflare Pages) and Caddy's `try_files` both fall back to `index.html` so any URL serves the SPA. `/privacy` and `/privacy.html` are reserved and skip the answer pipeline.

Query params on the answer view:

- `answer` (default `YES`), `emoji`, `color` (accent / answer color), `qcolor` (question / foreground), `bg` (background).
- `date` (MM-DD) + `answer2` — date-conditional answer. If today's UTC MM-DD matches `date`, render `answer`; otherwise render `answer2`. Used by `valentines`, `kanelbullens`, `syttende-mai`. Resolution happens both client-side (`index.html`) and server-side (`_middleware.js`, `og.png.js`) and must stay in sync.

The form only emits params that differ from the CSS defaults, keeping shared URLs short. CSS custom properties `--accent`, `--fg`, `--bg` are the single source of truth for theming; the JS overrides them inline when params are present, and reads their defaults from `getComputedStyle` to round-trip presets. The browser-tab favicon is also regenerated client-side as an inline SVG data URL whenever emoji/colors change.

## Edge rendering

`functions/_middleware.js` runs on every HTML response. For any non-root path it:

- Pre-renders the page server-side: sets `<title>`, fills `h1#q` with the question, `p#a` with the resolved answer, `div#e` with the emoji, exposes the edit link `a#ql` (back to `/?day=…&…`), and adds `body.view-answer` — so the answer is visible without JS and crawlers see real content.
- Rewrites `<link rel="canonical">` to the bare slug `/<day>` (dropping query params), and updates `og:*` / `twitter:*` meta tags. `og:image` / `twitter:image` point at `/og.png?...` with the same params forwarded.
- Injects a `QAPage` JSON-LD block for rich-result indexing.
- Adds `<meta name="robots" content="noindex">` for any day not in the hardcoded `PRESETS` list at the top of the file, so only curated days get indexed.
- Appends an "Other days" nav (up to 8 sibling presets) before the footer for cross-linking.

`functions/og.png.js` renders a 1200×630 PNG per request via [`workers-og`](https://github.com/kvnang/workers-og) (satori + resvg-wasm under the hood). Reads `day`, `answer`, `answer2`, `date`, `emoji`, `color`, `qcolor`, `bg` from the query string; resolves date-conditional answers the same way the middleware does; falls back to a generic "Is it ___ day today? YES" image when called with no params (root unfurl). Uses Fraunces (500 + 900) and JetBrains Mono (500) from Google Fonts (cached at module scope) and Twemoji for color emoji. Cache-control is `max-age=31536000, immutable` for normal images and `max-age=3600` for date-conditional ones (which need to flip on the date).

The local toolchain is Deno (`deno install`) but the functions run on Cloudflare Workers at the edge — no Node at runtime. `node_modules/` is gitignored; `deno.lock` is committed for reproducibility.

## Presets — three places to update

The list of curated days is duplicated and must stay in sync:

1. `public/index.html` — the `presets` array drives the configurator's preset chips.
2. `functions/_middleware.js` — the `PRESETS` constant drives `noindex` gating and the "Other days" nav.
3. `public/sitemap.xml` — lists each preset's canonical `/<slug>` URL for crawlers.

When adding a preset, touch all three.

## Infrastructure

`infra/` is OpenTofu managing the Cloudflare Pages project + apex/www DNS records and domain bindings. State lives in an R2 bucket (`isthatdaytoday-tfstate`) via the S3-compatible backend; the bucket itself is bootstrapped separately in `infra/bootstrap/`. Required env vars (see `.env.example`): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (R2 credentials for the state backend).

Analytics: Umami (loaded from `cloud.umami.is`). Ads: Google AdSense script in `<head>`.
