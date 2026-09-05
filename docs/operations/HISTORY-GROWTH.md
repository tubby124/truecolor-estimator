# Growth history and investigation navigator

Reviewed 2026-09-05. This summarizes useful decisions from the private April–August SEO, paid-search, attribution and campaign archive. It is a navigator, not a new live queue. [Current state](CURRENT-STATE.md) and the [SEO standard](SEO-STANDARD.md) override historical launch dates, account settings, ranking claims and wave recipes. Referenced repository files were located during this review; their presence does not establish deployment or provider state.

## Why the growth strategy changed

April and May work emphasized metadata recovery, structured entities, image completeness and new location pages. July’s strategy reset stopped city expansion and shifted toward existing commercial demand. August added source-separated conversion evidence; the August 31 owner decision made Merchant commerce the highest-priority Google-growth lane. Preserve that progression so an old “next wave” prompt does not restart mass page creation.

The April targeting map supplies useful intent boundaries: wall graphics concern wall applications, window decals concern windows; flat flyers differ from folded brochures; industry pages should answer an industry use case without taking over their parent product term. The May decision distinguished rigid event signs from vinyl event banners and retained decals-only vehicle positioning. These are historical business/intent decisions to reconcile against present offerings and finalized query data before editing. They do not authorize restoring removed routes or expanding services.

The August product preflights identified Large Format as a category-intent investigation with AI-referral evidence, Foamboard as a conversion-path opportunity, and Graphic Design as a service-scope accuracy question. Their old measurements are not carried forward as current performance. Use the named current Foamboard gate and Merchant priorities before selecting another experiment.

## Organic regression lessons and measurement plumbing

The May recovery archive reports simultaneous changes to protected pages, stale protection records and interrupted ingestion. It also records schema defects that were invisible in a normal page screenshot. Do not infer the old narrative proves a single cause for a ranking change. The durable lesson is to isolate changes and verify the actual rendered source, entity references, canonicals, links and image responses alongside finalized performance data.

Before modifying shared entity schema, inspect existing declarations and references in `src/app/layout.tsx`, about/contact pages and the affected template. Check identity consistency without importing old ratings or treating structured data as a promise of review stars. Existing defenses are [the historical wave audit](../../scripts/seo-wave-audit.mjs), `scripts/hooks/seo-wave-guard.mjs`, and [the SEO sprint log](../../memory/seo-sprints.md). Cloud does not automatically execute local editor hooks; the current release process must run appropriate checks explicitly.

[GSC setup](../gsc-integration-setup.md), `src/lib/seo/gsc-client.ts` and `src/lib/seo/ga4-client.ts` already provide implementation starting points. The May account-access incident is an account-specific historical failure, not a universal claim that service accounts cannot work. Refresh the actual authorization, latest successful ingestion, pagination and complete reporting dates before interpreting a zero. Old indexing-submission checkboxes neither prove present indexation nor create a fresh submission queue.

## Paid routing and attribution: preserve the evidence chain

Use the existing [paid-search operating plan](../paid-search/revenue-growth-operating-plan.md), [copy learning log](../paid-search/COPY-LEARNING-LOG.md), [quote attribution repair](../plans/2026-08-15-google-ads-quote-attribution-repair.md) and [quote conversion runbook](../paid-search/quote-lead-conversion-runbook.md). Their dated snapshots still require reconciliation with current state: the August 29 all-campaigns-paused override takes precedence over earlier enabled-pilot observations or launch proposals.

The July routing decision sends explicit product intent to its matching configurator. Ambiguous competitor-brand intent uses a lightweight paid-only chooser, not a comparison article or a page containing many full configurators. August investigations distinguish the static price-guide landing page from calculators visited later in the same session. Session-attributed `price_calculated` events do not mean the landing page itself contains a calculator.

Keep four separate questions:

- Ads shows paid delivery and the platform’s credited outcomes.
- GA4 shows session/event behavior with reporting lag and test-traffic exclusions.
- First-party order and quote records establish captured acquisition evidence and commercial outcomes.
- GSC shows organic discovery; it does not identify an individual purchaser.

A successful conversion-outbox upload does not by itself establish Ads UI credit, profitability or complete revenue coverage. A telephone click is not a qualified call. Staff-reported source is useful but must not fabricate a Google click identifier. Keep unknown route/source coverage visible, preserve valid quote-to-order attribution, and avoid retroactively relabeling unattributable historical orders.

The August 25 handoff leaves website forwarding-number provisioning and a real attributable call as an external-evidence dependency. Recheck current provider configuration before treating that old gap as still open; an actual paid-click/call test requires separate spending authorization. For purchase delivery, the September [analytics audit](../analytics/AUDIT-FOLLOWTHROUGH-20260904.md) and [repair runbook](../analytics/GA4-PURCHASE-REPAIR-20260904.md) supersede earlier implementation claims.

## GBP and social: a prepared package is not a publisher

May established separate content shapes for GBP and other social platforms: `src/lib/data/gbp-products.json`, `src/lib/data/social-schedule.json`, `scripts/build-gbp-upload.py` and `scripts/build-social-schedule.py`. Reuse those sources and generators instead of copying old captions, dates or price anchors. Historical scheduled-post statements do not prove those posts remain scheduled or published today. Recheck image rights, truthful product claims and platform-appropriate crops for new work.

The August GBP handoff distinguishes manual owner access from API allowlisting, OAuth connection and an authenticated publisher. An owner-visible profile can work while the app connection remains incomplete. Resume by checking the current app code and authorized provider state, then require correct-location readback, explicit publishing authorization, idempotency and visible failure handling.

**Code-confirmed portability gap:** `scripts/build-gbp-upload.py` still calls macOS `sips` for image conversion. A Linux Cloud environment cannot be assumed to generate those upload assets successfully. A future bounded fix should preserve originals, use an available compatible converter and report missing tooling clearly. No generator or provider configuration changed in this history migration.

## Campaign history and suppression

The May rebuild evolved from a broad automated-drip proposal into provider-scheduled marketing campaigns; later niche waves already have [a repository runbook](../campaigns/DRIP-CAMPAIGN-RUNBOOK.md). [Business context](BUSINESS-CONTEXT.md) owns the current channel distinction and review-request architecture. Do not infer a local watcher sends campaigns, or that an API acceptance response proves complete delivery.

The May cleanup incident showed why a mailbox label alone cannot stop another sender. Review `src/lib/blitz/process-replies.ts` and the current suppression path before launching a cohort. Opt-outs and warm replies have different follow-up handling, but both must stop inappropriate cold sequences across active sending systems. Old campaign IDs, lead rosters, open-rate scoreboards and provider limits stay private and dated. A new wave needs current audience overlap, suppression and schedule checks; historical successful copy is research material, not authorization to resend.
