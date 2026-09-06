# Pricing and quote consistency — September 6, 2026

Lane P implementation record for the owner-approved pricing/social handoff. Branch `impl/pricing-consistency-20260906`, based on canonical main `40868735`; integration owns merge order and deployment. No production migration, customer message, payment, refund or content publication is authorized by this implementation record.

## Product facts contract

`src/lib/pricing/product-facts.ts` exports synchronous, server-only `resolveProductFacts({ productSlug, configuration? }): ProductFacts`, `ProductFactsConfiguration`, and `ProductFactsError`. Import types only from client modules. The module uses Node crypto/fs and the CSV loader and must stay on the server.

Returned fields: `schemaVersion: 1`, `productSlug`, `productName`, `productUrl`, complete bound engine `configuration`, `configurationLabel`, `availability: made_to_order`, `currency: CAD`, `priceBasis: configured_quantity`, `quantity`, `rawSubtotal`, `standalonePreTaxOrderTotal`, `orderMinimum`, `minimumDisclosure`, `allowedClaims`, `sourceFingerprint`, `pricingVersion`, and `sourceRuleIds`. Amounts are CAD dollars at cent precision. Base promotional facts exclude design/rush and taxes. They describe a configured quantity, not a per-unit price or a universal category minimum.

Input configuration supports material, width/height, sides, quantity, sticker shape and supported engine add-ons. Defaults come from the named first website preset/default sides/quantity. Published preset membership and active lot membership are checked before calling the real engine. Unknown products, invalid/mismatched selections, coming-soon products, standalone services and unresolved custom-shape signs fail closed. The engine's active sticker V2 model supplies sticker prices; retired sticker CSV prices are not a fallback. Current source has active business-card 2,000/5,000 lots despite a stale historical disabled-products instruction; this change neither enables nor disables any CSV product.

`configuration` round-trips directly back into the resolver for approval/publication freshness. Bound category must match the selected source product, artwork must remain PRINT_READY and rush false. Persist the exact configuration plus source fingerprint, then resolve again and compare fingerprints before approving/publishing. Do not use the version label `v1_2026-02-19` alone. Never overwrite customer-specific issued quote/order snapshots with newly resolved catalogue facts.

Fingerprint binds actual engine/sticker/order-min implementation sources, scoped product/rule/quantity-discount rows, loaded business configuration, the selected price result, display claims and order minimum. The implementation sources are explicitly included in Next standalone output. Executable model changes invalidate all affected model users conservatively; product-row changes invalidate matching material/category facts. Schedule changes are absent from the fingerprint. Files and cached tables describe one application process/deployment snapshot; deploy new source tables rather than editing files underneath a running process.

Retractable configuration retains the website's buyable dimensions for engine calculation; `configurationLabel` and `allowedClaims` omit dimensions because website/CSV/historical GBP dimensions conflict. Static tier price text is removed from labels. C/G must generate factual copy only from supported claims, not turn raw configuration fields into dimension promises.

## Price communication

Marketing consistency compares actual public `PRODUCTS.fromPrice` to an explicit advertised configuration's standalone pre-tax order total, with exact equality in both drift directions. Expected prices are no longer duplicated inside the drift checker. ACP/foamboard use the documented standard 18×24 anchor rather than assuming the smallest preset is the advertised offer. The resolved retired-ACP-lock advisory is removed; live intentional banner/coroplast locks remain guarded.

Photo poster print remains $15 raw for 12×18. The product starting order anchor is $25, with the $15 print/$25 minimum distinction in its tagline and reference instructions. No product price table was changed. No protected ranking-page title, H1 or slug was rewritten.

## Financial correction and estimator flows

