#!/bin/bash
# Moves every file that is byte-identical at the same path in all runtime
# folders into dist/assets/common; the exporters copy common next to their own
# folder. pdf and capacitor stay self-contained: they come from other
# LiaScript branches, and an APK should not carry the other formats' chunks.
set -euo pipefail

ASSETS=dist/assets
DIRS=(scorm1.2 scorm2004 scorm1.2-suspend scorm2004-suspend xapi h5p web indexeddb)

# on already deduplicated folders, common would silently lose files
if [ -d "$ASSETS/common" ]; then
  echo "$ASSETS/common exists, run on fresh assets (npm run build:all)" >&2
  exit 1
fi

before=$(du -sb "$ASSETS" | cut -f1)

cd "$ASSETS/${DIRS[0]}"
find . -type f -print0 | while IFS= read -r -d '' f; do
  for d in "${DIRS[@]:1}"; do
    cmp -s "$f" "../$d/$f" || continue 2
  done
  mkdir -p "../common/$(dirname "$f")"
  mv "$f" "../common/$f"
  for d in "${DIRS[@]:1}"; do rm "../$d/$f"; done
done
cd - > /dev/null

after=$(du -sb "$ASSETS" | cut -f1)
echo "Moved $(find "$ASSETS/common" -type f | wc -l) files to common," \
  "saved $(( (before - after) / 1048576 )) MB ($(( after / 1048576 )) MB left)"
