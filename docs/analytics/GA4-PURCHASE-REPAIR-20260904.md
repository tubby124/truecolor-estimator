# GA4 purchase follow-through — 2026-09-04

## Implemented locally

All six server purchase paths share `buildPurchaseAmounts`: Clover webhook,
staff Clover/eTransfer confirmations, staff status confirmation, Clover
reconciliation, and the Wave payment-effect worker.

- Value is the recorded total less recorded GST, PST and any explicitly supplied
  shipping. Item revenue reconciles to that value. Order discounts are allocated
  in cents; charges outside item lines (such as checkout rush) remain a separate
  item rather than increasing catalog product revenue.
- Item identity uses stored `merchant_offer_id`, then `commerce_product_id`.
  Unclassified legacy/manual lines keep their item name without an invented ID.
- Real browser client/session context and intentional omission without it remain.
- All non-Wave callers now await the request. Fetch aborts after five seconds,
  failures remain nonfatal to payment processing, and fetch errors do not log the
  secret-bearing request URL. No automatic in-request replay was added.
- HTTP acceptance is not proof of downstream GA4 processing or attribution.

Source contract: [Google purchase event parameters](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase).

## Explicit remaining limits

Awaiting fixes request-lifetime abandonment; it does not provide durable delivery
after a process crash or provider failure. Wave already retries through its
payment-effect queue. The universal commerce ledger remains held and unchanged.
No historical backfill, provider test send, database change or deployment is part
of these local edits.

The schema has no explicit order shipping-charge field, and self-serve checkout
currently permits pickup only. Shipping embedded in a manual line cannot safely
be inferred from its name. Add a structured shipping field and route it to the
builder before enabling paid shipping; existing manual shipping cannot be
claimed fully excluded from GA4 revenue.

## Durable delivery design for a separate change

1. Add a service-role-only destination delivery table with a unique
   `(business_event_key, destination)` key, immutable purchase payload, actual
   occurrence timestamp, attempt count, next-attempt time, claim lease,
   acceptance time and sanitized failure reason. Preserve separate states for
   intentionally skipped browserless events and HTTP-accepted requests.
2. Enqueue in the same database transaction as the paid transition, with an
   explicit forward-only cutover. Keep all existing held ledger rows held; do
   not turn an old accounting event into a new analytics purchase.
3. Replace the five inline non-Wave senders and Wave GA4 effect at that cutover
   with one destination owner. Prevent overlapping old/new workers. Keep the
   existing order UUID transaction ID and genuine browser client context.
4. Use atomic leased claims, bounded requests, retry backoff and a dead-letter
   state. Test a crash before send, after provider acceptance but before database
   acknowledgement, duplicate webhook delivery and concurrent workers. Exactly-once
   delivery cannot be guaranteed across the database and Google; stable
   transaction identity and explicit replay rules are required.
5. Preserve the actual purchase time on retries, follow Google's current MP
   timestamp limits, and hold events too old for safe submission. Do not reset
   their timestamp to make stale session context appear current.
6. Register missing, stuck and dead delivery signals in the existing lifecycle
   rollup contract, then verify a newly paid, consent-eligible browser order in
   GA4. An HTTP 204 alone does not close the attribution audit.

The generic ledger alone lacks destination payloads, attempt/lease state and a
safe cutover. Reusing its status field as an ad hoc dispatcher would hide these
gaps and risk duplicate delivery, so this change deliberately does not do that.
