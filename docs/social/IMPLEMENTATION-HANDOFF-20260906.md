# Approved implementation: pricing consistency and three-channel social system

Owner approved implementation September 6, 2026 and explicitly requested new Codex project tasks, parallel GPT-6 engineering, cheaper GPT-5.6 for simple bounded work, Git updates, and consistent documentation. This is the portable authoritative handoff; no other task needs the source conversation.

## Repository and execution

Canonical repository: `/Users/owner/Downloads/Businesses/TrueColor/TRUE COLOR PRICING /truecolor-estimator`, public GitHub `tubby124/truecolor-estimator`. Audited clean main at `40868735`. Saved Codex project `TRUE COLOR PRICING` points to a NON-GIT parent `/Users/owner/Downloads/TRUE COLOR PRICING `; create isolated git worktrees from canonical repository for new lanes. Read canonical AGENTS.md, docs/TRUE-COLOR-INDEX.md, current-state and lane rules. Preserve all unrelated worktrees/dirty edits. Do not relink Railway or print credentials.

Source task: `01a077ce-60bd-7fa1-bacc-6a2f52a90de2`, titled Audit posting and upscaling system. Product direction also came from ChatGPT task `6a9d812d-c3b0-83e8-bb3a-73e2241f3702`, Clone Course Site Plan: Skool is the free classroom/community; AISA storefront sells downloadable finished systems. No AISA storefront implementation is requested here.

Implementation and ordinary Git pushes/PR merges/Railway deployments are approved under repository instructions. Stage named files only, retain CI/hooks, no force-push. Customer communications, real public post content, finance corrections/refunds, new spend, and True Color production DB migrations retain their applicable explicit approval gates. Prepare exact migration/release packages before requesting any genuinely missing approval. Do not create orders/send test emails merely to test setup. New integration account connection is requested; respect credential/OAuth tool gates when encountered. A live provider blocker must not prevent unrelated code work.

## Owner decisions

- Pricing/quote consistency is a separate workstream and prerequisite for price-bearing promotions.
- Staff-negotiated prices remain on that customer quote/order. No catalogue-wide staff price editor is requested.
- IG/FB: daily showcase-led feed, offer every week or two. GBP: 1–2 strong offers weekly, not a copy of every daily showcase.
- Monthly approval of exact media/copy/accounts/dates, then unattended publication. No implicit photo-to-publication authorization.
- Existing purchasable prices/configurations only; no new discount engine, invented urgency/savings or fabricated job stories.
- Shared offer facts, channel-specific presentation. Review actual Google offers before new creative recommendations; unavailable metrics are not zero or evidence of failure.
- Initial release: pricing repairs, catalogue-backed generation, Google connection/history/publishing, monthly resumable review and reliable ongoing scheduler.
- Defer 365-item generation, Telegram intake, studio image enhancement, course checkout/billing, and hosting migration. Preserve hooks/interfaces for later modules.
- Builders can later install their own copy; Hasan's managed clients share his hosted platform. Implement minimal business separation before a second client; no elaborate client portal/billing now.
- Keep current OpenRouter model initially. Optimize compact inputs, cache and resumability, not blind provider swaps.

## Lane ownership and integration rules

Three engineering tasks produce separate reviewed PRs; integration task owns merge order and shared work board. Do not independently merge overlapping changes or publish content. You are not alone: never revert other lanes; coordinate interfaces by task messages. Each lane writes its own dated runbook. Integration owns docs/operations/CURRENT-STATE.md, docs/TRUE-COLOR-INDEX.md and this manifest.

### P — Pricing and quote consistency (GPT-6)

Own pricing/quote/order/payment/marketing consistency implementation, focused tests, and `docs/operations/PRICING-CONSISTENCY-20260906.md`. Do not edit social caption/publishing UI or social migrations. Own new server-only `src/lib/pricing/product-facts.ts`; establish and message its exported contract early to generation lane. Use `resolveProductFacts({ productSlug, configuration? })` naming unless existing architecture makes another interface materially better; return verified product/config, URL, availability, explicit price basis/raw subtotal/standalone pre-tax order total/minimum disclosure, allowed claims and source fingerprint. Export type(s). Support source-backed product mapping, not arbitrary smallest SKU. No model calculates prices.

Trace/test all paths: website configurator, staff estimator, checkout server revalidation, manual Make a Quote/Request Payment modal, structured quote-request Send Quote, estimator Wave draft, historic order copying, revisions and void-and-replace. Manual overrides remain distinct from catalogue suggestions and carry provenance; preserve issued revisions on catalogue changes. Use shared canonical rates/cents math, explicit classification and current exemption semantics. Conflicting legal/tax policies need sourced resolution, never a guessed policy change. Inspect relevant current rules and recent implementation evidence, not stale markdown alone.

