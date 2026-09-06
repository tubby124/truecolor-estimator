# Reusable media library

September 6, 2026. Operational collection and private review milestone. No publication or channel-rights grant is implied.

## Where things belong

- Private Drive: `True Color Instagram / Reusable Asset Library`, containing dated portable archive snapshots and an index. Private folder IDs and file receipts stay in operator state, not this public repository. Existing sharing is preserved.
- Private Supabase `social-library`: working originals and catalog for the hosted staff library. Original keys use SHA-256; unchanged bytes are reused. Catalog snapshots preserve prior versions.
- `/staff/social/library`: searchable staff-only browser with expiring image previews, category/source filters, source notes, stable IDs, and held/review-required labels.
- Git: implementation, contracts, instructions and sanitized receipts. Neither credentials nor raw manifests, client photo archives, signed preview links or private folder IDs belong here.

The Drive archive is a portable backup and human-visible locator, not a second mutable queue. Supabase is the working catalog. No automatic Drive-to-Supabase synchronization is currently claimed.

## Collection contract

Run `node scripts/social/collect-library.mjs --output <absolute-private-directory-outside-Git>` from the task checkout. It downloads tracked website raster assets from their exact public paths, validates dimensions, preserves downloaded bytes unchanged and records source revision/parity. The held gallery photo is preserved privately from the repository, not fetched or republished. The collector merges stable IDs, retains other sources and assets whose refresh failed, snapshots prior catalog and atomically replaces the local index. It does not claim these are original camera masters: website copies may already be compressed/cropped.

Run `node scripts/social/import-google-library.mjs --sources <absolute-owner-source-receipt> --output <absolute-private-directory> --receipt <absolute-download-receipt> --check` to validate a cached intake; omit `--check` to merge it. Both modes validate the merged catalog with the application parser. Changed image bytes require renewed privacy/rights review, while holds remain held.

Google intake uses the exact observed `By owner` photo URLs and keeps their source receipt. Exclude review avatars, Street View, UI graphics and video thumbnails. Preserve the highest actually observed rendition; do not describe it as a full-resolution camera original. A browser inventory count is not a saved-file count. Validate download counts/bytes before intake. Google filenames alone do not provide reliable product descriptions; leave them unclassified until visually reviewed or matched to the gallery.

Each record contains business ID, stable asset ID, SHA-256, original object key, source URL/page/type, dimensions/bytes, title, source description, category/tags, publication-at-source evidence and rights/privacy review status. Store new-rendition metadata separately. Never change the original to conceal a poor background.

`node scripts/social/sync-library.mjs --source <private-directory>` validates a dry-run package. Add `--apply` only for an authorized archive sync using protected server configuration. The script checks the True Color storage destination, creates a private bucket if absent, refuses a public bucket, writes immutable originals, independently downloads/hash-checks every object, snapshots old/new catalogs, refuses silent record removal and verifies the current catalog bytes. No post or scheduler endpoint is called. It deliberately does not grant browser Storage policies or change existing post approvals.

## Current review boundary

Collection is authorized for building the library. Existing catalog/site permissions do not automatically become social/ads rights. Every imported item remains review-required or held. For an actual pilot, select a suitable image, resolve rights/privacy, create an immutable validated JPEG rendition, review the exact caption/hashtags/alt/account/Regina date, then approve through the existing workflow. Importing images does not approve the 12 historical drafts.

Library browse/copy-context is implemented. Library-to-JPEG draft preparation, Telegram new-photo intake, a persistent usage/rotation ledger, one verified hosted trigger and end-to-end Mac-asleep publication are later implementation checkpoints. See [portable system](PORTABLE-SOCIAL-SYSTEM.md) for the complete reusable design and acceptance tests. Do not describe the planned bridge as live.

## Verification and recovery

The staff API checks auth before storage access, confirms the bucket is private, parses a bounded business-specific manifest, and returns 15-minute signed previews with `Cache-Control: private, no-store`. Private originals bypass public image optimization. The browser can refresh expired previews. Held items remain visible with a do-not-use label, never silently promoted.

The old upload library now lists root uploads plus year folders with bounded pagination, handles null folder IDs, exposes truncation and fails clearly on storage errors. The mobile social shell stacks its navigation above content rather than squeezing the library beside it.

For a missing catalog, check the private bucket and exact manifest before recollecting. Never resolve it by making the bucket public. For mismatched hashes, stop and retain both receipts. A restore uses a verified snapshot and original keys; no automatic deletion or overwritten original is required.

## Collection receipt — September 6, 2026

- Website: 406 records / 388 unique source files, zero collection failures. One pre-existing held gallery image stays held and private.
- Google: all 131 still-photo entries observed in the By owner gallery downloaded successfully, 131 unique hashes, zero failures. Review avatars, three video entries and Street View were excluded. This is the observed owner-gallery set, not a claim that Google has no additional unpublished media.
- Combined: 537 records / 519 unique originals. Downloaded image bytes total about 63 MB before archive deduplication/compression. Exact byte duplicates are preserved as separate source records pointing to one object; visual near-duplicate detection and rotation enforcement are not implemented yet.
- Private Drive: dated ZIP (61,101,414 bytes), CSV index and start-here file uploaded to the existing Instagram work area's new Reusable Asset Library folder. Metadata readback confirmed the ZIP's size, matching MD5 checksum, parent and owner-only visibility. Local ZIP integrity check passed; this is not a completed remote archive restore drill.
- Validation: 1,153 unit tests passed in 126 files; strict TypeScript and production build passed; ESLint zero errors (29 existing warnings). Two synthetic mobile library browser tests passed, with source/category/search/hold/error checks and readable full-width layout. Review found and resolved catalog refresh data loss and unsafe output-path handling.
- Full provider delivery, phone/Hermes intake, automated content rotation, background replacement and Mac-asleep publication remain untested future checkpoints.