| Surface | Implemented contract |
| --- | --- |
| Website/staff estimate API | Shared pure engine; validated source inputs retained with the response, canonical CSV tax rates supplied |
| Website checkout | Revalidates catalogue configuration server-side; shared cents calculation, order minimum, discount and rush once |
| Manual Make a Quote / Request Payment | Customer-specific amounts remain manual; one canonical tax/cents calculation is shared with preview; bespoke orders do not acquire the website floor |
| Historical order copying | Copied customer prices carry source-order provenance; copying specifications for a new quote does not silently import a historic price |
| Estimator quote email | Server re-estimates original inputs and rejects stale reviewed subtotals; negotiated prices require the saved manual quote workflow |
| Legacy estimator Wave endpoint | Authenticated 409 ORDER_BACKED_QUOTE_REQUIRED; no current UI caller. Staff New Quote uses the existing persisted order/manual quote workflow, replacing orphan external drafts |
| Total-only reprice endpoint | Authenticated 409; no delta token, customer email, total-only write or refund promise |
| Unpaid correction | Complete structured revision or void-and-replace; preserve original document and payment evidence |

Void-and-replace requires pending/unpaid status, confirmed accounting readiness, matching linked Wave invoice with zero paid amount and exact total, no checkout/payment attempt evidence, and no existing void. It claims the order with compare-and-set conditions before calling Wave. Existing checkout reservation writes `payment_reference` under its row lock; correction's null-reference CAS prevents a simultaneously reserved checkout from being voided. Provider errors leave the original blocked for reconciliation. Final database persistence must succeed before a replacement is offered. Paid/progressed documents and unknown/missing accounting state require finance reconciliation rather than guessed correction.

Manual submissions carry a stable UUID backed by the existing unique order submission column. A duplicate/racing retry returns the existing order and a visible reconciliation message without resending or generating another invoice. Item-save failure stops before delivery and is recorded as a provisioning failure. Estimator emails carry a stable provider idempotency key and require email-log persistence; uncertain attempts use the same key inside the provider window, never an automatic new send.

Checkout includes the reviewed grand total; the server compares it after revalidation, discount, minimum, rush and taxes and before customer/order mutations. Stale carts, rates or coupons get a refresh/review response. Structured/manual quote sends also bind reviewed rates, tax policy and totals, so activating the migration cannot silently change an already-open form's quote. Non-divisible negotiated lots omit misleading rounded unit-price claims while preserving the exact line amount.

A complete saved revision remains immutable after catalogue changes. A stale catalogue quote must be reviewed again; an explicitly negotiated customer quote remains its own snapshot. Before a customer link/email is released, Wave financial readback must match the saved order's subtotal, GST, PST and total in cents, using the actual configured tax identities. Creation failures remain ambiguous and do not send. Confirmed mismatches on already-ready pending orders quarantine accounting readiness; transient read errors block the current operation without asserting a financial mismatch. A mismatch hold blocks application Pay Now/checkout reservation reuse, but does not revoke an external Clover hosted URL already issued before detection. Reconcile outstanding provider sessions under the approved finance correction workflow. Mocked finance tests are not delivery proof.

## Canonical rates and structured policy rollout

Pricing rate reads must be read-only. CSV GST/PST feed website/manual/estimator previews and server cents math. Structured quote rates additionally require the database tax config to match CSV. `getQuoteTaxRates()` now SELECTs; missing/mismatched rows fail closed instead of upserting through GET. A deliberate sync is a separate controlled operation.

Structured tax policy repair is prepared with capability/version gating: before the approved additive migration exists, preview/API use the matching legacy SQL basis and show the operational warning. The current PST-20 bundled-print policy is used only for newly marked revisions after database capability is present. Previously issued unmarked revisions retain their stored basis. See the final migration and regression references below before activation. Applying production SQL requires owner approval for True Color's project; it is not covered by ordinary repo push approval.

## Read-only historical impact evidence

`node scripts/pricing/audit-order-consistency.mjs` uses protected Supabase URL/service credentials from the environment and performs GET requests only. It paginates application orders/audit events and prints aggregate counts only; no customer identifiers, artwork, notes, amounts or credentials. Run its synthetic check with `node --test scripts/pricing/audit-order-consistency.node.mjs`. Never commit private provider exports to this public repo.

