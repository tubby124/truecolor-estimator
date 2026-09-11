# Order email audit — September 11, 2026

## Finding

Two owner-reported missing customer messages were traced individually through the production database, the existing Gmail BCC copies and the correct True Color Resend account. Both recipient-specific Resend delivery events contain Microsoft 365 `250 2.6.0` acceptance responses with “Queued mail for delivery.” The customer recipient was checked separately from the staff BCC recipient. This proves handoff to the recipient mail system, not inbox placement or reading. Customer identities, amounts, message IDs, full responses and access-bearing links remain private.

The receipt copy passed SPF, DKIM and DMARC in Gmail; the outreach domain is verified in Resend. Both recipient domains use Microsoft 365. Junk, quarantine and mailbox rules remain hypotheses until recipient message trace or mailbox evidence confirms the destination. Resend's Insights flags sender/link domain mismatch. Its flag is a risk indication, not the recipient's spam verdict.

Production sends from `hello@outreach.true-color.ca`, replies go to `info@true-color.ca`. The API key is deliberately send-only; its 401 on read endpoints is not evidence that sending is broken. The correct provider account currently verifies the outreach subdomain, not a replacement transactional domain. No sender/DNS/account change or customer resend was performed.

## Confirmed application corrections

- Payment requests, receipts and pickup messages now pass their order UUID to the existing email log. Older records remain unlinked; email-address matching cannot establish attribution when a customer has several orders.
- Staff status updates report an unconfirmed email outcome without rolling back the successfully saved status. These outcomes are retained in the audit feed and a shared lifecycle warning; uncertain sends are not automatically replayed.
- Payable quote introduction now tells the customer to approve and pay using the included button. It no longer promises a separate invoice after confirmation while displaying a payment button in the same email.
- These three essential message types omit subscription unsubscribe headers. Other callers retain their existing behavior. [Google's FAQ](https://support.google.com/mail/answer/14229414?hl=en) excludes transactional messages from the one-click unsubscribe requirement. This correction does not prove improved Microsoft inbox placement.

The manual copy-payment-link feature and payment accounting are unchanged. A production status change still requires staff to mark an order ready; the system cannot infer physical production completion. Existing in-production notification suppression remains unchanged. Clover receipt failures still lack a general durable retry queue; this release does not claim to implement one. Separate e-transfer confirmation error reporting also remains a follow-up.

## Verification and remaining work

Focused email/status/lifecycle tests, TypeScript and lint are required before release. Release evidence will be appended after CI and deployment.

Next operational evidence: recipient IT message trace for the two reported emails. Recommended sender work: establish a verified transactional subdomain under the website domain, with matching first-party links where supported, before switching production credentials/sender. A new sender is not a guarantee of inbox placement. [Resend's guidance](https://www.resend.com/blog/how-to-warm-up-a-new-domain) recommends separating transactional and marketing reputation.
