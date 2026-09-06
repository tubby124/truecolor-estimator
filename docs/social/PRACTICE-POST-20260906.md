# Two-destination practice post — September 6, 2026

Owner requested an ELI12 readiness check, one practice post verified on both Instagram and Facebook, and Git reconciliation. No public delivery has occurred in this checkpoint.

## Fresh provider evidence

At 02:38 UTC, protected read-only Meta API verified True Color Display Printing Ltd. and linked Instagram `@truecolorprint`. Granted scopes included Instagram publishing and Page reading, but did **not** include `pages_manage_posts`. Publishing remained disabled. This missing Facebook permission is independent of application support or Git deployment.

The current application approval pilot originally allowed Instagram only. The bounded extension uses two separate drafts, each with exactly one destination, so approval fingerprints and delivery receipts stay independent. No mixed-platform fanout or automatic retry is introduced. No database migration is needed for the existing JSON approval target.

## Private rehearsal package

A private local preview shows the saved Fowlplay Decoys coroplast sign photo and proposed copy in two destination cards. Its source image bytes are unchanged. Customer photo, raw manifest, preview and private paths are outside this public repository. Three caption lengths were prepared; source facts for the optional long version come from the current coroplast SKU and $25 order-minimum implementation.

This is a visual rehearsal, not a saved/approved production post. Owner approved the displayed photo and caption in chat. Final validated JPEG and exact delivery-time binding remain necessary before dispatch. No image cleanup or cover text was added. The source photo's public website presence is not recorded as a new social-use grant.

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

Owner authorized adding the Meta Page use case. After an initial opaque UI error, direct UI readback showed `pages_manage_posts` as Ready for testing. A token wizard was prepared with six scopes. This is app configuration evidence, not proof that a new credential has those grants. Owner credential handoff and saving the resulting credential to Railway remain pending, followed by a fresh protected provider read. No credential or access-bearing link is stored here.
