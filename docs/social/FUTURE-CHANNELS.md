# Future channels: organic posts, replies, ads and Google

Planning baseline: 2026-09-05 (America/Regina). This is a sanitized implementation roadmap, not evidence of a connected account, approved campaign or live delivery. Current connection evidence belongs in [SETUP-RUNBOOK.md](SETUP-RUNBOOK.md). No permissions, campaigns, budgets or messages were changed by preparing this document.

## ELI12

Keep one familiar review desk, with separate connections underneath it. A normal post, a customer reply and a paid ad are different actions. Approving a post must never silently approve spending money to boost it. Google Business Profile is another connection entirely.

Save this plan in Git now; build the adapters one at a time. Finish Instagram identity and unpublished preview first, then an explicitly approved live pilot. Add Facebook organic posts and Google posts next. Start ads with reporting and a preview, then a small separately approved campaign. Build replies with human review before automatic replies. Google API-access preparation can run alongside the Instagram work because provider approval may take time.

## What each lane needs

| Lane | Connection work | First proof |
|---|---|---|
| Instagram organic | Existing Meta app, linked Page and professional Instagram account; scoped publisher token | Read back destination and granted scopes; visible draft; separately approved pilot |
| Facebook organic | Page publishing capability and endpoint-specific permissions, including checking `pages_manage_posts` requirements before implementation | Page identity and unpublished package; separate destination receipt |
| Instagram/Facebook replies | Messaging permissions, provider webhook subscriptions and approved access for intended users | Verified inbound event and owner-reviewed reply; takeover and stop controls |
| Facebook/Instagram paid ads | Marketing API plus the specific ad account, Page and Instagram advertising identity | Read-only account/reporting check, then paused campaign preview |
| Google Business Profile posts | Approved Google API project and OAuth from an owner/manager of the existing location | Read-only location match, local preview, separately approved post and readback |

The existing Instagram token is not proof that Facebook publishing, messages or ads work. Each adapter must validate its own permission and identity requirements against current provider documentation.

## Meta ads: staged connection plan

Meta's official Marketing API collection supports user and system-user tokens. It identifies the ad account as the place for billing and spending limits. Its guidance distinguishes Standard Access for one's own ad account from Advanced Access for other people's accounts, using `ads_read` and/or `ads_management` as appropriate. [Meta Marketing API collection](https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi).

Our implementation sequence:

1. Inventory the existing ad account rather than creating a duplicate. Record the private ad-account identifier, owner, currency, timezone, status, payment readiness and intended Page/Instagram identity in protected configuration. Keep financial details out of this public repository.
2. Confirm that the existing app supports the Marketing API use case. Reuse it where supported; do not create another app just because a wizard stalls. Verify the app's actual access level and business-verification/App Review requirements in its dashboard. A development-mode success with owned assets does not establish a general service for students or clients.
3. Assign only the intended ad account to a dedicated ads identity (preferred) or deliberately scoped existing system user. Begin reporting with `ads_read`; add `ads_management` when implementing campaign changes. Do not assume `business_management` is a universal ads requirement or a substitute for ad-account access: request it only for documented Business Management operations the implementation actually uses. Recheck endpoint requirements before issuing the ads credential.
4. Read back account and accessible advertising identities. Render a local campaign review package containing objective, creative, copy, landing page, audience/geography, placements, conversion event, currency, budget type/amount, dates and maximum authorized spend.
5. Implement independent ads approval and dispatch. After approval to create provider objects, create them paused and verify effective status before any activation. Activation requires the exact campaign/spend approval; a social-post approval is insufficient. Do not enable a billing method, resume old campaigns or boost old posts from this roadmap.
6. Release one bounded campaign only after the approved destination and measurement path work. Verify delivery and spend from provider results; retain pause control and per-campaign receipts. An API success is not a conversion or proof of profitable results.

For real-estate adaptation, use its own account/credentials and review current housing-ad category and targeting restrictions before campaign design. Never copy printing audiences or assumptions into housing ads.

## Messaging is a separate build

Meta's Facebook-linked Instagram Conversations documentation lists `instagram_basic`, `instagram_manage_messages` and `pages_manage_metadata`; it identifies Advanced Access for conversations involving people without roles on the app/business assets. [Meta Conversations API](https://www.postman.com/meta/messenger-platform-api/folder/22794852-255610cd-47f5-4f4d-b3fa-71aec360be9a).

Before implementing, verify the exact login variant and Facebook Messenger permissions separately. Build webhook signature checks, event deduplication, permitted response-window enforcement, an owner review queue, takeover/STOP and failure receipts. Start with inbound messages and suggested replies. Customer replies still require explicit authorization; an approved posting connection grants no standing messaging consent.

## Google Business Profile: separate OAuth connection

Use the existing verified True Color location, not a new listing. Google's current prerequisites require a verified profile active for at least 60 days and a website representing the business. Request API access for the chosen Cloud project using an owner/manager email, then enable the relevant APIs after approval. A zero quota signals the project is not approved. [Google prerequisites](https://developers.google.com/my-business/content/prereqs).

Configure OAuth with `https://www.googleapis.com/auth/business.manage`, securely store refresh credentials server-side and read back the exact account/location. The local-post create endpoint is `POST https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/localPosts`. [Google local-post create reference](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/create).

Start with a standard update and a useful destination link; events and offers can follow. Product Posts cannot be created through this API, so Merchant Center/product feeds remain a separate lane. [Google post types](https://developers.google.com/my-business/content/posts-data). Check current post-content policy and media eligibility before release. [Google posts policy](https://support.google.com/business/answer/7213077?hl=en).

Our scheduler should keep an approved package until its Regina due time; event start time is not publishing approval or a scheduling receipt. Verify the created post and its visible provider status, with bounded reconciliation on ambiguous responses. Do not blindly retry a timed-out create call. Google posts are not Google Ads.

## Reuse and lessons to carry into AISA

- Reuse exact-content approval, rights records, destination binding, schedules, immutable receipts and owner controls. Give each provider its own adapter and credential. Do not build a generic multi-tenant platform before these paths work.
- Keep public Git examples synthetic and secret-free. Store reusable engineering here; cross-business teaching sequence stays in AISA's private master roadmap. Do not imply these instructions answer a specific person's question until the original question is retrieved.
- A checkbox, linked Page or generated token is only setup progress. Prove the account identity, permission readback, unpublished preview, approved delivery and visible result separately.
- On browser stalls, inspect current state before retrying creation. Record what exists and the exact next screen. Never multiply apps/users to escape a spinner.
- Prepare the secret-storage path before generating credentials. Never put tokens in screenshots, Git, public docs or teaching material.
- Preserve independent work while awaiting provider access: prepare voice examples, previews and runbooks. Stop repeated failed UI attempts; escalate the exact blocked action.

Evidence limits: this research used official Google documentation and Meta-owned Postman collections. Direct Meta developer documentation returned errors during this pass; detailed endpoint permissions, app review and current access-level labels must be revalidated in the live app before implementation. No new account capability is claimed by this plan.
