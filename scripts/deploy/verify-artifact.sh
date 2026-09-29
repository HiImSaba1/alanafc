#!/usr/bin/env bash
set -Eeuo pipefail
artifact="${1:-}"
[[ -n "$artifact" && -f "$artifact" ]] || { echo "Usage: verify-artifact.sh <artifact.tar.gz>" >&2; exit 1; }
checksum_file="$artifact.sha256"
[[ -f "$checksum_file" ]] || { echo "Missing checksum: $checksum_file" >&2; exit 1; }
cd "$(dirname "$artifact")"
sha256sum --check "$(basename "$checksum_file")"
listing="$(tar -tzf "$(basename "$artifact")")"
for required in './start.js' './migrate.js' './server.js' './package.json' './.next/BUILD_ID' './.next/static/' './public/' './database/migrations/' './ARTIFACT-MANIFEST.json'; do grep -Fq "$required" <<<"$listing" || { echo "Missing required entry: $required" >&2; exit 1; }; done
if grep -Eq '(^|/)(\.git|node_modules/\.cache|\.env($|\.)|playwright-report|test-results|artifacts)(/|$)' <<<"$listing"; then echo "Archive contains a forbidden path." >&2; exit 1; fi
if grep -Eq '^\./public/public/|^\./tmp/' <<<"$listing"; then echo "Archive contains duplicated public assets or a traced temporary build." >&2; exit 1; fi
if grep -E '\.sql$' <<<"$listing" | grep -Ev '^\./database/migrations/' | grep -q .; then echo "Archive contains a database export outside the migration directory." >&2; exit 1; fi
if awk -F/ 'BEGIN{bad=0} /(^|\/)\.\.($|\/)|^\// {bad=1} END{exit bad ? 0 : 1}' <<<"$listing"; then echo "Archive contains an unsafe path." >&2; exit 1; fi
echo "Artifact integrity and content checks passed."
