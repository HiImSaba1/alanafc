#!/usr/bin/env bash
set -Eeuo pipefail
[[ "$(uname -s)" == "Linux" ]] || { echo "Linux is required." >&2; exit 1; }
for command in git node npm tar sha256sum strings; do command -v "$command" >/dev/null || { echo "$command is required." >&2; exit 1; }; done
repo_root="$(git rev-parse --show-toplevel)"; cd "$repo_root"
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || { echo "Refusing to package a dirty repository." >&2; git status --short >&2; exit 1; }
[[ "$(node -p 'process.platform')" == "linux" ]] || { echo "Linux Node.js is required." >&2; exit 1; }
[[ "$(node -p 'process.versions.node')" == 22.* ]] || { echo "Node.js 22 is required." >&2; exit 1; }
git_sha="$(git rev-parse HEAD)"; build_timestamp="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"; artifact_dir="$repo_root/artifacts"; work_dir="$(mktemp -d)"; source_dir="$work_dir/source"; release_dir="$work_dir/release"; artifact_name="alanafc-papaki-next-build.tar.gz"
cleanup(){ rm -rf -- "$work_dir"; }; trap cleanup EXIT
mkdir -p "$source_dir" "$release_dir" "$artifact_dir"
git archive --format=tar HEAD | tar -xf - -C "$source_dir"; cd "$source_dir"
export NEXT_TELEMETRY_DISABLED=1 DATABASE_URL='mysql://build:build@127.0.0.1:3306/build' SESSION_SECRET='github-actions-build-secret-at-least-32-characters' NEXT_PUBLIC_SITE_URL='https://alanafc.gr'
npm ci --legacy-peer-deps --include=dev
npm test
npm run lint
npm run typecheck
npm run build
test -f .next/standalone/server.js; test -f .next/BUILD_ID; test -d .next/static; test -d public
cp -a .next/standalone/. "$release_dir/"
mkdir -p "$release_dir/.next"; cp -a .next/static "$release_dir/.next/static"; cp -a .next/BUILD_ID "$release_dir/.next/BUILD_ID"; cp -a public "$release_dir/public"; cp scripts/deploy/standalone-start.cjs "$release_dir/start.js"
node scripts/deploy/generate-manifest.mjs "$release_dir" "$release_dir/ARTIFACT-MANIFEST.json" "$git_sha" "$build_timestamp"
if find "$release_dir" -type f \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.sql' \) -print -quit | grep -q .; then echo "Forbidden private input found in release." >&2; exit 1; fi
cd "$work_dir"; tar -czf "$artifact_dir/$artifact_name" -C "$release_dir" .; cd "$artifact_dir"; sha256sum "$artifact_name" > "$artifact_name.sha256"
artifact_sha="$(cut -d ' ' -f 1 "$artifact_name.sha256")"; artifact_bytes="$(stat -c '%s' "$artifact_name")"
node -e 'const fs=require("node:fs"); const [source,target,name,sha,bytes]=process.argv.slice(1); const data=JSON.parse(fs.readFileSync(source,"utf8")); data.artifact={name,bytes:Number(bytes),sha256:sha}; fs.writeFileSync(target,JSON.stringify(data,null,2)+"\n");' "$release_dir/ARTIFACT-MANIFEST.json" "$artifact_dir/$artifact_name.manifest.json" "$artifact_name" "$artifact_sha" "$artifact_bytes"
bash "$source_dir/scripts/deploy/verify-artifact.sh" "$artifact_dir/$artifact_name"
echo "Artifact: $artifact_dir/$artifact_name"
