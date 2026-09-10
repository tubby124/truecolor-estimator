# Unified social harness — September 9, 2026

> September 9 owner clarification: preserve the already-running September AM creative campaign exactly; add one daily PM creative at 19:00 America/Regina. This supersedes the older three-extra-per-week cadence and customer-only AM assumption below. [Current evening execution plan](EVENING-LAUNCH-20260909.md).

## Owner direction and milestone

One reusable system prepares reviewed customer-work or illustrative creative content, then uses the existing approval and publishing workflow. Current cadence preserves the existing mixed September AM campaign and adds one daily 19:00 Regina creative. Preserve the already approved September batch. Future logo/background treatment is versioned and reviewed before scheduling; it does not alter approved media retroactively. Finish the separate image-library work in its existing task.

Sales/revenue attribution is explicitly outside this milestone and must not block completion. Learn from delivery reliability, owner feedback and available post engagement instead. Owner cancelled the one-year content objective on September 9. No annual generation, year-plan expansion or annual scheduling remains in active scope. Focus on a small end-to-end learning cycle and bounded next-batch planning.

Historical preview milestone: a source-audited contract and hypothetical week/year preview proposed daily cleared customer work plus three additional creative posts per week. The later [daily evening plan](EVENING-LAUNCH-20260909.md) supersedes that cadence and owns current prepared/execution state. The visual direction and top-right logo treatment are accepted. This approves the planning baseline, not unidentified future media/accounts/times or a queued schedule. Customer slots remain placeholders until real cleared sources are selected. Three saved illustrative assets demonstrate showcase, helpful-tip and use-case captions. Existing six-format proof remains separately available to the owner. Preview approval is distinct from approval of exact publishable media/accounts/times.

## Use the existing control room

Retain authenticated `/staff/social/library`, `/staff/social/monthly`, `/staff/social/review`, `/staff/social/calendar` and `/staff/social/queue`. No new public marketing pages are necessary. The harness prepares packages for these pages; it must not create a second queue or scheduler. Other businesses can use the same process with their own business configuration and access boundaries.

Historical source audit at `55fd001e` identified these seams. Its original work items are not a current gap inventory: later [connected preparation](CONNECTED-PREPARATION.md), [batch bridge](HARNESS-BATCH-BRIDGE.md), [learning loop](LEARNING-LOOP.md) and [evening plan](EVENING-LAUNCH-20260909.md) record implementation and remaining work:

| Responsibility | Existing seam | Work required |
| --- | --- | --- |
| Monthly package | `src/lib/social/monthly-plan.ts`; `MonthlyPlanImport.tsx`; `MonthlyBatchScheduler.tsx` | Remove fixed True Color naming/timezone assumptions through a versioned compatible contract. Existing cap is 31 creatives: combined daily plus additional content exceeds it. Preserve old package parsing and approvals. |
| Planning | `weekly-plan.ts`; `WeeklyPlanner.tsx` | Shared source/recipe history and reservation across both streams; bounded next-batch preparation only. |
| Review | `BatchApprovalReview.tsx`; `PostPreview.tsx` | Show both streams, source type, final rendition, channel copy, account, date/time and timezone. |
| Approval | `src/lib/social/approval.ts`; post approval API | Keep exact media/copy/account/schedule binding and edit invalidation. A visual preference does not authorize dispatch. |
| Calendar and queue | `CalendarGrid.tsx`; `PostQueueTable.tsx`; `social_posts` | Add explicit content lane and recipe/source lineage. Existing intake `source` is not a substitute for documentary vs illustrative classification. |
| Branding | `scripts/social/brand-media.mjs`; `brand-media.node.mjs` | Connect versioned logo variants and placement consistently during preparation. Preserve original/source/logo/output hashes. Never apply a new watermark at dispatch. |
| Caption generation | `generation/prompt.ts`; `generation/business-profile.ts` | Inject business facts/voice rather than hardcoded `TRUE_COLOR_BUSINESS_PROFILE`. Select purpose before copy. |
| Delivery | `publisher.ts`; `meta.ts`; `scripts/social/vps-scheduler.py` | Enroll newly approved packages through existing contracts. One scheduler, receipt reconciliation and duplicate protection. |
| Learning | `MonthlyBatchProgress.tsx`; `social_post_results`; `vps-monitor.py`; `campaign-scorecard.py` | Existing delivery evidence and manual scorecard are available. The later bounded `meta_engagement.py` collector has a dated exact Instagram proof; collection/ingestion remain operator-invoked, not a hosted recurring observer. See [learning loop](LEARNING-LOOP.md). |

