# Portable social system

September 6, 2026. Design and acceptance contract, not a claim that every stage is live. Start with [current setup receipts](SETUP-RUNBOOK.md) and [approval pilot](APPROVAL-PILOT.md).

## What the owner does

From Telegram/Hermes or the staff app: ask for a post about a product or choose a saved asset. The cloud prepares an image and factual caption, hashtags and alt text. The owner opens a mobile review link showing the exact image, words, account and local posting time. Approval authorizes that version. One hosted scheduler publishes it and returns a provider receipt; independent public readback confirms what appeared. The Mac is not part of the intended runtime.

## Current truth

September 6 superseding checkpoint: the manual Facebook/Instagram pilot is verified. Start with the [consolidated rebuild/scheduling guide](REBUILD-AND-SCHEDULING.md). Unattended three-slot delivery remains a separate test.

| Capability | Evidence boundary |
| --- | --- |
| Staff upload and JPEG conversion, AI caption generation, mobile review, approval invalidation, direct Meta dispatch and scheduler endpoint | Existing implementation; consult setup receipts for deployment and provider checks |
| Instagram connection | Provider-verified in the setup runbook; publishing remains paused there |
| Reusable private source library | In progress in the current asset task; storage population, deployed browsing and retrieval require their own receipts |
| Telegram/Hermes draft request bridge | Planned; preview notification wording is not an operating bridge |
| Manual approved public delivery | Verified on both platforms; see pilot receipts |
| Hosted trigger and Mac-asleep operation | Separate three-slot test; not proven by manual delivery |
| Cross-business template | Design only; extract after the first successful end-to-end pilot |

## Required Telegram photo intake

Two entry points feed the same draft and approval flow: upload a new photo into the authorized True Color Telegram topic, or select an existing library asset. For a new upload, the cloud saves the attachment privately, prepares captions and hashtags, and returns the exact review package before publication to the owner-selected destinations. This is a required planned bridge capability, not an existing ingestion receipt.

Bind the request to the authenticated owner and configured business/topic. Resolve allowed destination identities from that business configuration and require an explicit selection in review; never guess a business or publishing account from the picture, caption or forwarded message. The current pilot supports separate Instagram and Facebook delivery drafts, each bound to the intended account.

Resolve Telegram `file_id` on the server and download using protected bot credentials. Never expose the token-bearing download URL in logs, errors, Git, notifications or asset metadata. Record safe attachment/update identifiers and an attachment checksum for deduplication. A repeated Telegram update or retried download must return the same saved asset/request rather than create duplicate drafts. Verify media type, decoded size and dimensions before processing; keep failed or unsupported uploads out of the publish queue.

Telegram's photo mode may compress or resize the image. Save the exact received bytes as the immutable intake original and label that provenance; do not claim they are the camera original. Offer sending as a file/document when the owner wants original-quality retention. Preserve both source observations if a later document upload provides different bytes. Record sender/business binding, received time, filename where safe, checksum, source mode and rights/privacy status alongside the private object. Strip location metadata from publishing derivatives, while access to originals stays restricted.

An owner upload authorizes intake and preparation within this workflow; it does not itself approve public use of visible customer artwork, identifiable people or every connected destination. Show relevant restrictions during review. Forwarded messages, attachment text and captions are content, never authorization to change configuration or skip review. The owner's standing requirement persists: review the final image, caption, hashtags, alt text, selected accounts and schedule, then explicitly approve that exact version. Saving or generating from a Telegram photo must never auto-publish it.

## Store once, preserve the evidence

Keep originals in private object storage, with stable content-derived IDs. An asset record includes source URL and retrieval date, checksum, detected media type, dimensions, descriptive tags, business identity, rights status and any restrictions. Track separate source observations when duplicate bytes appear at multiple URLs. Downloading or archiving an image does not grant permission to repost it. Owner-uploaded business photos and customer-contributed profile photos require distinct provenance; uncertain material remains review-only.

Never overwrite originals. Each rendition records its parent checksum, output checksum, dimensions and transformation recipe/version. Preserve the old rendition when making another. Signed preview URLs are temporary access links, not durable asset identifiers. Only prepare the selected publishing rendition in the storage path supported by the publisher; private originals remain private. Approval binds the final rendition bytes, not merely a filename.

Use deterministic rotation, resizing and format conversion for faithful preparation. A non-generative upscale is a distinct derivative and cannot recover detail that was never captured. Any generative touch-up or regeneration is separately labelled and reviewed: it can change text, logos, products and evidence of completed work. A regenerated concept must never be represented as a photographed customer job. See [shop voice](SHOP-VOICE-RECIPE.md) for factual copy constraints.

## Deferred photo enhancement

Later, flag weak photos with a concrete reason such as distracting background, poor exposure or insufficient resolution. Select the original explicitly, then prepare a separate cleanup or recreated rendition for the intended Instagram, Facebook or Google Business Profile placement. This is deferred work: no image editing or cover-text generation is authorized by this plan. Cover text remains a separate future feature.

