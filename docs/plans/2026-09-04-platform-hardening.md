# Platform hardening release — 2026-09-04

## Goal

Close the post-release operational gaps without breaking outstanding payment links or the Railway health check.

## Phase 0 — evidence

- Payment tokens are single-key HMAC v2 tokens with a 30-day expiry. See `src/lib/payment/token.ts` and `src/lib/payment/__tests__/token.test.ts`.
- Railway starts a standalone Next build with `next start`, which produces a warning. See `next.config.ts` and `railway.toml`.
- The two historic migration bodies `20260820223500` and `20260826080000` are unavailable in every local Git ref/object/worktree. Do not add no-op placeholders.

## Phase 1 — public health and payment-key rotation

1. Return only `{ ok }` from public `/api/health`; retain HTTP 200/503 semantics for Railway.
2. Add optional `PAYMENT_TOKEN_SECRET_NEXT` signing with an optional `PAYMENT_TOKEN_LEGACY_UNTIL` fallback window for the existing key.
3. New links use the next key. Existing links can use the original key only before the configured cutoff; preserve token v2 and existing order/quote binding.
4. Update unit tests and configuration harnesses.

Guardrails: do not change token payload semantics, token expiry, payment totals, or quote revision checks. Do not expose secret values or detailed configuration from a public route.

## Phase 2 — Railway runtime and dependency safety

1. Stage `public/` and `.next/static` into the standalone artifact and start `node .next/standalone/server.js`.
2. Update compatible security patches for Next and its transitive dependency graph; never run a blind `npm audit fix --force`.
3. Verify the standalone artifact contains public/static assets and that the test suite passes.

References: Railway’s official Next standalone guide; Next output-file-tracing docs.

## Phase 3 — migration provenance

1. Read remote migration metadata for the two missing historical versions.
2. Restore exact source SQL only if remote metadata contains it.
3. If exact source cannot be recovered, record the evidence and use a reviewed, generated schema-diff reconciliation migration — never invented markers — after a dry-run confirms scope.

Guardrails: no data-destructive SQL; inspect all generated SQL before applying; preserve existing production history.

## Phase 4 — release verification

1. Run typecheck, full unit suite, dependency audit, and the mandatory deployment E2E workflow.
2. Apply the production migration only if an approved real migration is generated and dry-run scope is exact.
3. Deploy main, set the staged payment-rotation configuration without printing values, then verify current Railway deployment, `/api/health`, a static asset, and token compatibility tests.

## Migration provenance result

- The remote metadata for `20260820223500` and `20260826080000` contained prior temporary marker text, not the original migration SQL. Those malformed history records were reverted rather than preserved as fabricated migration sources.
- `supabase migration list --linked` now agrees for every local and remote version, and `supabase db push --dry-run --linked` reports that production is up to date.
- A clean schema pull remains a separate legacy-baseline repair: the historical migration chain assumes pre-existing tables and fails against an empty shadow database. No speculative production migration was added in this release.
