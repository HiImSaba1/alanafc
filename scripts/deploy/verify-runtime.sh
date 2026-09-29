#!/usr/bin/env bash
set -Eeuo pipefail
artifact="${1:-}"
[[ -n "$artifact" && -f "$artifact" ]] || { echo "Usage: verify-runtime.sh <artifact.tar.gz>" >&2; exit 1; }
artifact="$(cd "$(dirname "$artifact")" && pwd)/$(basename "$artifact")"
work_dir="$(mktemp -d)"; release_dir="$work_dir/release"; server_log="$work_dir/server.log"; server_pid=""; port="${ALANAFC_SMOKE_PORT:-3100}"
cleanup(){ if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; fi; rm -rf -- "$work_dir"; }
trap cleanup EXIT
mkdir -p "$release_dir"; tar -xzf "$artifact" -C "$release_dir"; cd "$release_dir"
DATABASE_URL='mysql://build:build@127.0.0.1:3306/build' SESSION_SECRET='github-actions-runtime-secret-at-least-32-characters' HOSTNAME=127.0.0.1 PORT="$port" NODE_ENV=production node start.js >"$server_log" 2>&1 & server_pid=$!
for _ in {1..30}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then echo "Standalone server exited before becoming healthy." >&2; cat "$server_log" >&2; exit 1; fi
  response="$(curl --silent --show-error --fail --max-time 3 "http://127.0.0.1:$port/api/health/live" 2>/dev/null || true)"
  if [[ "$response" == *'"status":"ok"'* && "$response" == *'"service":"alanafc-web"'* ]]; then echo "Standalone runtime health check passed."; exit 0; fi
  sleep 1
done
echo "Standalone server did not become healthy." >&2; cat "$server_log" >&2; exit 1