Paths without a prefix above refer to the existing social component/library areas. This audit is source evidence, not a fresh production queue or provider readback. The dated September plan includes real work and concepts; do not rewrite its history as exclusively customer work.

## Reusable configuration and two content streams

Business configuration supplies identity, timezone, allowed accounts, logo variants, verified facts, voice, recipes and cadence. Credentials remain protected and scoped independently. Asset records retain private originals, source type, rights status, hashes, renditions and permitted business. Do not copy customer artwork, raw job facts or private previews into this public repository.

Customer-work stream: select actual cleared job media, preserve depicted artwork, compose only from supported job facts. Never fill an empty customer slot with a generated scene. If supply is insufficient, leave the slot pending and request more media. This describes a source category, not a mandatory daily customer slot or the existing AM mix; exact batches still require review.

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
2. DONE for direction: owner accepted the preview direction and top-right logos on September 9; current cadence follows the later daily evening clarification. Final monthly image/caption/account/time packages remain for review.
3. Implement compatible package/configuration and shared planning changes. Prove intentional AM and PM creatives per day with either cleared source category, with no conflicting reserved timestamps or duplicate creative/destination enrollment, while allowing intentional multiple posts per date/account and avoiding accidental doubling from FB/IG destinations.
4. Connect final rendering and copy to existing review/approval. Test: real customer photo, illustrative product showcase, useful tip, freshly validated offer, and a second fictional business with a different brand/timezone. Test cross-business access denial and same-asset/caption reuse detection. Keep fictional acceptance data clearly synthetic.
5. After exact owner approval, stage and deliver one bounded pilot through the existing queue; verify provider result and notification, including uncertain-result reconciliation. Do not modify September approvals or create another scheduler.
6. Reuse the bounded engagement collector and demonstrate the PM post's available metrics or an honest unsupported/permission result. Hosted recurring collection remains a separate gap. Keep approved content immutable.
7. Complete one bounded learning cycle, inspect the actual evidence and prepare only the next agreed batch. Annual planning/generation/scheduling is cancelled. Preserve inventory checks, exact approval and duplicate protection at the chosen batch size.

## Completion evidence

A preview is not runtime integration. Required final receipts: reviewed assets; accepted mixed-calendar package; versioned business config; exact approval invalidation; one queue with both streams; verified delivery; feedback/engagement observation; second-business isolation proof. Sales measurement is excluded. Preserve status distinctions: proposed, prepared, reviewed, approved, scheduled, provider-delivered and independently verified.


## Monthly review and fact rotation — accepted September 9

The owner cancelled the twelve-month objective. Retain a bounded review cycle: prepare the next agreed batch, show finished images and captions, incorporate feedback, then approve that exact batch. Preserve the ability to change recipes and architecture for future drafts without changing already approved packages. No recurring wakeup or autonomous monthly approval is configured by this record.

A fact bank already exists in `src/lib/social/generation/business-profile.ts`: onsite designer, standard online ordering, conditional rush enquiry and production-start conditions, with source/status fields. Extend this source instead of introducing a conflicting copy of business facts. Prices come from the maintained pricing/configuration adapter, not evergreen prose. The current profile still contains an older four-concept/three-real-work weekly mix; future runtime integration must explicitly replace that default with the accepted two-stream plan while retaining September packages.

For each caption select zero or one relevant supporting fact after the product message: online ordering, artwork help, a useful verified product fact, or an exact current price. Rotate across recent and scheduled posts. Do not force a price or CTA into every post. Price mentions require a complete current configuration and tax/exclusion terms; designer availability alone does not establish a fee or proof deadline. Record fact IDs and version with each draft so corrections can invalidate affected drafts.

Examples for future copy review:
- Window showcase + ordering: “We print window decals with your logo, business hours or custom artwork. Order standard window decals online.”
- Business cards + service: “Need help putting your business card artwork together? An onsite graphic designer is available at True Color.”
- Product showcase alone remains acceptable between service/offer messages.

Historical cancelled outline: [former year plan](YEAR-DIRECTION.md). Do not expand or execute it. Bounded next-batch review chooses exact products, scenes and copy. Holiday-related content does not establish business closures, customer vacations, discounts or production deadlines.
