#!/usr/bin/env bash
set -euo pipefail

BASE="https://api.patriotindex.cz"
for r in politicians parties votes laws; do
  echo "=== $r ==="
  code=$(curl -s -o /tmp/patriot_${r}.json -w "%{http_code}" "$BASE/$r" || true)
  echo "status: $code"
  head -c 400 "/tmp/patriot_${r}.json" || true
  echo
  echo
 done
