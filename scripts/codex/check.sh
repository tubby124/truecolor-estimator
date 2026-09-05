#!/usr/bin/env bash
# Default: dependency-free project documentation/status check.
# --full: local application gates; SQL and browser gates still run in GitHub CI.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
case "${1:---docs}" in
  --docs) mode=docs ;;
  --full) mode=full ;;
  *) echo 'Usage: bash scripts/codex/check.sh [--docs|--full]' >&2; exit 2 ;;
esac
if [[ $# -gt 1 ]]; then
  echo 'Usage: bash scripts/codex/check.sh [--docs|--full]' >&2
  exit 2
fi
node scripts/codex/project-status.mjs
if [[ "$mode" == docs ]]; then exit 0; fi
if [[ ! -x node_modules/.bin/tsc ]]; then
  echo 'Run bash scripts/codex/setup.sh before --full.' >&2
  exit 1
fi
# Same public build placeholders as CI. Do not copy a production .env into Cloud.
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder-publishable-key
export NEXT_PUBLIC_SITE_URL=https://truecolorprinting.ca
./node_modules/.bin/eslint src/ --max-warnings=999
./node_modules/.bin/tsc --noEmit
npm test
npm run validate:pricing
npm run test:google-ads
npm run build