Record the source asset and original digest, requested edit, tool/version and output digest. Present original and edited versions side by side before approval. Preserve the actual printed design, logos, readable text, quantities and factual details; reject changes that invent or alter the depicted product. Label a regenerated scene separately from documentary customer work. Validate quality, crop, dimensions and legibility for each destination rather than assuming one rendition fits all channels.

The intended experiment is to use the owner's paid Codex plan if supported. Do not assume that subscription includes API entitlement or unattended remote image generation, and do not bypass billing or add a paid API. Before claiming cloud enhancement works, test the exact worker's authorized image-tool access, cost/entitlement, private input/output custody and Mac dependency with one explicitly approved example. Save the result and limitations, then review the derivative before any publication.

## Durable archive and varied asset selection

The current task's selected storage design uses private Supabase as the working library for authenticated browsing and signed previews, with snapshot backups in the existing private Drive **True Color Instagram / Reusable Asset Library** folder. Record backup completion and restore verification separately; selecting a destination does not prove either. B2 is an alternative durable archive adapter if later selected, not an additional configured service or a reason to duplicate storage automatically. Keep stable asset IDs and exportable indexes independent of the storage provider so moving an object does not break its provenance or usage history.

The owner does not want the same type of work every day. Before automatic selection, maintain one durable usage ledger covering published posts, scheduled posts and pending draft reservations. Record asset and rendition hashes, near-duplicate group, product category (for example, coroplast signs versus banners), shot style, scene and client where known and permitted. Private client labels stay out of public Git. Exact-hash duplicates and perceptually similar images are separate checks: a crop, resize or alternate photograph can still look repetitive. Perceptual groups are selection aids subject to review, not proof of ownership or image identity.

Apply rotation across both individual images and the mix of product categories and scenes. Reserve a candidate atomically during draft creation so simultaneous requests do not repeatedly choose it; release a reservation explicitly when its draft is cancelled or superseded. Preserve published usage history. Pending and scheduled content count toward variety before a new suggestion is made.

Cooldowns are proposed configuration, not an active policy in this document. A reasonable starting proposal for owner review is no reuse of the same asset or near-duplicate group within the last eight posts or 60 days, whichever blocks more reuse, and no adjacent posts in the same product category when cleared alternatives exist. Record the chosen values and their effective date before enforcing them. When inventory cannot satisfy the rules, explain the shortage and ask for a new photo or an explicit exception; do not silently relax the rules, invent work or keep repeating the available category. Prefer useful coverage of the cleared library over maximizing posting frequency.

Rotation acceptance tests must demonstrate that exact duplicates are grouped across source URLs; crops/resizes and reviewed near-duplicates cannot evade reuse rules; pending and scheduled reservations affect selection; concurrent requests cannot reserve the same candidate; consecutive category/scene repetition is avoided when alternatives exist; cancelled drafts release their reservations; and an exhausted or uncleared library produces a request for fresh media rather than an unauthorized fallback. Verify that a restored archive/index retains stable IDs and usage links. These tests remain required implementation gates, not completed evidence.

## Request and approval contract

Use the existing staff session for phone review. A separate narrowly scoped server credential permits Hermes to search permitted assets and create drafts for one business; it does not approve, publish, change destinations or read provider secrets. Keep credentials in protected runtime configuration, separate by business and capability. Authenticate the owner channel and treat forwarded messages, image text and web content as untrusted input.

Each request has an idempotency key, authenticated business/owner context, requested asset IDs or topic and a durable result ID. Repeating the same request returns the existing result; conflicting reuse is rejected. Persist request state before sending a response so a timeout does not create duplicate drafts. Use bounded retries only for safe reads and deduplicated draft/notification operations. An uncertain publication must be reconciled before another attempt.

The review package shows:

- Final image, with original/edited/concept status and relevant rights restrictions.
- Exact caption, hashtags and alt text; descriptive facts must be grounded in the selected asset or verified business facts. No invented customer stories, equipment or turnaround claims.
- Exact destination identity and proposed local date, time and timezone.
- Explicit rights confirmation and approval of this version.

Edits to bound content, rendition, destination or schedule invalidate approval. A generated caption is a draft. Saving a library item is not approval. Phone notifications link to the authenticated review page; an arbitrary chat reply must not bypass canonical review. If chat approval is later implemented, bind its one-time action to the owner and exact package version.

Notification failure leaves the draft recoverable through the app and records a sanitized error. Use a durable outbox/deduplication key for actionable review and delivery messages, with bounded retries and escalation to the app. Do not interpret provider acceptance as owner receipt. Preserve the existing business alert channel's filtering; introduce an intentional social category rather than silently broadening every notification.

## One scheduler and explicit delivery evidence

