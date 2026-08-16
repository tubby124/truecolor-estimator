# Ads Conversion Gap — Decision Memo

**Date:** 2026-08-11  
**Decision requested:** choose one implementation path for paid orders that lack a stored Google click ID. This memo makes no code, database, GA4, or Google Ads changes.

## Current state

The production uploader in `src/lib/google-ads/conversion-upload.ts` requires exactly one `gclid`, `gbraid`, or `wbraid`; a job with none throws before upload. The live account readback on August 11 shows `purchase_online` (7694360837) and `quote_won` (7694360840) as enabled, primary, counted `UPLOAD_CLICKS` actions under the Purchase goal.

The server-side GA4 `purchase` event now fires on every guarded paid transition with the order UUID as `transaction_id`. That closes an analytics event-coverage gap. It does not automatically close Ads attribution: the current Measurement Protocol helper creates a synthetic `client_id` from customer/order identity and sends no `session_id`, so it is not joined to the browser client/session that contained an ad interaction. Google says Measurement Protocol events are joined to online interactions through the same `client_id`, and session attribution requires `session_id` within 24 hours.

## Option 1 — Enhanced conversions for leads

**What it solves.** Capture hashed email/phone with the Google tag when a website lead form succeeds, then upload the later offline win using the same identifier. This can attribute a form-originated lead without a retained click ID. It does **not** recover a pure phone-in/manual order that never submitted a tracked website form; `qualified_call_60s` is the correct signal for ad calls.

**Implementation surface**

- Browser: add a lead-user-data/tag helper in `src/lib/analytics/google-ads.ts`; call it only after a successful saved lead in `src/app/quote/page.tsx`, `src/components/paid/PaidQuoteForm.tsx`, and `src/components/contact/ContactForm.tsx`; add focused tests. Normalize and SHA-256 hash before transmission, and do not add another PII store.
- Server/outbox: allow a conversion job with zero click IDs when valid user identifiers exist; update `src/lib/google-ads/conversion-upload.ts`, `src/app/api/cron/google-ads-conversions/route.ts`, outbox claim/status logic, and tests. A future migration would be needed to requeue eligible `not_attributable` rows; that is outside this memo and currently prohibited.
- Account: use a dedicated offline Converted Lead action for form-led wins, verify the unified enhanced-conversions setting and customer-data terms, map the AW-18330693756 tag, and run a validate-only upload before enabling delivery. The August 7 learning log reports the setting/terms and hashed-data probe live, but the lead-form tag is not built; re-verify rather than assume the UI state persisted.

**Risk.** Match rate depends on the same identifier being present at lead and win time. A new action overlapping `quote_won` would double-count if both are primary, so the new action should begin secondary and be validated against order IDs before any primary-goal change.

**Privacy.** Email/phone are personal information even when hashed. The site must clearly disclose the fields, Google as recipient, the measurement purpose, and SHA-256 hashing. Google also recommends sending consent state; PIPEDA meaningful-consent requirements need separate owner/legal review beyond adding policy text.

## Option 2 — Import GA4 `purchase` into Google Ads

**What it solves.** It is the shortest account setup because the GA4 `purchase` event already fires for every guarded paid transition. It gives Google Ads a GA4-sourced conversion action governed by GA4 attribution. Event coverage is all orders; **Ads-attributable coverage is not**. With the current synthetic `client_id` and no `session_id`, click-ID-less server purchases generally have no browser ad interaction to receive credit.

**Implementation surface**

- Account: confirm/re-establish the GA4↔Ads link, mark/use `purchase` as a GA4 key event, create the Google Ads conversion from it, and leave the new action secondary by default during reconciliation.
- Code for a credible attribution path: capture the real GA4 browser `client_id` and `session_id` on the originating web session, carry them into the order/quote, and pass them through `src/lib/analytics/measurementProtocol.ts` and all guarded payment callers. Without that stitching, no-code import is useful for analytics comparison but is not a reliable bidding signal for this gap.
- Account objects affected: the GA4 link, GA4 `purchase` key event/conversion, the new Analytics-sourced Purchase action, and Purchase-goal primary/secondary membership.

**Risk and double-counting.** Google Ads deduplicates a repeated transaction ID within the same conversion action; it does not make separate actions mutually exclusive. If the GA4-imported Purchase action and existing `purchase_online` / `quote_won` actions are all primary, the same ad-sourced order can enter bidding twice. Primary actions inside the selected Purchase goal feed the Conversions column and bidding; secondary actions are observation-only. Promotion therefore requires either making the GA4 import the sole primary Purchase action or proving mutually exclusive routing. GA4 attribution/channel settings also replace the current direct click-upload semantics.

**Privacy.** No hashed email/phone is added by the import itself, but credible client/session stitching expands how first-party order data is connected to analytics identity. The GA4 Measurement Protocol disclosure/consent posture still applies.

## Recommendation

Choose **Option 1**, narrowly scoped to form-originated quote wins, because it is the only option here designed to match an offline website lead back to an ad without a stored click ID. Keep phone-only orders represented by `qualified_call_60s`, not by pretending EC-for-leads covers them.

Do not make the current GA4 import primary. If Hasan wants the cheap experiment, create it as **secondary observation only** and validate attribution against known ad journeys; on the present synthetic-client implementation it does not close the bidding-signal gap.

Whichever option is chosen, its account-side setup consumes a normal daily account-change slot: dry-run/readback → Hasan's explicit “go” → apply → verifier → learning-log entry. Stop here pending Hasan's decision.

## Primary references

- [Google: configure enhanced conversions for leads](https://support.google.com/google-ads/answer/11021502)
- [Google: Measurement Protocol session attribution](https://developers.google.com/analytics/devguides/collection/protocol/ga4/use-cases)
- [Google: primary and secondary conversion actions](https://support.google.com/google-ads/answer/11461796)
- [Google: transaction IDs deduplicate within a conversion action](https://support.google.com/google-ads/answer/6386790)
