# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static one-page site that answers "Is it &lt;X&gt; day today?" with a giant YES. The page itself lives in `public/index.html` — one HTML file with inline CSS and JS, no framework. `public/emojis.js` is a lazy-loaded emoji picker dataset. `functions/` holds two small Cloudflare Pages Functions that handle social-card unfurls — see *Unfurl pipeline* below.

## Commands (via `just`)

- `just start` — serve `public/` locally on `:8788` via Caddy (SPA fallback to `index.html`). Doesn't run the Pages Functions; use `wrangler pages dev public --compatibility-date=2026-05-14` for that.
- `just deps` — `deno install --node-modules-dir=auto` to populate `node_modules/` for the Pages Functions (Deno is the local package manager; the function still runs on Cloudflare Workers).
- `just release` — runs `deps` then deploys to Cloudflare Pages (`isthatdaytoday`) via `wrangler`.
- `just tf <args>` — run `tofu -chdir=infra`
- `just tf-plan` / `just tf-apply` — OpenTofu plan/apply for the Cloudflare Pages + DNS setup
- `just tf-import` — re-import the Pages project + custom domains into state

No test suite, no linter, no traditional build step — `wrangler` bundles the functions itself from `node_modules`.

## Routing model

The app is a single page that branches on `location.pathname`:

- **Root (`/`)** — renders the configurator form with preset chips. Submitting the form navigates to `/<day>?...params`.
- **Any other path (`/<day>`)** — treats the path segment as the day name (with `-`/`_`/`+` converted to spaces) and renders the answer view. `_redirects` (Cloudflare Pages) and Caddy's `try_files` both fall back to `index.html` so any URL serves the SPA.

Query params on the answer view: `answer` (default `YES`), `emoji`, `color` (accent / answer color), `qcolor` (question / foreground), `bg` (background). The form only emits params that differ from the CSS defaults, keeping shared URLs short.

CSS custom properties `--accent`, `--fg`, `--bg` are the single source of truth for theming; the JS overrides them inline when params are present, and reads their defaults from `getComputedStyle` to round-trip presets.

## Unfurl pipeline

Two Pages Functions in `functions/` make shared links look right on iMessage/Slack/WhatsApp/etc., where the unfurl is parsed from server-side HTML:

- `_middleware.js` — runs on every HTML response. For a request like `/pizza?emoji=🍕&color=…`, it rewrites `<title>`, `og:*`, and `twitter:*` meta tags so each day has its own preview. It also forwards the same query params into `og:image` / `twitter:image` (pointing at `/og.png?...`) so the rendered image matches the page.
- `og.png.js` — renders a 1200×630 PNG per request via [`workers-og`](https://github.com/kvnang/workers-og) (satori + resvg-wasm under the hood). Reads `day`, `answer`, `emoji`, `color`, `qcolor`, `bg` from the query string; falls back to the generic "Is it ___ day today? YES" image when called with no params (root unfurl). Uses Inter from Google Fonts (cached at module scope) and Twemoji for color emoji.

The local toolchain is Deno (`deno install`) but the functions run on Cloudflare Workers at the edge — no Node at runtime. `node_modules/` is gitignored; `deno.lock` is committed for reproducibility.

## Infrastructure

`infra/` is OpenTofu managing the Cloudflare Pages project + apex/www DNS records and domain bindings. State lives in an R2 bucket (`isthatdaytoday-tfstate`) via the S3-compatible backend; the bucket itself is bootstrapped separately in `infra/bootstrap/`. Required env vars (see `.env.example`): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (R2 credentials for the state backend).

Analytics: Umami (loaded from `cloud.umami.is`). Ads: Google AdSense script in `<head>`.
