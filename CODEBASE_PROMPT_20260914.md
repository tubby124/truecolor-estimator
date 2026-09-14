# Implementation Brief: True Color Agent-Ready Commerce Without SEO Regression

Use this brief to start the implementation in a separate, explicitly authorized coding task. Read `AGENTS.md`, `docs/TRUE-COLOR-INDEX.md`, `docs/operations/CURRENT-STATE.md`, the protected SEO standard, and `CODEBASE_AUDIT_20260914.md` before editing.

## Objective

Turn True Color from an AI-readable website into a safely agent-operable commerce system while preserving the current SEO architecture, pricing authority, human checkout, and provider integrations.

The first connected milestone is:

> A fresh machine client can discover one supported product, retrieve its valid configuration schema, calculate the same customer-safe price as the human UI, prepare a side-effect-free checkout intent, present an immutable review, obtain explicit user approval, confirm exactly once, and recover the same status after a timeout—without leaking private pricing or weakening indexed pages.

Keep three completion levels separate:

- **First live pilot:** Journey A completes end to end for one exact offer.
- **Reusable architecture gate:** Journeys A, B, and C pass contract, privacy, state-transition, and failure-path tests against the shared design.
- **Broad agent-ready claim:** All three journeys are proven end to end at their real final surfaces.

The first live pilot is not permission to claim broad coverage. The reusable test gate does not require three live purchases or outbound communications.

## Current baseline

- Repository: `tubby124/truecolor-estimator`
- Current baseline reviewed: `main` at `8ea94bf8`; exact runtime gates ran at `27c07f20`, and the intervening commit changed search documentation/skill files only
- Framework: Next.js `16.3.4` from the committed lockfile
- Strong pieces to reuse:
  - pricing engine and validated request parsing;
  - commerce product-family IDs;
  - configuration fingerprints;
  - Merchant offer IDs and versions;
  - server-side order repricing;
  - payment token signing;
  - database uniqueness/resume primitives;
  - Merchant feeds, schema, sitemaps, `llms.txt`, and server-rendered SEO pages.
- Current readiness verdict:
  - discovery/citation: strong;
  - deterministic commerce foundation: useful;
  - safe/formal agent action layer: missing.

## Non-goals

- Do not redesign the storefront.
- Do not mass-rewrite service/location copy.
- Do not change ranking-page URLs, titles, H1s, canonicals, or navigation without a separate SEO experiment.
- Do not replace the pricing engine or duplicate its formulas.
- Do not create separate business logic inside UCP, ACP, MCP, or WebMCP adapters.
- Do not allow an agent to bypass server repricing, tax rules, policy acceptance, payment controls, or human approval.
- Do not send emails, create provider records, deploy, submit Merchant changes, or test live purchases unless that exact external action is authorized.

## Authority and truth rules

1. Current pricing CSV/engine output is runtime authority. Public prices must be derived or validated against it.
2. Commerce product ID, configuration fingerprint, Merchant offer ID, and offer version must survive every layer.
3. Canonical shipping, pickup, returns, cancellation, artwork, payment, and turnaround policies must come from one machine-readable source.
4. Keep `orderable` separate from `on_hand`. A custom-made item may be purchasable while local physical inventory is zero.
5. Do not restore the retired 24×36 ACP `$66` price. Current active runtime/public price is `$78`; reconcile stale reference/guard language to that decision.
6. Do not infer provider approval from a valid feed, an HTTP 200, a passing test, or a local demo.

## Required work order

### Milestone 0 — Close unsafe seams before advertising an agent API

#### 0.1 Public estimate response

- Stop returning the raw engine result from the public estimate route.
- Define explicit internal and public types.
- The public response may include:
  - stable product ID;
  - normalized public configuration;
  - configuration fingerprint;
  - quantity;
  - CAD subtotal, tax, and total;
  - price/offer version;
  - estimate expiry;
  - fulfillment/policy references;
  - customer-safe warnings;
  - opaque signed estimate ID.
