#!/usr/bin/env bash
set -euo pipefail

if curl --silent --fail --max-time 1 --output /dev/null "http://localhost:$PORT"; then
    echo "✓ site http://localhost:$PORT"
else
    echo "✗ site (:$PORT)"
fi
