#!/usr/bin/env bash
# Restore dependencies from the current checkout's lockfile when a cache resumes.
set -euo pipefail
exec bash "$(dirname "${BASH_SOURCE[0]}")/setup.sh"
