# Product and pricing decisions worth carrying forward

Reviewed September 5, 2026 against `88edbcc`. This guide preserves useful intent and incident lessons from private May–August notes. It is not a current price list, tax opinion or authorization to change prices. [Current state](CURRENT-STATE.md), current code and pricing rules govern; private historical quotes remain private.

## A new product must actually be purchasable

The August 7 product-addition incident found that a page could return HTTP 200 and pass pricing/unit checks while its Add to Cart button remained disabled. Dimensionless services exposed a hidden assumption that every valid product had physical width and height. Other failures included offering design work twice and different invoice versus checkout tax treatment.

Use the existing [catalog buyability test](../../src/lib/data/__tests__/catalog-buyable.test.ts), [pricing validator](../../scripts/validate-pricing.mjs) and product components. A product launch needs the appropriate price source, catalog entry, landing-card image, icon, slug mapping, navigation and sitemap treatment. Do not index a product configurator merely because it exists; follow the repository's landing-page/indexing policy.

In current code, a dimensionless product uses `serviceMode`, and service material identity uses the `SVC-` convention. Read [tax implementation](../../src/lib/pricing/tax.ts) and [invoice mapping](../../src/lib/payment/quote-wave.ts) together: the `SERVICE` category alone cannot distinguish an exempt standalone service from the taxable small-order fee. These are implementation contracts; independently verify policy when changing tax treatment.

Config tests establish that inputs are valid. A browser test must establish that the real controls allow configuration and Add to Cart, and that cart/checkout display the intended quantity, add-ons and total. For payment-path changes use the existing authorized test process and verify invoice parity; do not create a real customer charge or send mail just to validate a catalog entry. Historical product/test counts are not today's inventory.

## One pricing model, intentional staff flexibility

The May 25 roadmap and May 29 configurator direction aimed for customer and staff tools to share options and engine logic. Staff manual quotes remain an intentional override, not another automatic pricing engine. Preserve a visible engine baseline where useful and record an intentional override rather than silently redefining a product's price.

Current implementation anchors: [product configuration](../../src/lib/data/product-config.ts), [price consistency](../../src/lib/data/price-consistency.ts), [shared configurator](../../src/components/product/UnifiedConfigurator.tsx) and [feature flags](../../src/lib/flags.ts). The repository now contains several category flags, so the historical “only stickers exist” matrix must not be replayed as a current gap list. Flag definitions prove code presence, not that production enabled every flag or finished the migration.

For future consolidation, compare representative configurations before and after, preserve price/tax parity, and change one bounded surface at a time with rollback and observation appropriate to the risk. Do not combine a model migration with a price recalibration merely because an old roadmap lists both. `NEXT_PUBLIC_` flags must use literal property access so the client build can substitute them; current flags document the previous dynamic-access failure.

## Minimums and sticker history contain superseded rules

The May 19 minimum-charge notes contain later May 20 updates: removing per-product floors was followed by a transparent customer order-total setup fee. The current [order-minimum helper](../../src/lib/pricing/order-min.ts) and [existing rule](../../memory/order-minimum-rule.md) explain the customer checkout versus staff manual-quote distinction. Do not resurrect old per-product minimums or copy historical sticker amounts from those notes.

The August 16 reconciliation supersedes the May sticker snap-to-tier recipe when the V2 model is active. Read [sticker V2](../../src/lib/pricing/sticker-model-v2.ts), [engine bridge](../../src/lib/engine/sticker-v2-bridge.ts), [surface parity tests](../../src/lib/engine/__tests__/sticker-surfaces.test.ts) and flags before diagnosing drift. Editing legacy CSV rows does not necessarily affect the active model. A larger size can legitimately cost the same when both are floor-dominated; test the intended monotonic relationship instead of assuming every dimension increase must raise the price.

Preserve shape/material through cart and server repricing, and test typed quantities around tier boundaries rather than presets alone. Historical owner decisions retained staff flexibility for very small quantities; that note is not a mandate to expand public quantity options. Historical rush aggregation and legacy invoice-label concerns are investigation pointers requiring a fresh code comparison, not confirmed current bugs.

## Product families and public claims

The August 6 label correction replaced an invented square-foot price ladder with the existing sticker model. Job-specific label pages can share substrate/model identity while presenting different use cases. Verify the active model before diagnosing a price from a legacy CSV ladder, and verify a landing page's primary product and related cards actually match the advertised job. The earlier May product-expansion list is not evidence those products still need building.

The boat-product incident showed that a lot price and a per-pair price can scale differently through the engine. Test quantity multiplication for each product's sale unit rather than assuming a fixed-size row is appropriate. Use fictional identifiers in examples and generated imagery; customer registration numbers and real job details stay in private records. Regulatory copy needs current primary-source verification before editing; historical launch research is not permanent legal authority.

Price corrections must reach their generator sources and external accounts as applicable: changing queued captions alone can regress on regeneration, and changing Git does not change Ads assets. Inspect current source dependencies and authorized live readback. Do not reuse the historical label rates, design-fee ladder, equipment claims or launch-era account status.

## Quotes, artwork and complex work

The August 15 drift review found that a requested quote could already have a manual reply or payment in a separate system. Before contacting a customer, reconcile actual correspondence, artwork and payment evidence. Inspect supplied file links before asking for artwork again. An uploaded file means received; it does not prove print readiness or proof approval. Honor existing approved customer commitments through the authorized private process rather than silently replacing them with a newly calculated amount.

The August 15 quote-reply tracking proposal preserves the transactional sender and uses inbox reading for replies; it does not authorize replacing senders or enabling an automated quote pipeline. Compare that proposal with the existing [business context](BUSINESS-CONTEXT.md), quote routes and order-message architecture before implementation.

The May 4 vinyl/reprice handoff illustrates why area alone can miss weeding, transfer tape, finishing and installation effort. Retain that scoping lesson, but discard its old proposed rates and sender architecture. The current [reprice route](../../src/app/api/staff/orders/[id]/reprice/route.ts) already exists; do not rebuild the old proposed endpoint as if absent. Any future refinement requires current payment, refund, customer-confirmation and audit-trail checks. A historical proposal is not permission to reprice a paid job, refund it or send a new payment request.
