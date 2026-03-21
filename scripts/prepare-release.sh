#!/usr/bin/env bash
# Prepare Jobs Hero release package and zip for Chrome Web Store.
# Run from repo root: ./scripts/prepare-release.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$REPO_ROOT/release-ext"
ZIP_NAME="jobs-hero-cws-min.zip"
ZIP_PATH="$REPO_ROOT/$ZIP_NAME"

cd "$REPO_ROOT"

# Start from a clean release directory.
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/icons" "$RELEASE_DIR/assets/tutorial"

# 1) Sync extension runtime files declared/used by manifest runtime.
EXT_FILES=(
  manifest.json
  background.js
  content.js
  filter_engine.js
  keyword_engine.js
  ui_control_bar.js
  storage.js
  styles.css
  popup.html
  popup.css
  popup.js
  welcome.html
  welcome.css
  welcome.js
)
for f in "${EXT_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    cp "$f" "$RELEASE_DIR/$f"
    echo "  synced $f"
  else
    echo "  WARN: $f not found, skipping"
  fi
done

# 2) Sync icons (only the sizes in manifest)
for size in 16 48 128; do
  src="$REPO_ROOT/icons/icon${size}.png"
  if [[ -f "$src" ]]; then
    cp "$src" "$RELEASE_DIR/icons/icon${size}.png"
    echo "  synced icons/icon${size}.png"
  else
    echo "  WARN: $src not found"
  fi
done

# 3) Sync tutorial assets used by welcome page.
for img in 1-overview.png 2-freshness.png 3-visual-filters.png 4-text-filters.png; do
  src="$REPO_ROOT/assets/tutorial/$img"
  if [[ -f "$src" ]]; then
    cp "$src" "$RELEASE_DIR/assets/tutorial/$img"
    echo "  synced assets/tutorial/$img"
  else
    echo "  WARN: $src not found"
  fi
done

# 4) Zip release-ext contents (root of zip = contents of release-ext)
cd "$RELEASE_DIR"
zip -r "$ZIP_PATH" . -x "*.DS_Store"
cd "$REPO_ROOT"

echo ""
echo "Done. Package: $ZIP_PATH"
ls -la "$ZIP_PATH"
