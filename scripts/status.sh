#!/usr/bin/env bash
set -euo pipefail

port=8788

if curl --silent --fail --max-time 1 --output /dev/null "http://localhost:$port"; then
    echo "✓ site http://localhost:$port"
else
    echo "✗ site (:$port)"
fi
