# Audit followthrough — September 4, 2026

## Release scope

Payment paths: prevent edge analytics transformation and external browser collectors, include dotted signed tokens in proxy matching, remove legacy payment paths from first/latest browser attribution, preserve real click IDs and original expiry. Do not rotate/invalidate payment links.

GA4 purchases: net-of-tax amounts, stored offer/product IDs, allocated discounts and separately reported residual order charges. Await bounded requests. Preserve the genuine browser context repair; no synthetic IDs or historical replay.

Reports: redact historical private paths, distinguish Enhanced Conversions configuration from validate-only readiness, expose submitted revenue awaiting diagnostics, and distinguish click-ID candidates from rows marked sent. Quote-lead ingestion acceptance is explicitly not downstream delivery proof.

## Merchant review package

Read-only owner-session inspection of account 5847204541 on September 4:

- `PRODUCTS SOURCE 2`, source 10722317242: 18 products; updated 14:39 CST; two newly added products; all attributes recognized; product file says **No issues found**.
- Existing manual source: 25 products. Account-wide shipping/inventory/price/link issues must be evaluated by source, not used to rewrite the valid local-only feed.
- Primary and local inventory XML each publish 18 matching IDs/prices. Existing eligibility is Free Local Listings only. No paid campaign or online-shipping expansion is proposed.

Concrete next actions in order:

1. Read the canonical source's review/image status again after Google processes it. For a persistent image failure, inspect the exact offer's image URL and Google's stated reason before changing bytes or URLs. An accessible image is not proof that Google processed it.
2. Keep the 25-item manual source until canonical approval is verified. Prepare an exact offer-by-offer retirement list, retaining any distinct valid offer; never delete the source merely to make diagnostics green.
3. Any manual retirement or Merchant setting change requires that exact reviewable list/configuration and owner approval. Do not add fictitious shipping rates or broaden destinations to clear the old listings' errors.

No Merchant setting or feed-source mutation was needed for the accepted 18-item file during this repair.

## SEO sequence

The next target and exact draft are in `seo-prep/2026-09-04-foamboard-strengthening.md`. Ranking pages are not edited in this privacy/tracking release. The September 4 Merchant SEO release and active Wall Graphics observation require a fresh gate review before the next public page experiment.

## Remaining verification and design gaps

- A real new browser-origin order/payment is needed to validate source attribution after Google's processing delay. No real customer order is created merely to test analytics.
- Awaiting a five-second GA request prevents abandoning the request at route completion; it is not durable retry. The forward-only transactional queue design is documented in `GA4-PURCHASE-REPAIR-20260904.md`. Held commerce ledger entries remain held.
- Historic GA4 payment URL cleanup needs a separately scoped Google data-deletion decision; these code changes prevent/sanitize future use but do not erase historical Google records.
- Enhanced Conversions remains default-off; an eventual activation requires event-level consent handling, not merely setting the flag. Sentry remains unconfigured.
- Manual orders lack structured shipping data; no shipping deduction is inferred from free-text item names.

## Validation record

- Full unit suite: 120 files / 1,116 tests passed.
- Google Ads/reporting Node suite: 130 tests passed.
- Locked-dependency production build and changed-code ESLint passed; diff whitespace check passed.
- Commerce truth validation passed. Pricing validation: zero errors and two existing warnings (coil-bound booklet icon and flyer-1000 margin).
- Independent code/security review completed; its candidate-versus-sent report finding was fixed and re-reviewed with no remaining blockers.
- Local production browser checks: dotted invalid payment URL renders the expired-link screen with only same-origin scripts; product add-to-cart hydrates correctly; checkout shows $45 + $2.25 GST + $2.70 PST = $49.95 and rejects empty required fields. Payment and checkout have no horizontal overflow at 390px. No provider payment, customer order or outbound message was created.
- Release deployment and production smoke evidence will be recorded on the pull request after the exact merged commit is live. These checks do not establish a completed provider transaction or Merchant approval.
