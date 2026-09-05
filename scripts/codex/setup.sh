#!/usr/bin/env bash
# Codex Cloud setup: lockfile install only; no production credentials required.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 20 || (major === 20 && minor < 19)) { console.error("Use Node 20.19+ (CI) or Node 22.12+."); process.exit(1); } if (major === 22 && minor < 12) { console.error("Use Node 22.12+."); process.exit(1); }'
export NEXT_TELEMETRY_DISABLED=1
npm ci --no-audit --no-fund
