#!/usr/bin/env bash
# Runs in the disposable PostgreSQL service provided by lint-test.yml.
set -euo pipefail

pg=(psql --host 127.0.0.1 --username postgres --dbname postgres)
"${pg[@]}" --file scripts/db/estimate-rate-limit-regression.sql

result_file="$(mktemp -t tc-estimate-rate-limit.XXXXXX)"
trap 'rm -f "$result_file"' EXIT

# More concurrent service-role claims than the configured limit must produce
# exactly 20 accepts, never a lost update. Each psql process is a proxy for a
# separate Railway instance using the same atomic RPC/table row.
claim() {
  PGOPTIONS='-c role=service_role' psql --host 127.0.0.1 --username postgres --dbname postgres -Atqc \
    "SELECT public.claim_api_rate_limit('public-estimate', repeat('c', 64), 20, 60);"
}
export -f claim
seq 1 100 | xargs -P 20 -n 1 bash -c 'claim' > "$result_file"

accepted="$(grep -cx 't' "$result_file" || true)"
total="$(wc -l < "$result_file" | tr -d ' ')"
count="$(${pg[@]} -Atqc "SELECT request_count FROM public.api_rate_limit_buckets WHERE scope = 'public-estimate' AND key_hash = repeat('c', 64);")"

if [[ "$accepted" != "20" || "$total" != "100" || "$count" != "100" ]]; then
  echo "rate-limit concurrency regression failed: accepted=$accepted total=$total persisted_count=$count" >&2
  exit 1
fi

echo 'estimate_rate_limit_concurrency_regression_passed'
