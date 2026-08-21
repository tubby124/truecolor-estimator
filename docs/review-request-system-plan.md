# True Color review request system — production plan

## Objective
Collect more *genuine* Google reviews without annoying repeat customers, rewarding reviews, or sending an unobservable blast.

## Product rules
- Original True Color voice: direct, playful, confident. Take the energy of a blunt founder-led brand; do not copy dbrand copy, visuals, or identity.
- Ask for an honest review, never a positive/5-star review.
- No reward, discount, gift, or special treatment tied to a review.
- Initial ask only after an order has been complete for 5 days.
- One reminder at day 12 only (7 days after the initial ask).
- Per customer cap: no new cycle within 365 days.
- Customer reply, unsubscribe, manual “already reviewed”, complaint, bounce, or staff suppression stops the cycle.
- Require the existing marketing-consent ledger and preserve unsubscribe headers.

## Delivery design
1. Fix server-side email/notification logging to use the same True Color Supabase project as the app.
2. Add `customer_review_state` as a global customer suppression/cadence ledger and `review_request_cycles` as an order-level delivery record.
3. Backfill known historical review asks into customer state so the new system never re-blasts those people.
4. Add an authenticated cron route. It is dry-run by default and has a bounded daily cap once explicitly enabled.
5. Move review scheduling out of the status-update request. Completion now creates no immediate email; the cron evaluates completed orders after the wait period.
6. Add staff controls to mark a customer “already reviewed” or suppress future review asks, with an audit event.
7. Add provider webhook handling so bounce/complaint/suppression state automatically prevents further review follow-ups.
8. Prove internally: migration → dry run → test email to the business inbox → durable email log → delivery webhook → no duplicate rerun. Only then start at 5 customer sends/day with a daily review of results.

## Non-goals
- No attempt to infer which Google account/customer left a review.
- No automatic reward or “review us for a discount” program.
- No unbounded historical-list blast.