- It must not include:
  - material, ink, labor, overhead, or internal cost;
  - margin/markup internals;
  - internal rule names or rules fired;
  - database/service credentials or private identifiers.
- Add a shared/durable limiter suitable for multiple Railway instances.

#### 0.2 Ambiguous checkout retry

- Preserve one logical idempotency key through `409`, `503`, timeout, disconnect, and provider uncertainty.
- Never tell a client to create a new key until the original attempt is proven terminal or explicitly abandoned.
- Return a stable intent/status resource that can answer:
  - not started;
  - prepared;
  - approved;
  - processing;
  - action required;
  - confirmed;
  - failed terminally;
  - expired/cancelled.
- Update the existing test that currently expects the key to be cleared.

#### 0.3 Confirmation privacy

- Do not authorize order retrieval with a raw UUID alone.
- Use authenticated ownership or a signed, expiring, purpose-scoped capability.
- Return a minimal status projection; do not reveal the receipt token through the order ID.
- Set `Cache-Control: no-store`, a strict `Referrer-Policy`, and analytics exclusion for confirmation/payment/status paths.

#### 0.4 Side-effect-free GET

- Audit all public GET routes.
- GET may read or render only.
- Move Clover/payment creation or resume behavior behind idempotent POST confirmation.

#### 0.5 Adjacent checkout safety

- Make coupon redemption atomic with order creation or intent confirmation.
- Make the artwork/proof bucket private and remove permanent-public fallback behavior.
- Bind upload capabilities to an expiring cart/intent and ownership context.
- Sign unsubscribe capabilities; GET displays, validated POST mutates.

**Milestone 0 gate:** Do not start protocol adapters until the public cost leak, ambiguous retry, UUID-only order access, and GET side effects are closed and covered by tests.

### Milestone 1 — Versioned read-only contract

Build an additive `/api/v1` contract over existing domain services.

Suggested resources:

```text
GET  /api/v1/catalog
GET  /api/v1/products/{product_id}
GET  /api/v1/products/{product_id}/configuration-schema
POST /api/v1/estimates
GET  /api/v1/estimates/{estimate_id}
GET  /api/v1/policies
GET  /openapi.json
GET  /agent-integration
```

Contract requirements:

- OpenAPI 3.1 document checked into/generated by the repo;
- exact JSON Schema for all inputs/outputs;
- stable public IDs, never array positions or display labels as identity;
- stable error envelope, such as:

```json
{
  "error": {
    "code": "INVALID_CONFIGURATION",
    "message": "Human-readable explanation",
    "field": "width",
    "retryable": false,
    "request_id": "opaque-id"
  }
}
```

- documented units, currency, timestamps, expiry, and version fields;
- explicit `Cache-Control`, CORS, authentication, rate-limit, and retry behavior;
- no JavaScript required to retrieve the contract or public product facts;
- contract tests that compare public estimate results to the existing human estimator/domain engine;
- logging that records request/correlation IDs without PII, artwork paths, approval tokens, or full payloads.

Keep write endpoints out of `robots.txt` and search indexing. A crawler does not need to index an API for an authorized agent to call it.

### Milestone 2 — Durable server cart and checkout intent

Suggested resources:

```text
POST   /api/v1/carts
GET    /api/v1/carts/{cart_id}
POST   /api/v1/carts/{cart_id}/items
PATCH  /api/v1/carts/{cart_id}/items/{line_id}
DELETE /api/v1/carts/{cart_id}/items/{line_id}

POST /api/v1/checkout-intents
GET  /api/v1/checkout-intents/{intent_id}
POST /api/v1/checkout-intents/{intent_id}/prepare
POST /api/v1/checkout-intents/{intent_id}/approve
POST /api/v1/checkout-intents/{intent_id}/confirm
POST /api/v1/checkout-intents/{intent_id}/cancel
```

The exact resource shape may differ, but the state model must preserve these guarantees:

#### Prepare

