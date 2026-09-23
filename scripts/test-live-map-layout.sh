#!/usr/bin/env bash
set -euo pipefail

test_output="$(mktemp -d)"
trap 'rm -rf "$test_output"' EXIT

./node_modules/.bin/tsc \
  --pretty false \
  --skipLibCheck \
  --esModuleInterop \
  --module commonjs \
  --moduleResolution node \
  --target ES2020 \
  --outDir "$test_output" \
  lib/live-map-layout.ts \
  tests/live-map-layout.test.ts

node --test "$test_output/tests/live-map-layout.test.js"