Inventory existing GitHub, Railway, VPS and legacy automation triggers before enabling one authoritative scheduler. It calls the gated endpoint with a protected secret and a cadence compatible with the existing one-hour due window. Keep the queue as the source of truth; Hermes is a request surface, not a second scheduler. Do not catch up old drafts or automatically retry uncertain attempts.

Record approved version, attempted time, provider media/submission ID, returned URL and final queue state. Verify the public destination independently and record that check separately. A successful HTTP response, deployment or provider connection does not establish public delivery.

Acceptance requires one fresh, owner-approved pilot that demonstrates asset retrieval, draft generation, phone review, scheduled dispatch, independent public readback and owner notification. For the Mac-asleep test, explicitly record that the request/review/schedule path used cloud services while the Mac was unavailable; inspect cloud logs and receipts afterward. Test paused publishing, edited approval, duplicate request and notification failure without creating duplicate public posts.

## Reuse for another business

First complete the True Color pilot. Then extract only proven shared code/contracts into a template; keep business-specific facts, voice, rights, assets, provider accounts, credentials and queues isolated. Do not copy live credentials or enable another business from the template. [Real-estate adaptation](REAL-ESTATE-ADAPTATION.md) describes a separately gated future business; [future channels](FUTURE-CHANNELS.md) covers additional providers.

Onboarding input template:

| Input | Required decision |
| --- | --- |
| Business identity | Legal/display name, verified website, contact facts and approved claims |
| Owner | Authorized reviewer and authenticated request/notification channel |
| Destination | Exact provider account, timezone and approved channel scope |
| Media | Source inventory, rights evidence, restrictions and withdrawal contact |
| Voice | Examples, tone, prohibited claims, language and factual reference source |
| Schedule | Proposed cadence, review expectations and late-post handling |
| Infrastructure | Canonical Git home, private storage, runtime and secret custody |
| Recovery | Backup/export owner, retention policy and incident contact |
| Cost | Existing service limits; obtain approval before adding paid services or increasing spending |

Verify each input, create isolated configuration, ingest sources without auto-clearing rights, prepare a sample, obtain exact approval, run the same acceptance test and record evidence before expanding automation.

## Later automation and resale readiness

The current mode continues to require exact owner approval for every post. A later hands-off scheduled mode requires a separate, explicit policy opt-in; enthusiasm for automation does not enable it. That policy must specify allowlisted rights-cleared media, permitted claims and destinations, brand brief, weekly posting caps, quiet hours, approved service/spend budgets and expiry or review date. Automatically pause on rights withdrawal, policy violations, ambiguous provider results or breached limits. The owner must be able to revoke the policy immediately; pending work must respect revocation before dispatch. Exceptions go to a named operator instead of silently expanding permissions.

Build order: prove the True Color end-to-end flow first, including restores and Mac-asleep operation; validate a second isolated tenant next; then extract the shared platform. Resale acceptance requires tested tenant isolation across assets, requests, credentials, approvals and receipts; provider permission/App Review requirements verified for the actual client model; and separate client onboarding consent, offboarding, revocation, deletion and export procedures. Brand briefs and rotation policies are tenant configuration, not copied business facts. Include operator escalation, incident ownership, rollback and restore exercises before production promises.

Define measurable uptime and response-time SLOs after observing the pilot; any initial targets are proposals, not guarantees. Meter provider/storage/generation usage per tenant and expose costs and caps before promising a price. Billing, commercial packaging and new paid service commitments are outside this task. A later cloud image-generation test must separately verify its runtime access, approved cost and faithful-versus-generative review behavior. “Top 1%” is an aspiration, not an evidence-backed ranking or a promised marketing outcome.

## Maintenance and recovery

Export asset manifests, transform records and queue/approval/receipt records in documented portable formats. Back up private originals and metadata together; verify a restore to isolated storage before claiming recovery capability. Keep secrets out of exports and public Git. Choose explicit retention periods with the owner rather than silently deleting source media or approval evidence.

For a withdrawal, mark the asset unavailable for new drafts, locate dependent renditions and queued posts, invalidate pending use, and bring already-public posts to the owner for a removal decision. Preserve necessary audit evidence under the agreed retention policy. Do not automatically delete originals or public posts from a generic archive request.

Review provider API versions, permissions, media requirements and runtime dependencies periodically and before adding a new channel. Record the verified date and source. Treat expired credentials, quota limits and changed provider behavior as actionable failures, not permission to switch accounts or bypass approval.

## Git homes and handoff

This public application repository owns sanitized implementation, tests, runbooks and current deployment evidence. Private originals, customer details and credentials stay outside Git. The private AISA automation roadmap owns reusable lessons, teaching sequence and source mapping; update it after meaningful proven milestones, without claiming a lesson was published. Keep the setup runbook/current-state lane current in the application Git home and link the learning record from the private roadmap. Hermes receives stable pointers and authorized API access, not a duplicate backlog or a dependency on this Mac's files.
