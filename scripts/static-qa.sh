#!/usr/bin/env bash
set -euo pipefail

deno fmt --check
deno lint
deno check data/presets.ts functions/_middleware.ts functions/og.png.ts scripts/build.ts
