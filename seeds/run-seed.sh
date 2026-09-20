#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../backend"
PATH="$PWD/.venv/bin:$PATH"
bash scripts/with_secrets.sh python ../seeds/seed.py