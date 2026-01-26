#!/bin/bash
# Post-build script to add --no-sandbox flag to Linux packages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/release"

echo "Post-processing Linux packages..."

# Function to update desktop file
update_desktop_file() {
  local DESKTOP_FILE="$1"
  if [ -f "$DESKTOP_FILE" ]; then
    if ! grep -q -- "--no-sandbox" "$DESKTOP_FILE"; then
      sed -i 's|^\(Exec=[^ ]*\)\( %U\)\?$|\1 --no-sandbox\2|' "$DESKTOP_FILE"
      echo "  ✓ Updated desktop file with --no-sandbox flag"
      return 0
    else
      echo "  ℹ Desktop file already contains --no-sandbox flag"
      return 1
    fi
  else
    echo "  ⚠ Warning: Desktop file not found at $DESKTOP_FILE"
    return 1
  fi
}

# Process .deb packages
shopt -s globstar nullglob
echo ""
echo "Processing .deb packages..."
for DEB_FILE in "$RELEASE_DIR"/**/*.deb "$RELEASE_DIR"/*.deb; do
  if [ -f "$DEB_FILE" ]; then
    echo "→ $(basename "$DEB_FILE")"
    
    TMP_DIR=$(mktemp -d)
    EXTRACT_DIR="$TMP_DIR/extract"
    
    dpkg-deb -R "$DEB_FILE" "$EXTRACT_DIR"
    
    if update_desktop_file "$EXTRACT_DIR/usr/share/applications/liascript-exporter.desktop"; then
      dpkg-deb -b "$EXTRACT_DIR" "$DEB_FILE" > /dev/null 2>&1
      echo "  ✓ Rebuilt package"
    fi
    
    rm -rf "$TMP_DIR"
  fi
done

# Process .rpm packages
echo ""
echo "Processing .rpm packages..."
for RPM_FILE in "$RELEASE_DIR"/**/*.rpm "$RELEASE_DIR"/*.rpm; do
  if [ -f "$RPM_FILE" ]; then
    echo "→ $(basename "$RPM_FILE")"
    
    TMP_DIR=$(mktemp -d)
    
    cd "$TMP_DIR"
    rpm2cpio "$RPM_FILE" | cpio -idm 2>/dev/null
    
    if update_desktop_file "$TMP_DIR/usr/share/applications/liascript-exporter.desktop"; then
      echo "  ℹ Desktop file updated (RPM rebuild would require rpm-build tools)"
    fi
    
    cd - > /dev/null
    rm -rf "$TMP_DIR"
  fi
done

# Process AppImage packages
echo ""
echo "Processing AppImage packages..."
PROCESSED_APPIMAGES=()
for APPIMAGE_FILE in "$RELEASE_DIR"/**/*.AppImage "$RELEASE_DIR"/*.AppImage; do
  if [ -f "$APPIMAGE_FILE" ]; then
    # Skip if already processed (avoid duplicates from glob pattern)
    BASENAME=$(basename "$APPIMAGE_FILE")
    if [[ " ${PROCESSED_APPIMAGES[@]} " =~ " ${BASENAME} " ]]; then
      continue
    fi
    PROCESSED_APPIMAGES+=("$BASENAME")
    
    echo "→ $BASENAME"
    
    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"
    
    # Extract AppImage
    "$APPIMAGE_FILE" --appimage-extract > /dev/null 2>&1
    
    NEEDS_REBUILD=0
    
    # Update desktop file
    if update_desktop_file "squashfs-root/liascript-exporter.desktop"; then
      NEEDS_REBUILD=1
    fi
    
    # Update AppRun script to always pass --no-sandbox
    if [ -f "squashfs-root/AppRun" ]; then
      if ! grep -q -- '--no-sandbox' "squashfs-root/AppRun"; then
        # Modify the exec lines to add --no-sandbox
        sed -i 's|exec "$BIN"|exec "$BIN" --no-sandbox|g' squashfs-root/AppRun
        sed -i 's|exec "$BIN" "${args\[@\]}"|exec "$BIN" --no-sandbox "${args[@]}"|g' squashfs-root/AppRun
        echo "  ✓ Updated AppRun script with --no-sandbox flag"
        NEEDS_REBUILD=1
      else
        echo "  ℹ AppRun already contains --no-sandbox flag"
      fi
    fi
    
    # Rebuild AppImage if changes were made
    if [ $NEEDS_REBUILD -eq 1 ]; then
      if command -v appimagetool &> /dev/null; then
        ARCH=x86_64 appimagetool squashfs-root "$APPIMAGE_FILE" > /dev/null 2>&1
        echo "  ✓ Rebuilt AppImage"
      else
        echo "  ⚠ Warning: appimagetool not found, AppRun changes will not take effect"
        echo "  ℹ Install: wget -O /tmp/appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage && chmod +x /tmp/appimagetool && sudo mv /tmp/appimagetool /usr/local/bin/"
      fi
    fi
    
    cd - > /dev/null
    rm -rf "$TMP_DIR"
  fi
done

# Process tar.gz packages
echo ""
echo "Processing tar.gz packages..."
for TAR_FILE in "$RELEASE_DIR"/**/*.tar.gz "$RELEASE_DIR"/*.tar.gz; do
  if [ -f "$TAR_FILE" ]; then
    echo "→ $(basename "$TAR_FILE")"
    
    TMP_DIR=$(mktemp -d)
    EXTRACT_DIR="$TMP_DIR/extract"
    mkdir -p "$EXTRACT_DIR"
    
    tar -xzf "$TAR_FILE" -C "$EXTRACT_DIR"
    
    # Find desktop file in extracted contents
    DESKTOP_FILE=$(find "$EXTRACT_DIR" -name "liascript-exporter.desktop" | head -1)
    
    if [ -n "$DESKTOP_FILE" ] && update_desktop_file "$DESKTOP_FILE"; then
      # Rebuild tar.gz
      cd "$EXTRACT_DIR"
      tar -czf "$TAR_FILE" ./*
      echo "  ✓ Rebuilt tar.gz"
      cd - > /dev/null
    fi
    
    rm -rf "$TMP_DIR"
  fi
done

echo ""
echo "✓ Post-processing completed!"
