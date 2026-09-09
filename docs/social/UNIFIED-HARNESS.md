# Unified social harness — September 9, 2026

## Owner direction and milestone

One reusable system prepares daily customer-work gallery posts and additional creative content, presents the exact finished posts for owner review, then uses the existing approval and publishing workflow. Preserve the already approved September batch. Future logo/background treatment is versioned and reviewed before scheduling; it does not alter approved media retroactively. Finish the separate image-library work in its existing task.

Sales/revenue attribution is explicitly outside this milestone and must not block completion. Learn from delivery reliability, owner feedback and available post engagement instead. A year of content is the later target after the workflow is proven; no annual schedule is authorized or implemented by this document.

Current deliverable: source-audited implementation contract and private hypothetical week/year preview. Owner approved the preview mix on September 9: daily cleared customer work plus three additional creative posts per week. The visual direction and top-right logo treatment are accepted. This approves the planning baseline, not unidentified future media/accounts/times or a queued schedule. Customer slots remain placeholders until real cleared sources are selected. Three saved illustrative assets demonstrate showcase, helpful-tip and use-case captions. Existing six-format proof remains separately available to the owner. Preview approval is distinct from approval of exact publishable media/accounts/times.

## Use the existing control room

Retain authenticated `/staff/social/library`, `/staff/social/monthly`, `/staff/social/review`, `/staff/social/calendar` and `/staff/social/queue`. No new public marketing pages are necessary. The harness prepares packages for these pages; it must not create a second queue or scheduler. Other businesses can use the same process with their own business configuration and access boundaries.

Source audit at `55fd001e` confirms these seams:

| Responsibility | Existing seam | Work required |
| --- | --- | --- |
| Monthly package | `src/lib/social/monthly-plan.ts`; `MonthlyPlanImport.tsx`; `MonthlyBatchScheduler.tsx` | Remove fixed True Color naming/timezone assumptions through a versioned compatible contract. Existing cap is 31 creatives: combined daily plus additional content exceeds it. Preserve old package parsing and approvals. |
| Planning | `weekly-plan.ts`; `WeeklyPlanner.tsx` | Shared source/recipe history and reservation across both streams; annual planning and bounded release windows. |
| Review | `BatchApprovalReview.tsx`; `PostPreview.tsx` | Show both streams, source type, final rendition, channel copy, account, date/time and timezone. |
| Approval | `src/lib/social/approval.ts`; post approval API | Keep exact media/copy/account/schedule binding and edit invalidation. A visual preference does not authorize dispatch. |
| Calendar and queue | `CalendarGrid.tsx`; `PostQueueTable.tsx`; `social_posts` | Add explicit content lane and recipe/source lineage. Existing intake `source` is not a substitute for documentary vs illustrative classification. |
| Branding | `scripts/social/brand-media.mjs`; `brand-media.node.mjs` | Connect versioned logo variants and placement consistently during preparation. Preserve original/source/logo/output hashes. Never apply a new watermark at dispatch. |
| Caption generation | `generation/prompt.ts`; `generation/business-profile.ts` | Inject business facts/voice rather than hardcoded `TRUE_COLOR_BUSINESS_PROFILE`. Select purpose before copy. |
| Delivery | `publisher.ts`; `meta.ts`; `scripts/social/vps-scheduler.py` | Enroll newly approved packages through existing contracts. One scheduler, receipt reconciliation and duplicate protection. |
| Learning | `MonthlyBatchProgress.tsx`; `social_post_results`; `vps-monitor.py`; `campaign-scorecard.py` | Existing delivery evidence and manual scorecard are available. Automated engagement collection is still absent in audited social code. |

Paths without a prefix above refer to the existing social component/library areas. This audit is source evidence, not a fresh production queue or provider readback. The dated September plan includes real work and concepts; do not rewrite its history as exclusively customer work.

## Reusable configuration and two content streams

Business configuration supplies identity, timezone, allowed accounts, logo variants, verified facts, voice, recipes and cadence. Credentials remain protected and scoped independently. Asset records retain private originals, source type, rights status, hashes, renditions and permitted business. Do not copy customer artwork, raw job facts or private previews into this public repository.

Customer-work stream: select actual cleared job media, preserve depicted artwork, compose only from supported job facts. Never fill an empty customer slot with a generated scene. If supply is insufficient, leave the slot pending and request more media. Owner's requested baseline is daily customer work; future exact batches still require review.

Creative stream: select a product and purpose, then a reviewed recipe/source. Mix showcases, practical tips, use cases and occasional offers. Price and CTA are required for an offer, not every social post. Keep provenance internal unless a public clarification is needed to prevent a specific misconception. Never describe a concept as a completed customer job. Review channel-appropriate hashtags without claims of guaranteed reach.

