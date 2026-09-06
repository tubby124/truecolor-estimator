# Current work state

Updated 2026-09-06. This is the canonical shared work board. Imported operational observations are explicitly dated reports; this migration does not certify live account state. Refresh the relevant system before a mutation.

| Lane / owner | Latest evidence and status | Next action / gate |
|---|---|---|
| Social / G1 automation task | Sep 6: real staff approvals and verified Facebook/Instagram pilot delivery completed; two posted, 12 legacy drafts untouched. [Live links and repair receipts](../social/PRACTICE-POST-20260906.md#successful-two-platform-delivery--september-6-2026). | Publishing pause verified by hosted readback at 05:18 UTC. Sunday three-photo/six-delivery batch confirmed for 09:00, 13:00 and 19:00 Regina. Six exact delivery approvals saved; VPS timer active and hosted publishing enabled with held=false at06:10UTC. Telegram connection acknowledged. Timed delivery and devices-off proof remain pending. [Sunday receipt](../social/SUNDAY-BATCH-20260906.md). [Rebuild guide and product plan](../social/REBUILD-AND-SCHEDULING.md). |
| Merchant commerce / commerce task | Private Sep 5 readback reports 18 primary offers and 18 matched local rows. The two business-card image retries, product-page/pickup-later reviews and inventory validation remain open. | Highest-priority Google-growth lane. Read Google review state; retain 25 legacy manual products until replacement approval/serving evidence. Do not widen to Ads or invented shipping. |
| Organic / SEO experiment task | Wall Graphics observation active; Foamboard proposal prepared, not released. Repo `seo-prep/2026-09-04-foamboard-strengthening.md` carries gate. | Earliest reconsideration Sep 9 only after seven finalized post-release days and current release/GSC evidence; no automatic release at that date. |
| Paid Ads / paid-search task | Aug 29 private override says all three campaigns paused; older Aug 27 operating-state says enabled and is superseded. Cap/enforcement and promotion evidence remain unresolved. | Live read-only campaign/cap check before any action. Do not resume or change spend as part of migration. |
| Analytics / payment audit task | Implementation is in main at base commit 8f8d4fa (PR #29). Runbooks retain local verification language; merge proves inclusion, not production delivery. | Verify deployment separately as needed; genuine new browser-order attribution and durable GA4 retry remain open. Do not replay historical purchases or invent browser IDs. |
| Social / Instagram pilot | Sep 6 01:40 UTC: Meta provider verified intended Page and @truecolorprint plus all five requested scopes. Token and verified target configured in Railway; publishing paused. [Setup receipts](../social/SETUP-RUNBOOK.md). | Final configuration deployment succeeded; exact cleared JPEG/content/date approval and hosted/public/Mac-asleep delivery proofs remain separate. |
| Platform / application task | Existing hardening runbook plus current source code govern. Prior Sep 4 private receipt reported platform deployment; migration has not refreshed runtime. | Keep health output opaque; preserve auth/signatures, payment token privacy and proxy contracts. |
| Directories and GBP / directory campaign | Sep 5 06:44 CST receipt reports MapQuest/ShopSaskatoon/Mysask411 submitted, current Canpages/Apple/Yelp/Bing records, and all 15 holiday closures accepted in owner view (not future-date public proof). [Pipeline](GROWTH-PIPELINE.json). | Campaign owns submissions, address fixes and holiday updates. Historical CAPTCHA forms must be recovered; do not resubmit pending requests. Local sessions do not reach Cloud. |
| Social / asset library task | Private collection and staff asset browser prepared; exact collection/storage/deployment receipts in [asset library](../social/ASSET-LIBRARY.md). Portable plan includes Telegram intake, content rotation and later owner-authorized automation. | No public post or auto-post policy enabled. Verify hosted deployment and storage receipts; implement the scoped draft bridge and one approved pilot before resale claims. |
| Earned links / backlink task | Five inquiries sent from public business mailbox, each read back in Sent on Sep 5. No response/delivery/link acquisition asserted. | Await replies. No automatic follow-up scheduled. Record published URL only after direct page verification. |

## Merchant truth constraints and deferred offers

Custom printing is made after payment and artwork approval. Primary online availability and finished shelf stock are different facts. Retain the existing conservative store pickup-later representation until the business can guarantee the required order-placement SLA. Rush is conditional, not universal availability.

Deferred: sticker product identity mismatch; boat-decals image-rights record; missing Deluxe banner photo; coroplast engine/checkout floor mismatch; rack-card dedicated image; booklet demand evidence; custom-shape price/image truth. Do not emit aliases as fake products or turn services/rush into Merchant goods. Refer to existing commerce runbooks and current source data before revising any offer.

## Historical context added September 5

The [project index](../TRUE-COLOR-INDEX.md) now links product/pricing, operations and growth history guides, preserving useful decisions and incident lessons. They distinguish existing code from dated proposals and live evidence. The press-console application is a separate project; its implementation was not migrated here. A code-confirmed future portability task is `scripts/build-gbp-upload.py` using macOS `sips`; Cloud asset generation requires a bounded Linux-compatible solution before use. This context pass changed no pricing, customer workflow or provider state.

## Next Cloud task

Read this board and the referenced lane document, then produce or implement a bounded task with proportionate checks. When an action needs authenticated private-system evidence, return a precise request to the operational session and consume only its sanitized dated receipt. Do not mark an observation waiting on Google as complete from an HTTP-200 page or valid XML alone.


## Social library deployment — September 6, 2026

PR #35 merged at `861030663d07565e3cc0045b5612b2c425b63730`; Railway deployment reported SUCCESS. [Library receipt](../social/ASSET-LIBRARY.md#deployment-receipt--september-6-2026) records verified private originals/catalog and signed-read hash, denied anonymous storage read, and matching private Drive archive checksum. Anonymous library API returned 401; staff UI redirected to login. Authenticated production browsing remains unverified. Readiness at approximately 02:30 UTC still showed 12 drafts and publishing false. Telegram intake, rotation enforcement, scheduled posting and Mac-asleep delivery remain later gates.


## Two-destination practice and Git reconciliation — September 6

Owner requested a real Instagram/Facebook practice plus branch reconciliation. [Practice receipt](../social/PRACTICE-POST-20260906.md) records the approved photo/copy and fresh missing Facebook permission. The bounded application extension allows one platform per draft, with independent approvals and delivery receipts. PR 37 merged after CI/security and independent review; its code deployment succeeded. Meta read at 02:55:32 UTC verified the newly saved credential grants including Facebook posting and Instagram scopes. The credential-configuration deployment also succeeded. Readiness at 02:57:09 UTC verified 14 drafts, zero ready/posted posts and attempts, with publishing disabled. Two unapproved drafts and the JPEG hash were saved/read back; staff browser login is the immediate blocker before production approval. Actual delivery remains pending. [Git audit](../social/GIT-RECONCILIATION-20260906.md) confirms recent social PRs32–36 merged and canonical local main fast-forwarded; old dirty worktrees remain preserved for targeted review. Legacy conflicting SEO PR 9 was closed as superseded, retaining branch/history. No blanket old-branch merge or deletion.


## Practice execution repair — September 6, 2026

The two authorized posts received real staff approvals, but the 04:50 UTC dispatch held both with no receipts. Publishing was disabled again. Protected provider readback found neither pilot published. A production receipt schema mismatch was reproduced with a zero-row probe; the narrow fix uses append-only receipt inserts under the existing CAS claim and preserves manual holds. The correct derived Page credential was verified and saved. [Practice evidence](../social/PRACTICE-POST-20260906.md#initial-hold-and-repair) records verification and remaining delivery gate. No automatic retry, Telegram or Mac-asleep proof is claimed.


At 05:05 UTC the repaired pipeline published the approved Facebook pilot with exact-caption Meta readback. Instagram's saved failure identified an unsupported container-status field; a narrow correction is being verified. Facebook must not be retried. [Latest practice receipt](../social/PRACTICE-POST-20260906.md#facebook-published-instagram-status-field-repair).


## Two-platform pilot completed — September 6, 2026

[Facebook](https://www.facebook.com/310364742156669_122234778494295517) and [Instagram](https://www.instagram.com/p/Dc7w50rkU41/) are live with independently verified exact captions and visually confirmed Fowlplay photo. Both app records are posted; Facebook was published once, Instagram failures were manually reconciled before its one successful publication, and the failed receipt remains preserved. PRs 39 and 40 fixed receipt persistence and the unsupported Instagram container-status field. Publishing was set back to false immediately afterward. [Final receipt](../social/PRACTICE-POST-20260906.md#successful-two-platform-delivery--september-6-2026) supersedes earlier pending-delivery checkpoints in this file. No unattended scheduler or Mac-asleep claim.

Final hosted readback at 05:18:45 UTC confirmed `Publishing is paused`; readiness showed 12 drafts, zero ready/posting and two posted. Exactly one matching pilot per platform was found in fresh provider lists.

## Inquiry automation audit — September 6, 2026

[Scope correction](../lead-automation/INQUIRY-PLAN-20260906.md): owner clarified that True Color is wholly separate from realtor CRM/cold-lead reactivation. Realtor Smart Plans belong in tubby124/dripemtilltheydie. Printing observations retained; no combined implementation, new printing campaign, customer send or runtime change.
