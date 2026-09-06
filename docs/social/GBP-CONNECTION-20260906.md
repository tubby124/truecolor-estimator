# Google Business Profile connection — September 6, 2026

Connection task: `01a0783e-13aa-7a01-a41c-ec9f52d99e9d`. This is the sanitized browser/setup receipt for the Google part of the [larger pricing and social integration](INTEGRATION-20260906.md). The [Google runbook](GOOGLE-THREE-CHANNEL-20260906.md) governs listing discovery and history import. Integration retains production migration, shared release and scheduler ownership.

## Verified setup and remaining gates

- Existing Google Cloud project `teak-citadel-446600-s7` (GooglemybusinessTrueColor) and existing True Color GBP Publisher OAuth client reused. Browser readback verified the exact callback `https://truecolorprinting.ca/api/staff/social/gbp/oauth/callback`. No new project or listing was created.
- At approximately 19:45 UTC, Account Management API was enabled with Requests per minute quota **0**. Business Information and Google My Business localPosts APIs were absent from the complete 22-enabled-API list. Google documents quota 0 as not approved and 300 as approved: [official prerequisites](https://developers.google.com/my-business/content/prereqs).
- Owner subsequently reported submitting the Google API support application. Submission is owner-reported, not an observed approval or restored quota.
- Owner created and supplied a new secret for the existing client and explicitly authorized storage. It was saved to `GOOGLE_GBP_CLIENT_SECRET` in the existing Railway `truecolor-estimator` production service through stdin. Protected readback confirmed client ID and secret present, exact callback, and valid 64-hex token-encryption key. No credential value is retained in this record.
- Configuration deployment `097e6db1-3a0a-4b32-a4ec-a535c7f62db6`, created 19:48:50 UTC, was **BUILDING** at this receipt. This is not successful deployment or OAuth verification.
- Fresh authenticated Social Studio settings still showed “Business-scoped Google setup awaits migration activation”; history import was disabled. Integration reports the exact production migration package remains unapproved/unapplied. This task did not apply SQL or activate feature flags.
- No Google consent, live listing connection, refresh verification, history import or new post publication completed in this task.

## Completion order

1. Integration finishes its final release/CI work and obtains approval for the [exact production migration package](MIGRATION-RELEASE-20260906.md), then verifies schema and owner membership before feature activation.
2. Verify successful deployment containing the saved Google configuration.
3. After Google approves the existing project, verify nonzero approved quota and enable the required APIs. Do not equate application submission with approval.
4. Owner completes OAuth consent. Verify the existing True Color listing's exact title/address/account/location and refresh capability; do not create or substitute a listing.
5. Import actual paginated Google history and review the newest 20 offers, or all if fewer. Imported history is not queued content.

No new posts are authorized. Any later three-channel creative and schedule require separate exact owner approval. The existing approved Meta batch and its runner belong to integration and must remain independent of this Google connection work.