Production read at **2026-09-06T18:34:52Z**: 224 orders, zero REPRICE markers, zero `order.repriced` audit events, zero non-rush subtotal+GST+PST mismatches, no incomplete stored amounts. Seventeen rush orders remain arithmetically unclassified because legacy rush was outside subtotal without an immutable stored rate. No historical finance corrections were performed.

A separate read-only Wave check at **2026-09-06T18:50:09Z** used the exact new financial-query fields on one existing ready, non-rush invoice. CAD currency, subtotal, GST, PST, total and tax-total reconciliation all matched the stored order. No new invoice was created/approved/voided and no message was sent. This validates the provider query and one existing invoice, not all invoices or new finance delivery.

The aggregate scan is application-record evidence, not complete independent Wave/Clover/email reconciliation. It cannot detect every email-only failure before a historical persistence failure, and live pagination is not a transactional snapshot. Absence of recorded reprice usage does not certify provider books or authorize automatic repair.

## Verification and release record

Initial facts/marketing independent review: 36 focused tests passed, including round-trip freshness, stale source price fingerprint, excluded unverified custom shapes, live retractable/ACP/poster facts, preserved lots and two-way marketing drift. Finance initial focused set: 67 tests passed, followed by independent review; final results and CI are recorded below when complete.

PR #49 passed all required CI checks and integration merged it as `84a409e2c31d30347012f6fa33a8245274793795`. Bounded production readback passed as recorded below. Production migration activation, historical provider reconciliation and genuine finance delivery remain separate evidence/gates. Do not restore retired unsafe reprice/orphan-Wave handlers as a recovery shortcut.

## Prepared migration and controlled operations

- Prepared migration: `supabase/migrations/20260906110000_structured_quote_pst20_policy.sql`. It adds the capability column, replaces the version-dispatched PST-base helper and marks the tax-config capability. It does not change existing order amounts or update issued line snapshots.
- Disposable SQL regression: `node scripts/db/structured-quote-pst20-regression.mjs | psql -X -v ON_ERROR_STOP=1 --dbname lane_p`. The emitter uses actual committed function/migration sources inside a rolled-back transaction. Root integration separately verified compatibility after the existing outbox regression.
- Local execution passed on the coordinator's disposable PostgreSQL18.4 socket; required PR CI runs PostgreSQL16 and the same regression. No production SQL was applied.
- Before activation, obtain owner approval for this exact migration in the actual True Color project, verify current deployment supports the capability, take a database backup and run the disposable regression. Read back the capability and canonical rates afterward. Preview a synthetic mixed print/service revision and confirm the new policy without sending it.
- Recovery: deploy the compatible app before SQL. To stop producing new-policy revisions, set the capability to null through an expressly authorized controlled database change while retaining the new helper so issued marked snapshots still materialize correctly. Do not replace the helper with legacy code after marked revisions exist, or reprice old orders to fit it. Do not restore legacy unsafe correction endpoints.
- Canonical rate sync is an explicit configuration operation, never GET. `node scripts/db/prepare-tax-config-sync.mjs` prints exact CSV-derived SQL and its source hash without connecting to a database; review that output before an authorized execution. Compare existing values first and review the exact intended CSV values; the read path fails closed until DB/CSV agree. Preserve `structured_tax_policy_version` during rate-only synchronization.


Independent final code review approved after remediation, with zero remaining critical/high findings. Reviews covered source-fact round trips, static tier-price leakage, excluded custom-shape truth, complete correction navigation, saved override provenance, reviewed tax-policy activation, non-divisible lots and durable Wave mismatch quarantine. New catalogue inputs remain separate from negotiated customer amounts.


## Final local verification (exact lockfile)

