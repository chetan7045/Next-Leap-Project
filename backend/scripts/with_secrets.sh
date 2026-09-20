#!/usr/bin/env bash
# Runs a command with secrets from the repo-root secrets.json exported as env vars.
# Usage: bash scripts/with_secrets.sh <command...>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
SECRETS="$ROOT/secrets.json"

if [ -f "$SECRETS" ]; then
  export DATABASE_URL="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["DATABASE_URL"])' "$SECRETS")"
else
  echo "secrets.json not found at $SECRETS" >&2
  echo "Copy secrets.example.json to secrets.json and fill in real values." >&2
  exit 1
fi

exec "$@"