- validates product/configuration identity;
- reprices on the server;
- checks tax, coupon, artwork, address, pickup/shipping, and policy version;
- creates an immutable review snapshot with an expiry;
- has no Wave, Clover, email, customer-message, or final-order side effects.

#### Approve

- records who/what granted authority and at what time;
- scopes authority to the exact snapshot hash, amount/currency, fulfillment, policies, and expiry;
- supports a human handoff page;
- cannot be silently reused after repricing or material changes.

#### Confirm

- consumes the approval exactly once;
- uses the same durable idempotency key through every retry;
- creates/resumes provider state safely;
- returns a status resource even when final provider outcome is unknown;
- never creates a second logical order for the same approved intent.

#### Status

- is safe to poll with backoff;
- returns minimal information appropriate to its capability scope;
- provides `retry_after` or next-action information;
- never exposes customer PII to a catalog-only or leaked capability.

#### Agent identity and scopes

Start with purpose-scoped, expiring capabilities. Suggested scopes:

```text
catalog:read
estimate:create
cart:write
checkout:prepare
checkout:approve
checkout:confirm
order:status
artwork:write
```

Do not treat possession of a product URL, cart ID, order UUID, or browser cookie as unlimited delegated authority.

### Milestone 3 — Thin protocol adapters

Only after the underlying contract and safety model pass:

1. **UCP adapter:** map the existing Merchant identity/feed and new checkout intent to the current Google UCP version. Pin and test a version; UCP is evolving.
2. **ACP adapter:** map discovery/checkout capabilities to the current ACP schema where merchant/channel eligibility supports it.
3. **WebMCP pilot:** expose low-risk browser actions first—search catalog, show configuration schema, calculate estimate, prepare review. Keep `confirm` behind explicit user approval.
4. **Optional MCP server:** only if a real client needs it. Make it a thin caller of `/api/v1`, not a second commerce backend.

Protocol adapters must be replaceable without modifying prices, taxes, discounts, order truth, or provider orchestration.

## SEO preservation checklist

- [ ] No ranking page URL, title, H1, canonical, or major copy change in the agent-contract PR.
- [ ] Indexed pages remain server-rendered and useful without API access.
- [ ] Account/cart/checkout/confirmation/status/write endpoints remain `noindex` or outside indexable surfaces.
- [ ] Catalog API, Product schema, Merchant feed, and analytics use the same stable identities.
- [ ] Product schema adds only verified image/shipping/return fields.
- [ ] Search/citation crawler policy is separate from model-training crawler policy.
- [ ] Redirecting `llms.txt` links are replaced with canonical destinations.
- [ ] Volatile `llms.txt` facts are generated or tested against canonical truth.
- [ ] Existing one-controlled-SEO-experiment rule remains in force.
- [ ] GSC/GBP/Merchant provider state is measured separately from code deployment.

## Required reusable-architecture acceptance tests

Use at least three materially different journeys. Do not claim reusable architecture using three sizes of the same simple sign.

### A. Exact offer and pickup

- Merchant offer ID maps to one canonical product/configuration.
- Public estimate equals the human estimator and server repricing.
- Prepared review includes pickup, taxes, current policies, amount, and expiry.
- Simulated response loss after provider creation still returns the same order on retry.

### B. Custom configuration and private artwork

- Client discovers allowed dimensions/options without scraping UI labels.
- Invalid combination returns a stable field-level error.
- Artwork is private, signed, scoped, and inaccessible cross-customer.
- Changing configuration after approval invalidates approval.

### C. Quote/exception handoff

- Unsupported purchase is identified as quote-required.
- Preparing the handoff sends no email and creates no provider record.
- Explicit consent/confirmation performs one handoff.
- Status reveals no unrelated customer data.

For all three, test:

- duplicate request;
- network timeout before/after server commit;
- `409`/`503` recovery;
- stale price/expired offer;
- expired approval;
- tax and fulfillment ambiguity;
- coupon contention;
- upload size/type abuse;
- cross-account access;
- log/referrer/analytics leakage;
- no-JavaScript read/review;
- cancellation and terminal failure.

