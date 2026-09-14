#!/usr/bin/env bash
#
# Compares a SCORM export against a saved baseline, ignoring the two values the
# packager regenerates on every run: the manifest GUID (lib/guid.js) and a
# Date.now() timestamp in metadata.xml. Without that normalisation every run
# "differs" and a real regression is easy to miss.
#
# Unlike conformance.ts / paths.ts in this directory, this is an INTEGRATION
# check: it shells out to a built dist/index.js and needs a course fixture, so
# run `npm run build` first.
#
# Usage:
#   src/fs/__tests__/compare-scorm.sh baseline <dir> [format]   capture a baseline
#   src/fs/__tests__/compare-scorm.sh check    <dir> [format]   diff against it
#
# Typical loop while changing simple-scorm-packager:
#   COURSE=/path/to/course.md src/fs/__tests__/compare-scorm.sh baseline /tmp/s12 scorm1.2
#   ...edit the packager, npm run build...
#   COURSE=/path/to/course.md src/fs/__tests__/compare-scorm.sh check    /tmp/s12 scorm1.2

set -euo pipefail

MODE="${1:?usage: $0 baseline|check <dir> [format]}"
DIR="${2:?usage: $0 baseline|check <dir> [format]}"
FORMAT="${3:-scorm1.2}"
COURSE="${COURSE:-$PWD/test/course.md}"
BIN="${BIN:-$PWD/dist/index.js}"

# GUID and 13-digit epoch are regenerated per run; everything else must match.
NORMALIZE='s/[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}/GUID/g; s/[0-9]\{13\}/TIMESTAMP/g'

if [ ! -f "$COURSE" ]; then
  echo "No course fixture at $COURSE — set COURSE=/path/to/course.md" >&2
  exit 1
fi

export_to() {
  local out="$1"
  rm -rf "$out"
  mkdir -p "$out/run" "$out/x"
  # Export from an isolated dir: with -i, the course's PARENT becomes the asset
  # path, so a shared directory silently pulls in every sibling file.
  local log="$out/export.log"
  if ! (cd "$out/run" && timeout 300 node "$BIN" -i "$COURSE" -f "$FORMAT" -o "$out/out" >"$log" 2>&1); then
    echo "EXPORT FAILED ($FORMAT) — last lines of $log:" >&2
    tail -20 "$log" >&2
    return 1
  fi
  # A crashed export can exit 0 yet produce nothing; say so plainly rather than
  # letting unzip fail with a confusing message.
  if [ ! -f "$out/out.zip" ]; then
    echo "EXPORT PRODUCED NO ZIP ($out/out.zip) — last lines of $log:" >&2
    tail -20 "$log" >&2
    return 1
  fi
  unzip -q -o "$out/out.zip" -d "$out/x"
}

case "$MODE" in
  baseline)
    export_to "$DIR"
    echo "baseline: $(find "$DIR/x" -type f | wc -l) files -> $DIR"
    ;;
  check)
    CUR="$(mktemp -d)"
    trap 'rm -rf "$CUR"' EXIT
    export_to "$CUR"

    status=0
    # Compare the whole tree, then re-check only the normalised files, so a
    # difference in any other file is still reported verbatim.
    while read -r line; do
      file="${line##*/x/}"; file="${file% differ*}"
      case "$file" in
        imsmanifest.xml|metadata.xml)
          if ! diff <(sed "$NORMALIZE" "$DIR/x/$file") \
                    <(sed "$NORMALIZE" "$CUR/x/$file") >/dev/null; then
            echo "DIFFERS (beyond GUID/timestamp): $file"
            diff <(sed "$NORMALIZE" "$DIR/x/$file") \
                 <(sed "$NORMALIZE" "$CUR/x/$file") | head -20
            status=1
          fi
          ;;
        *)
          echo "DIFFERS: $line"
          status=1
          ;;
      esac
    done < <(diff -rq "$DIR/x" "$CUR/x" 2>&1 || true)

    base_n=$(find "$DIR/x" -type f | wc -l)
    cur_n=$(find "$CUR/x" -type f | wc -l)
    [ "$base_n" = "$cur_n" ] || { echo "FILE COUNT: $base_n -> $cur_n"; status=1; }

    [ $status -eq 0 ] && echo "$FORMAT: IDENTICAL to baseline ($cur_n files)"
    exit $status
    ;;
  *)
    echo "unknown mode: $MODE" >&2; exit 1 ;;
esac
