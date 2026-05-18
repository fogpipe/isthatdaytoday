#!/usr/bin/env bash
set -euo pipefail

deno fmt
deno lint --fix
deno check data/presets.ts data/answer.ts functions/_middleware.ts functions/og.png.ts scripts/build.ts