Both streams share history, near-duplicate groups, slot reservations and category/scene/caption-opening checks. Scheduled and pending material counts toward variety. Reserve before generating to avoid collisions. The accepted True Color cadence is not a permanent cross-business rule.

For offers only, bind current exact configuration and price evidence; recheck before approval and dispatch, holding changed packages for renewed review. Showcase and tip preparation can proceed without sales attribution or unnecessary price copy.

## Learning without sales attribution

1. Delivery observations: expected vs actual time, exact provider ID/link, errors, reconciliation and duplicate status.
2. Owner feedback: accepted/rejected image, crop, logo and caption with the reason and recipe/version. Taste evidence is separate from audience behavior.
3. Audience observations: available reach/impressions, reactions, comments, saves/shares and clicks, each with channel, post ID, collection time and metric definition. Missing/unsupported metrics remain null, not zero. Availability depends on provider permissions and must be verified during implementation.
4. Compare like-for-like observation windows and record sample size. Propose a future change supported by the evidence; do not silently alter approved posts or promote one successful sample into a universal rule.

## Build order and acceptance

1. Finish image-library acceptance in its current task; import accepted asset/recipe manifests without regenerating approved sources. Inventory completion does not prove social rendition approval.
2. DONE for direction: owner accepted the combined preview, cadence and top-right logos on September 9. Final monthly image/caption/account/time packages remain for review.
3. Implement compatible package/configuration and shared planning changes. Prove a 31-day month with daily real work plus additional creatives, with no conflicting reserved timestamps or duplicate creative/destination enrollment, while allowing intentional multiple posts per date/account and avoiding accidental doubling from FB/IG destinations.
4. Connect final rendering and copy to existing review/approval. Test: real customer photo, illustrative product showcase, useful tip, freshly validated offer, and a second fictional business with a different brand/timezone. Test cross-business access denial and same-asset/caption reuse detection. Keep fictional acceptance data clearly synthetic.
5. After exact owner approval, stage and deliver one bounded pilot through the existing queue; verify provider result and notification, including uncertain-result reconciliation. Do not modify September approvals or create another scheduler.
6. Add the engagement observer and demonstrate one exact post's available metrics or an honest unsupported/permission result. Keep approved content immutable.
7. Run the workflow for a review period, then expand to annual planning/scheduling. The present importer cannot ingest 365 days. Build bounded, resumable enrollment, inventory sufficiency checks, future freshness/expiry holds and cancellation before claiming year-scale operation. Monthly release windows are the recommended default; a literal year of scheduled posts needs explicit implementation and acceptance, not a calendar mockup.

## Completion evidence

A preview is not runtime integration. Required final receipts: reviewed assets; accepted mixed-calendar package; versioned business config; exact approval invalidation; one queue with both streams; verified delivery; feedback/engagement observation; second-business isolation proof. Sales measurement is excluded. Preserve status distinctions: proposed, prepared, reviewed, approved, scheduled, provider-delivered and independently verified.


## Monthly review and fact rotation — accepted September 9

The owner wants a twelve-month direction with a rolling monthly release: prepare the next month, show finished images and captions, incorporate feedback, then approve that month. Preserve the ability to change recipes and architecture for future drafts without changing already approved packages. No recurring wakeup or autonomous monthly approval is configured by this record.

A fact bank already exists in `src/lib/social/generation/business-profile.ts`: onsite designer, standard online ordering, conditional rush enquiry and production-start conditions, with source/status fields. Extend this source instead of introducing a conflicting copy of business facts. Prices come from the maintained pricing/configuration adapter, not evergreen prose. The current profile still contains an older four-concept/three-real-work weekly mix; future runtime integration must explicitly replace that default with the accepted two-stream plan while retaining September packages.

For each caption select zero or one relevant supporting fact after the product message: online ordering, artwork help, a useful verified product fact, or an exact current price. Rotate across recent and scheduled posts. Do not force a price or CTA into every post. Price mentions require a complete current configuration and tax/exclusion terms; designer availability alone does not establish a fee or proof deadline. Record fact IDs and version with each draft so corrections can invalidate affected drafts.

Examples for future copy review:
- Window showcase + ordering: “We print window decals with your logo, business hours or custom artwork. Order standard window decals online.”
- Business cards + service: “Need help putting your business card artwork together? An onsite graphic designer is available at True Color.”
- Product showcase alone remains acceptable between service/offer messages.

Annual theme outline: [rolling year plan](YEAR-DIRECTION.md). Themes are planning suggestions; monthly review chooses exact products, scenes and copy. Holiday-related content does not establish business closures, customer vacations, discounts or production deadlines.
