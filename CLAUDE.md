# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static one-page site that answers "Is it &lt;X&gt; day today?" with a giant YES. Everything lives in `public/index.html` — one HTML file with inline CSS and JS, no build step, no framework, no dependencies. `public/emojis.js` is a lazy-loaded emoji picker dataset.

## Commands (via `just`)

- `just start` — serve `public/` locally on `:8788` via Caddy (SPA fallback to `index.html`)
- `just release` — deploy `public/` to Cloudflare Pages (`isthatdaytoday` project) via `wrangler`
- `just tf <args>` — run `tofu -chdir=infra`
- `just tf-plan` / `just tf-apply` — OpenTofu plan/apply for the Cloudflare Pages + DNS setup
- `just tf-import` — re-import the Pages project + custom domains into state

There is no test suite, no linter, and no build step. Edit HTML/JS, refresh the browser.

## Routing model

The app is a single page that branches on `location.pathname`:

- **Root (`/`)** — renders the configurator form with preset chips. Submitting the form navigates to `/<day>?...params`.
- **Any other path (`/<day>`)** — treats the path segment as the day name (with `-`/`_`/`+` converted to spaces) and renders the answer view. `_redirects` (Cloudflare Pages) and Caddy's `try_files` both fall back to `index.html` so any URL serves the SPA.

Query params on the answer view: `answer` (default `YES`), `emoji`, `color` (accent / answer color), `qcolor` (question / foreground), `bg` (background). The form only emits params that differ from the CSS defaults, keeping shared URLs short.

CSS custom properties `--accent`, `--fg`, `--bg` are the single source of truth for theming; the JS overrides them inline when params are present, and reads their defaults from `getComputedStyle` to round-trip presets.

## Infrastructure

`infra/` is OpenTofu managing the Cloudflare Pages project + apex/www DNS records and domain bindings. State lives in an R2 bucket (`isthatdaytoday-tfstate`) via the S3-compatible backend; the bucket itself is bootstrapped separately in `infra/bootstrap/`. Required env vars (see `.env.example`): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (R2 credentials for the state backend).

Analytics: Umami (loaded from `cloud.umami.is`). Ads: Google AdSense script in `<head>`.
