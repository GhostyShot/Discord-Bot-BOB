#!/usr/bin/env bash
# Simple build script for static portfolio
# Copies source files into a dist/ directory and optionally minifies JS/CSS if tools are available.

set -euo pipefail

ROOT=$(pwd)
DIST="$ROOT/dist"

echo "Creating dist folder..."
rm -rf "$DIST"
mkdir -p "$DIST/assets/css" "$DIST/assets/js"

echo "Copying files..."
cp "$ROOT/index.html" "$DIST/index.html"
# admin panel removed, no need to copy
cp -r "$ROOT/assets/css/"* "$DIST/assets/css/"
cp -r "$ROOT/assets/js/"* "$DIST/assets/js/"

# optional minification if tools exist
if command -v uglifyjs >/dev/null 2>&1; then
  echo "Minifying JavaScript with uglifyjs..."
  for f in "$DIST/assets/js/"*.js; do
    uglifyjs "$f" -c -m -o "$f"
  done
fi

if command -v csso >/dev/null 2>&1; then
  echo "Minifying CSS with csso..."
  for f in "$DIST/assets/css/"*.css; do
    csso "$f" --output "$f"
  done
fi

echo "Build finished. Files are in $DIST"