## Security and privacy gates

- [ ] Public estimate output contains no internal costing/rule fields.
- [ ] Rate limits work across multiple application processes.
- [ ] Public uploads are bound to an intent and cannot exhaust memory before size rejection.
- [ ] Artwork/proofs never rely on permanent public URLs.
- [ ] UUID alone grants no order/customer access.
- [ ] Tokens are signed, scoped, expiring, revocable where required, and compared safely.
- [ ] GET routes have no business side effects.
- [ ] Coupon claims are transactional.
- [ ] Logs and analytics exclude capabilities, order UUIDs, emails, addresses, and artwork paths.
- [ ] Approval receipt records snapshot hash, policy version, amount/currency, actor, timestamp, and expiry.
- [ ] An agent cannot raise amount, change fulfillment, or attach new artwork after approval.

## Observability

Add a correlation ID that connects, without exposing PII:

```text
agent request
  -> estimate ID
  -> cart ID
  -> checkout intent ID
  -> approval receipt ID
  -> order ID
  -> provider reference
  -> customer-visible status
```

Track:

- prepare-to-approve conversion;
- approval-to-confirm conversion;
- retry/recovery rate;
- duplicate prevention events;
- price/version mismatch rate;
- agent/client and protocol version;
- provider uncertainty duration;
- rejected scope/ownership requests;
- human handoff frequency.

Do not send sensitive URLs or capabilities to GA4/Google Ads.

## Suggested implementation slices

Keep PRs small enough to verify independently:

1. sanitize estimate DTO + limiter + tests;
2. idempotency/status recovery + tests;
3. confirmation/privacy/GET safety + tests;
4. canonical fact reconciliation + generated checks;
5. `/api/v1` read-only contract + OpenAPI + contract tests;
6. durable server cart;
7. checkout intent prepare;
8. approval receipt and human review;
9. confirm/status orchestration;
10. private artwork and atomic coupon hardening;
11. one UCP/ACP/WebMCP pilot adapter;
12. three-journey end-to-end proof.

After each slice, run the smallest relevant tests plus the repository check script. Before merge, run the full exact-lock verification.

## Verification commands

Use the repository’s own instructions first. At minimum:

```bash
npm ci
npm run validate:commerce-truth
bash scripts/codex/check.sh --full
npm audit --omit=dev
```

Add contract/schema tests and agent journey tests to the standard gate. Do not use a stale local dependency tree as release proof.

## Deliverables for the first connected milestone

- threat model and public/private data classification;
- explicit state diagram for checkout intent;
- OpenAPI 3.1 contract;
- customer-safe estimate DTO;
- durable idempotency and status semantics;
- server cart/checkout-intent schema and migration;
- human review/approval page;
- unit, contract, integration, privacy, and three-journey tests;
- SEO diff showing protected surfaces unchanged;
- live-readback checklist that separates deployed, provider-approved, and customer-visible states;
- rollback procedure.

## Stop conditions

Stop and report rather than guessing if:

- current tax/policy/price authority conflicts and cannot be resolved from repository evidence;
- provider APIs cannot support idempotent resume/status behavior;
- the implementation would require public artwork or UUID-only order access;
- protocol requirements force duplicate pricing/order logic;
- an SEO-critical page must materially change for the contract to work;
- a live purchase, email, provider mutation, or public release becomes necessary without explicit scope.

## Definition of done

- The **first live pilot** is done when Journey A passes from discovery through one provider/customer-visible result, the human UI agrees with the same domain contract, no external side effect occurs before approval, retries converge on one outcome, private data remains scoped, and protected SEO surfaces are unchanged.
- The **reusable architecture gate** is done when A, B, and C pass their contract, privacy, state-transition, and failure-path suites without duplicating business logic.
- The **broad agent-ready claim** is allowed only after A, B, and C have each been proven end to end at their real final surfaces.

A passing build, valid feed, HTTP 200, local demo, or protocol response alone is not completion.