Confirmed audit findings:
- Website/staff estimator share estimate API; checkout revalidates. Manual flyer picker already uses engine, other manual rows are free-form.
- Both manual quote_only/request-payment modes create an order and provision Wave; structured quote has separate materialization/revision flow.
- `/api/staff/orders/[id]/reprice` permits pending_payment website orders, sends delta link/email first, then changes ONLY order total/notes. Subtotal/tax/items/Wave remain unchanged and persistence failure is nonfatal. Retire total-only/delta correction; route unpaid corrections through complete revision or existing void-and-replace. Block paid/progressed and uncertain/missing accounting states. Preserve immutable history. Audit historical impact read-only; no automatic financial repair or sending.
- `/api/staff/quote/wave` trusts submitted estimate results; revalidate catalogue inputs server-side, preserving explicitly marked manual pricing where appropriate.
- Some checkout/manual preview/API tax rates are hardcoded while structured quote gets CSV values. `getQuoteTaxRates()` upserts DB even through GET `/api/staff/pricing/tax-rates`; do not invoke as read-only. Make GET genuinely read-only and explicit required sync controlled.
- Existing website minimum vs bespoke quote minimum bypass is intentional; don't force staff overrides onto website minimum policy.
- Marketing consistency wrongly treats actual > advertised as match, contains a stale retired ACP advisory, compares duplicated anchors. Public photo-poster $15 raw needs proper order-minimum disclosure; don't reprice the product.
- Current static social retractable ~$110 vs live engine $219; quarantined GBP ACP $66 vs live 24x36 1S $78. GBP retractable dimensions24x80 vs CSV33x80 vs catalogue33.5x80 unresolved; omit uncertain dimensions, don't guess.
- Pricing version remains v1_2026-02-19, inadequate freshness hash. Fingerprint true source tables/model/configurations.
- Live public sample estimates verified $219 retractable, $78 ACP, $15 raw photo poster. No cart/payment was created. Targeted preexisting 40+37 tests passed; not full cross-surface parity.

Tests: same config across surfaces, lots, locked prices, stickers, floor/discount/rush-once, tax classes/exemptions, override provenance and penny rounding, stale cart/old quoted price, invoice/payment/email exact agreement, revision invalidation/concurrent correction/payment, save/send failures and duplicate requests. Run relevant existing pricing and commerce tests plus repo CI. Runtime deployment verification must distinguish API calculation from actual finance delivery.

### G — Google integration and publishing (GPT-6)

Own GBP OAuth/status/history adapter, Google publishing transport, generic channel type changes, approval/publisher changes, shared-offer persistence/rendering, monthly batch/review/scheduler UI and server routes, and minimal business-scoped social storage/authorization plumbing. Own social migrations except caption generation job/cache migration reserved for lane C. Own `docs/social/GOOGLE-THREE-CHANNEL-20260906.md`. Notify lane C of shared social type changes and business-id resolution contract early. Keep caption route/rewriter implementation to C. Can use focused subagents with distinct ownership if useful, but avoid needless extra agents.

Live configuration audit September6: GOOGLE_GBP_CLIENT_ID true, CLIENT_SECRET false, REDIRECT_URI false, TOKEN_ENCRYPTION_KEY false; gbp_connections empty. Railway CLI is linked at canonical checkout. Supabase MCP access denied for actual project dczbgraekmzirxknjvwe; authorized Railway service config enabled read-only REST fallback without printing credentials. This is access limitation, not evidence of schema absence.

Existing GBP code has signed OAuth state/encrypted token scaffold, singleton id1 connection, exact-title-only matching with no full pagination or address check. Status means row exists, not live connection. Settings also misleadingly show legacy Blotato as current publisher. Current direct Meta uses protected global env. Replace these assumptions with business-scoped connection/health and verified target selection. Reuse existing listing/project; verify Google Cloud API quota/access approval. Do not create duplicate listing. Current Google offers were NOT read in source session; Comet CUA timed out. Use available authenticated API/UI sources during execution without assuming access.

Import paginated actual posts into separate history with provider IDs/type/dates/media/state/read-time. Review newest20 offers or all if fewer; fetch supported post insights; report content assessment separately from measurable outcomes. Old gbp-products.json is quarantined, unverified historical creative; never auto-requeue it. Primary refs: developers.google.com/my-business/content/prereqs ; /reference/rest/v4/accounts.locations.localPosts ; /reportInsights . Google OFFER ignores generic callToAction; use offer redemption fields and real dates/terms, choose standard post for non-expiring ordinary promotion rather than inventing discount/expiry.