- `npm ci`: exact locked Next16.3.4 dependencies installed; zero reported vulnerabilities. Earlier local dependency-copy checks were preliminary and superseded.
- `npm test`: **1,287 tests passed across140 source files**. Generated `.next` output is excluded from discovery; no source test was excluded. Initial broad tracing was replaced with literal model file reads, and the final standalone build contains the expected model sources.
- Full ESLint: zero errors,29 warnings; strict TypeScript and production standalone build passed using public CI placeholders.
- Pricing validation passed; Google Ads130 tests and deterministic artifacts passed; VPS scheduler16 tests and aggregate audit1 test passed. Project records and whitespace checks passed.
- Disposable PostgreSQL regression passed and rolled back; exact PST policy and audit regression steps are added to required CI under integration's explicit shared-workflow permission.
- Chromium exercised the35 required paid-journey/social contracts against local standalone on port3017. Initial34 passed; one stale synthetic response omitted the newly explicit PST rate. Its fixture now supplies both canonical rates and the affected contract passed on rerun. Required PR CI subsequently passed all 35 together; see the deployed record below. Staff/provider APIs were intercepted or lacked production credentials; no live delivery test occurred.
- Independent review approved with zero remaining critical/high findings. Production provider query readback and historical scan limits are stated above.


## Merged pricing runtime verification — 2026-09-06

PR [#49](https://github.com/tubby124/truecolor-estimator/pull/49) passed required CI on head `5927673f59bd5c4fd3a9df0f5f6d28ccb5fbec14`: application lint/test/build, PostgreSQL regressions and GitGuardian security. [Run 34053456425](https://github.com/tubby124/truecolor-estimator/actions/runs/34053456425) confirms **1,287 unit tests across 140 files and all 35 Chromium contracts passed**. The manually dispatched production-smoke job was skipped as expected.

Main-branch [CI run 34053757527](https://github.com/tubby124/truecolor-estimator/actions/runs/34053757527) also completed successfully on merge `84a409e2c31d30347012f6fa33a8245274793795`: application checks and PostgreSQL regressions passed; manually dispatched production smoke was skipped.

Railway readback showed deployment `38d1b0b7-7d39-4720-8db5-e3f0b5277dd6` in `SUCCESS` at exact main commit `84a409e2c31d30347012f6fa33a8245274793795`, created at `2026-09-06T19:05:08.639Z`; the previous deployment was removed. Public runtime checks started at **2026-09-06T19:08:36Z** against `https://truecolorprinting.ca`.

| Read-only runtime request | Observed result |
|---|---|
| GET `/api/pricing/tax-rates` | HTTP 200; `Cache-Control: no-store`; `gstRate: 0.05`, `pstRate: 0.06`, `rushFee: 40` |
| POST `/api/estimate`: DISPLAY, RBS33507875S, website preset 33.5×80, quantity 1 | HTTP 200, QUOTED, raw pre-tax `sell_price: 219` |
| POST `/api/estimate`: RIGID, RMACP002, 24×36, quantity 1 | HTTP 200, QUOTED, raw pre-tax `sell_price: 78` |
| POST `/api/estimate`: PHOTO_POSTER, RMPS002, 12×18, quantity 1 | HTTP 200, QUOTED, raw pre-tax `sell_price: 15` |

All three estimates used single-sided, print-ready, non-rush inputs without add-ons. Every response preserved the complete source request in `estimate_request`, returned the canonical 5% GST/6% PST rates and classified the printed product as `pst_exempt: false`. The prices match committed source facts. Retractable dimensions here identify the existing website request only; the unresolved dimension claim remains excluded from generated promotional copy.

These POSTs only computed public estimates; they did not create orders, save revisions, contact providers or send messages. This readback verifies public source prices and rates, not a paid checkout, the poster's $25 standalone-order minimum, database tax capability, authenticated staff revision behavior or new Wave/Clover/email delivery. No production migration or finance correction was applied. Later integration deployments need their own deployment identity/readback; this is evidence for the exact pricing merge above.
