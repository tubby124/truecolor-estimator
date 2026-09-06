# Two-destination practice post — September 6, 2026

Owner requested an ELI12 readiness check, one practice post verified on both Instagram and Facebook, and Git reconciliation. Earlier checkpoints below precede the controlled live execution receipt at the end of this document.

## Fresh provider evidence

At 02:38 UTC, protected read-only Meta API verified True Color Display Printing Ltd. and linked Instagram `@truecolorprint`. Granted scopes included Instagram publishing and Page reading, but did **not** include `pages_manage_posts`. Publishing remained disabled. This missing Facebook permission is independent of application support or Git deployment.

The current application approval pilot originally allowed Instagram only. The bounded extension uses two separate drafts, each with exactly one destination, so approval fingerprints and delivery receipts stay independent. No mixed-platform fanout or automatic retry is introduced. No database migration is needed for the existing JSON approval target.

## Private rehearsal package

A private local preview shows the saved Fowlplay Decoys coroplast sign photo and proposed copy in two destination cards. Its source image bytes are unchanged. Customer photo, raw manifest, preview and private paths are outside this public repository. Three caption lengths were prepared; source facts for the optional long version come from the current coroplast SKU and $25 order-minimum implementation.

Owner approved the displayed photo and caption in chat. At 02:53:56 UTC the operator saved two fixed-ID, unapproved production drafts and verified the final JPEG hash by readback. Exact delivery-time binding and production approval remain necessary before dispatch. No image cleanup or cover text was added. The source photo's public website presence is not recorded as a new social-use grant.

## Completion sequence

1. Finish and review the one-platform Facebook approval extension; pass CI and verify deployment.
2. Complete the existing Meta publisher's missing Facebook posting permission and verify it through a fresh provider read. Keep credentials out of chat and Git.
3. Present the final JPEG, caption/hashtags and exact two destinations/time for owner approval.
4. Dispatch each approved post once. On an ambiguous result, inspect Meta before any new attempt; never retry both destinations blindly.
5. Independently read back both posts and record their public URLs. Only then state that the two-platform pilot passed.

Telegram intake, automatic category/style rotation, hosted scheduling and a Mac-asleep test are separate later milestones. This one-post rehearsal does not establish resale readiness.

Git audit: [reconciliation receipt](GIT-RECONCILIATION-20260906.md).

## Implementation and provider setup checkpoint

PR 37 merged at `3ed6862b16cb18ddfeec6787bbfe47ee14cd955c` after full CI/security passed and independent review reported no high or critical findings. The application supports separate approved Instagram and Facebook drafts.

Owner authorized adding the Meta Page use case. After an initial opaque UI error, direct UI readback showed `pages_manage_posts` as Ready for testing. A token wizard was prepared with six scopes. This is app configuration evidence, not proof that a new credential has those grants. At the owner's explicit request the new credential was saved to Railway through protected standard input. A fresh protected Meta read at 02:55:32 UTC verified `pages_manage_posts` plus all prior Instagram scopes and the intended Page/Instagram pair. Publishing remained disabled. No credential or access-bearing link is stored here.

## Deployment and draft evidence

The PR 37 code deployment `40289fa0-862a-4237-91e1-a3baa605bca3` reported SUCCESS at commit `3ed6862b16cb18ddfeec6787bbfe47ee14cd955c`. The subsequent credential-configuration deployment `03415b4b-e2a5-45b2-afa2-b6ff81589f8c` subsequently reported SUCCESS using the same commit. This was independently checked after the earlier code deployment.

Fresh readiness at 02:57:09 UTC verified 14 drafts, zero ready posts, zero posted posts, zero attempts and publishing disabled. Staff browser login is the remaining immediate blocker before authenticated production approval. No public delivery is claimed.


## Controlled execution — September 6, 2026

Fresh readiness at 04:41 UTC found 14 drafts, zero ready/posting/posted records and publishing paused. The authenticated staff browser was available. Instagram had acquired two selected platforms and an expired time since the prior checkpoint; the existing draft was corrected to Instagram only. Facebook retained its separately approved caption with hashtags. Neither creative nor image bytes were changed.

The staff editor saved both drafts for September 5 at 10:50 p.m. Regina (September 6 at 04:50 UTC). The real staff review flow recorded both approvals; database readback at 04:44 UTC confirmed staff actors, rights confirmations, destination bindings and the expected JPEG SHA256 `b358a82d6aea43d6e4c163e63e2e37859c9b92866f2b323cc4a59b068b24acc9`. Only these two posts were ready; the other 12 drafts remained untouched. No approval actor was fabricated and no approval/version check was bypassed.

A protected Meta read independently confirmed the True Color Display Printing Ltd. Page and linked `@truecolorprint`. The controlled publishing enablement deployment is `38e8c79e-2c91-42ab-a92b-be18bb5c66f2`. Delivery and pause readback are recorded below when verified. Private execution receipts remain in the authorized local practice package.


### Initial hold and repair

At 04:50:25 UTC the controlled scheduler request returned `dispatched=0, held=2`. Both drafts remained `posting`; no delivery receipts existed. Publishing was immediately disabled again. No blind retry followed.

Protected provider reconciliation at 04:54:51 UTC checked the latest 25 Instagram media and Facebook published posts. Both newest posts were from May 29 and neither list contained the pilot caption. The saved credential could derive the intended Page access token; that Page credential passed the published-post read and was securely saved without exposing it. Granted permission presence alone had not proven the token type required by Page endpoints.

A zero-row receipt upsert probe returned PostgreSQL `42P10`: production lacks a unique constraint on `(post_id, platform)`. The prior upsert could therefore discard both successful and failed provider receipts. The repair appends receipts using `insert`, retaining the existing atomic ready-to-posting claim and all approval checks. Fixed classifications now distinguish pre-provider media failure from receipt failure; attempted records remain held. No database migration or automatic retry was added. The original provider outcome cannot be reconstructed from the missing receipts; the fresh provider reconciliation establishes no published pilot at that checkpoint.
