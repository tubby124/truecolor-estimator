# Checkout analytics continuity — September 9, 2026

## Evidence and diagnosis

The preceding authorized read-only audit on September 9 found two paid Clover-card orders created through website checkout after the September 4 context cutover. Neither stored a GA client ID, session ID or session number. Identifiers and customer records are deliberately excluded from this public record. Both GA4 comparison windows had all recorded purchases classified Unassigned; historical activity must not be replayed or reclassified.

Source tracing found the three fields correctly connected from checkout JSON through the orders API to storage and the six server purchase paths. The browser previously attempted three supported `gtag('get', ...)` reads only during submission, with a 500 ms limit, before artwork uploads. Missing browser context is verified; a tag-loading race is a plausible mechanism, not a proven explanation for those two orders. Blocking, unavailable consent and other absent-tag conditions must continue to produce missing context.

Fresh release-task readback confirmed the deployed base `55fd001e` in Railway deployment `a6880cb0-66c8-4372-a1cf-8fcbc53daaf7`, status SUCCESS. The production GA4 measurement configuration matches the public tag, the API secret is present, and the Ads base tag is configured. The marketing banner is disabled. Meta Pixel/CAPI configuration exists, but configuration alone is not consent, event delivery or advertising readiness.

## Bounded repair

The implementation primes supported GA reads on ordinary public pages and refreshes at submission after uploads. A short-lived session-storage record may supply missing session context only when a fresh read confirms the same client. Missing live identity, expiry, changed identity/session, denied consent and payment pages must not borrow old context. No cookie parsing, second tracker or generated IDs are introduced.

The legacy `scripts/ga4-backfill.mjs` entry point becomes an unconditional safety stop, including dry-run and execute arguments. It must perform no database access or network request. Future genuine activity is the only acceptance path.

Reporting and provider evidence are maintained in [attribution readiness](ATTRIBUTION-READINESS-20260909.md). Event activity and session acquisition are separate from first-user acquisition; aggregate event counts do not establish a sequential cohort funnel.

## Traced event ownership

- Public tag → supported client/session read → checkout JSON after uploads → `api/orders` validation → order context and capture timestamp. Quote forms use the same context helper.
- Confirmed payment → shared amount/item builder → GA4 Measurement Protocol helper. Callers are Clover webhook, payment reconciliation, staff Clover confirmation, staff e-transfer confirmation, staff status confirmation and the Wave payment-effect worker. Browser confirmation does not emit a second GA4/Ads purchase.
- Google Ads uses the separate paid-conversion outbox. Website checkout classifies `purchase_online`; quote-origin orders classify `quote_won`. The committed schema has a unique order constraint; paid transitions enqueue one destination action and the cron handles upload/diagnostics. This source contract and current Ads goal configuration do not substitute for genuine destination-credit/deduplication evidence.
- Meta has separate consent-gated Pixel/CAPI paths and event-ID matching contracts. Presence of that implementation is not proof of receipt, match quality, value parity or paid attribution.

## Acceptance and remaining proof

Release verification must cover blocked/late tags, consent withdrawal during reads, cache expiry, client/session changes, unavailable storage and signed payment-page privacy. Browser fixtures must stay on loopback with external collectors blocked and order submission intercepted. Passing these fixtures proves the handoff contract, not a production purchase.

After deployment, verify one tag bootstrap on a normal public page, genuine supported tag reads and the new cache contract without printing identifiers. Verify an invalid dotted payment URL has no external collectors and does not retain the context cache. No customer order, payment or outbound message may be created for this check.

The final attribution proof remains one naturally occurring, eligible website checkout and payment: real browser context persisted on the new order; one server-owned purchase using its stable transaction identity and net-of-tax item/value contract; then the corresponding processed GA4 purchase with supportable session source/medium and revenue. A purchase without an advertising click cannot prove PPC attribution. HTTP acceptance alone cannot prove GA4 processing. Inspect Ads destination diagnostics for a genuine eligible ad-origin purchase without changing campaign state.

Universal durable GA4 retries remain a separate forward-only design in [the September 4 runbook](GA4-PURCHASE-REPAIR-20260904.md). The existing non-Wave calls are bounded and awaited but not durably queued. Google requires session attribution requests within 24 hours of the session start; stored checkout time alone does not prove that condition for delayed payments. Do not rewrite event time or reuse stale sessions to obtain attribution. [Google's Measurement Protocol requirements](https://developers.google.com/analytics/devguides/collection/protocol/ga4/use-cases).

## Release security and baseline checks

The required production dependency audit found the existing Sharp 0.35.3 pin affected by [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c). The override and lockfile were updated to 0.35.4 and its native dependencies; the production dependency audit then reported zero vulnerabilities. No new package family was added.

Commerce truth validation passed. Gallery validation exposed a pre-existing manifest mismatch: `gallery-vehicle-vinyl-ayotte-plumbing` declares 1200×900 while the unchanged source file is 900×1200. Three existing untracked-asset warnings also remain. This repair does not change gallery records or bytes; the image optimizer browser contract remains part of release verification.

## Release receipt

Local verification: 162 unit files / 1,540 tests passed before the final FormData-reuse regression; the final focused context/backfill suite passed 26 tests. Ads/reporting Node suite passed 133 tests. TypeScript passed; full source lint had zero errors and 29 existing warnings. Production build passed. The built-app browser suite passed 34/34 tests, including five new GA context tests, intercepted checkout payloads with and without real-context fixtures, payment cache/collector boundaries, existing product/cart journeys and real image optimization. Pricing validation passed with its two existing warnings. No provider events or customer orders were sent by these local fixtures.

Independent Astra Low review found no critical/high blockers; its defensive FormData reuse observation was fixed and tested. [PR #75](https://github.com/tubby124/truecolor-estimator/pull/75) merged September 9 at 21:40:44 UTC as `e38445438feecfb62a0561f8af75a729ea807fa3`. Its required [CI run](https://github.com/tubby124/truecolor-estimator/actions/runs/34407708960) passed 1,541 unit tests, 133 Ads/reporting tests, 50 browser contracts, PostgreSQL regressions, type/lint/build and the other required project contracts. The merged revision also passed [main CI](https://github.com/tubby124/truecolor-estimator/actions/runs/34408242223). Railway deployment `334375d0-0942-472c-bbca-683b1d07e801` for that revision was read back SUCCESS. Production smoke completed September 9 at 21:47:50 UTC:

- Public product page HTTP 200; supported gtag reads returned valid client/session/session-number values, exactly matching the fresh session cache. No identifiers were logged. Mobile viewport had no horizontal overflow.
- The expected GA4 and Ads destination libraries were present. The initial smoke's assumption of one total Google library was too strict: Google loads the configured Ads destination separately. The application still has its single existing bootstrap, and this repair adds no tag loader/configuration.
- Invalid dotted payment page HTTP 200, expired-link screen, cache cleared, zero external script libraries and zero external requests originating from the payment document; restrictive CSP and no-referrer header confirmed. Three collect requests observed around navigation originated from the preceding public product document; they were not payment-page collection. Mobile payment layout had no overflow.

No order, payment, synthetic conversion or customer message was created. The normal public-page visit exercised the existing tag only. This closes the code/deployment/browser-continuity slice. The genuine future purchase, PPC credit, future Meta and durable-delivery gates above remain open.
