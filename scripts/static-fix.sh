#!/usr/bin/env bash
set -euo pipefail

deno fmt
deno lint --fix
deno check data/presets.ts functions/_middleware.ts functions/og.png.ts scripts/build.ts