Shared offer references catalogue facts/config/fingerprint, approved media, terms/dates and destination link; render channel-specific copy. Price text on offer image must be deterministic, no AI-rendered figures. Build reusable restrained brand template with existing image/layout tools; no paid enhancement integration.

Support GBP platform and exact target in approval; bind content/time/media/account/fact fingerprint. Separate per-platform receipts and pending provider state; uncertain outcomes held, never repeat successful Meta delivery. Batch logical creatives grouped monthly, resumable chunk preparation, stable IDs and paginated review. Replace six-ID/expiry-only runner with one canonical ongoing monitored trigger only after read-only pilot reconciliation. General existing route limit10 prior-hour due rows and list limit200 are scale limitations; implement explicit stale schedule policy (hold missed >1h with visible review, no surprise late blast) and durable idempotency. Already approved posts publish without AI calls. Monthly times are editable; no inferred new content approvals.

Minimal business separation: authorized operator business context on all social data/assets/jobs/connections, encrypted per-business credentials, backfill True Color safely and preserve existing approvals or hold affected items visibly if unavoidable. No real second client until two synthetic-business isolation tests pass. Do not expose real client data in public Git. No self-service billing/login project.

### C — Efficient catalogue-backed caption generation (GPT-6)

Own caption API, caption prompting/profile assembly, generation cache/jobs and a separate migration, CaptionRewriter and narrow generation client helper. Do not edit BatchScheduler/BatchApprovalReview/shared social types without G coordination. Own `docs/social/GENERATION-EFFICIENCY-20260906.md`. Integrate P's real facts resolver via exported types; no independently invented production price source. Wait for/cherry-pick agreed dependency rather than duplicating resolver. G owns business context; coordinate and use same authorization; temporary tests may inject facts/business context but don't ship fake production fallback.

Remove hardcoded business prices/unsupported competitor promises; retain shop-voice recipe, showcase price optional. Only selected channels generated (remove unused X generation). Send selected product facts + compact business voice + campaign + short recent-content summary. First-time photo observation and copy in one call; save useful observations. Existing images compress1024 before vision; unreadable detail triggers review, not speculative retries.

Cache by business/media hash/product-facts fingerprint/profile+prompt version/selected channels/angle. Schedule-only changes do not invalidate; price changes invalidate affected copy, not photo observations. Atomic stable generation request IDs, server resumable jobs and persistent partial success. Max2 concurrent jobs/business and max1 retry only for clearly retryable failure; ambiguous timeout held for explicit retry/reconciliation. No endless JSON-repair loops. Schema, unsupported-price/claim and platform limits checked deterministically; manual editable draft on failure. Catalog facts must remain source-bound through returned draft and approval handoff. Existing API legacy callers need an adapter or clear migration, not silent missing fields.

Record model/provider usage and available costs, show batch usage, support owner-configured ceiling; do not invent measured cost or introduce paid service commitments. Monthly/on-demand dated hashtag research candidates cached for reuse; distinguish researched evidence from generic model suggestions. No research call per post. No LLM during scheduled publication. Cache tests prove unchanged rerun0 calls, one edited item doesn't regenerate all, partial failure resume, stale fact invalidation, tenant separation, budget stop, bounded retry and no duplicate jobs. Keep OpenRouter anthopic/claude-sonnet-4-6 initially (actual identifier anthropic/claude-sonnet-4-6).

## Integration owner

A fresh GPT-6 integration task is responsible for continuing the entire approved plan until the implementable scope is complete, coordinating these tasks, updating GitHub, reviewing lane PRs, fixing cross-lane contract issues, and verifying deployment. Use send_message_to_thread/read_thread/wait_threads, not hidden assumptions. Lane tasks should push reviewed PRs and return exact branches/commits/checks/remaining gates. Integration owns merge sequencing: P first, then C/G in dependency order, production migration gates before dependent runtime. Preserve Wait for CI and use local/real SQL/browser contracts per repo rules. Do not call a local test a production verification.

The integration owner maintains docs/operations/CURRENT-STATE.md and project index, referencing lane runbooks. Include setup, interfaces, version/fingerprint behavior, migration/backfill/rollback, failure and recovery instructions. Use GPT-5.6 for bounded documentation only when useful; engineering/review mostly GPT-6. Avoid too many same-purpose audits or full tests repeated without new changes.

Completion: relevant app/SQL/browser tests and CI pass, intended files merged into GitHub, runtime deployment/readback verified; external auth or content gates listed precisely with concrete prepared next step. A first exact three-channel pilot needs actual owner-approved creative; never invent content approval from implementation authorization. No arbitrary scope shrink because context/tokens run long. Compact/handoff through these records.
