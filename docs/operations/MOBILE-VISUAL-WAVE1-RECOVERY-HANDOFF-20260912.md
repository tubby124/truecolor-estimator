# Mobile visual wave 1 recovery handoff — September 12, 2026

## Current Git truth

- **Worktree:** `/Users/owner/Downloads/TRUE COLOR PRICING /mobile-visual-wave1-20260912`
- **Branch:** `codex/mobile-visual-wave1-20260912`
- **Fetched base:** `origin/main` = `38642b5e01a83af1ba8a085426434bc7b6735804` (`fix: anchor SEO opportunities to finalized GSC data (#92)`)
- **Candidate HEAD:** `2345fd5a51d1dca9ac065b67e09ed77741679f99` (`Refine private mobile storefront and apply current wordmark`)
- **Relationship:** `merge-base(HEAD, origin/main)` is `38642b5e…`; candidate HEAD is a direct child of the current remote main. There is no divergence, merge, rebase, reset or overwrite required to reconcile the committed candidate.
- **Working state at recovery:** 47 modified tracked files plus 14 untracked files (61 file paths; Git's short status compresses two untracked directories). Nothing is staged. `git diff --check` passes.

This record intentionally does not stage, amend, discard, stash, rebase or otherwise alter those pre-existing changes.

## Lane classification of every pre-existing dirty path

Paths below are classified by their primary affected lane, not an approval to merge or deploy them. A path may be visually adjacent to another lane, but it must move with its primary contract and tests.

### Mobile visual

- `docs/operations/MOBILE-VISUAL-MODERNIZATION-20260912.md`
- `scripts/visual-preview-proxy.mjs`
- `scripts/visual-verification.node.mjs`
- `scripts/mobile-review-gateway.mjs`
- `scripts/mobile-review-gateway.node.mjs`
- `src/app/page.tsx`
- `src/app/cart/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/products/[slug]/page.tsx`
- `src/components/home/HeroSlider.tsx`
- `src/components/home/MobileStickyBar.tsx`
- `src/components/product/MobileCallPriceBar.tsx`
- `src/components/product/ProductConfigurator.tsx`
- `src/components/product/ProductPageClient.tsx`
- `src/components/site/BackToTop.tsx`
- `src/components/products/ProductExplainer.tsx`
- `src/components/products/__tests__/product-explainer.test.tsx`

The uncommitted documentation expands past the committed homepage/picker pilot into product detail, cart and checkout presentation. That is a later-wave expansion, not proof that the original thin private candidate is ready to release.

### Payment and email

- `src/app/account/AccountClientPage.tsx` (mixed account UI and safer reorder/history failure handling)
- `src/app/api/orders/route.ts`
- `src/app/api/staff/manual-order/route.ts`
- `src/app/api/staff/manual-order/__tests__/override-total.test.ts`
- `src/app/api/staff/quotes/[id]/send-quote/route.ts`
- `src/app/api/staff/quotes/[id]/send-quote/__tests__/delivery-state.test.ts`
- `src/app/api/staff/quotes/[id]/send-quote/__tests__/quote-totals.test.ts`
- `src/app/api/webhooks/resend/route.ts`
- `src/app/api/webhooks/resend/__tests__/route.test.ts`
- `src/app/pay/[token]/page.tsx`
- `src/components/account/OrderCard.tsx`
- `src/components/account/OrdersList.tsx`
- `src/components/account/__tests__/reorder.test.ts`
- `src/components/account/reorder.ts`
- `src/components/paid/PaidCartConfirmation.tsx`
- `src/lib/email/resend-event-updates.ts`
- `src/lib/payment/manual-order-pricing.ts`
- `src/lib/payment/quote-send-fingerprint.ts`
- `src/lib/payment/quote-wave-readiness.ts`

These are operationally risky because they affect order reconstruction, staff/manual totals, quote delivery idempotency, Resend status interpretation, Wave payment readiness or customer-facing payment state. They are separate from a visual release. No test order, payment, provider call or email is authorized by this handoff.

### Social

- `src/app/api/staff/social/accounts/route.ts`
- `src/app/api/staff/social/blitz/route.ts`
- `src/app/api/staff/social/blitz/sync-brevo-lists/route.ts`
- `src/app/api/staff/social/blitz/trigger/route.ts`
- `src/app/api/staff/social/campaigns/route.ts`
- `src/app/api/staff/social/images/route.ts`
- `src/app/api/staff/social/images/__tests__/route.test.ts`
- `src/app/api/staff/social/library/route.ts`
- `src/lib/social/__tests__/asset-library.test.ts`

These edits are only small import/request-contract changes in the current diff, but they remain social-lane changes. They do not authorize account connection, approval, enrollment or publication.

### Analytics

- `src/app/api/cron/google-ads-conversions/route.ts`
- `src/app/api/cron/google-ads-conversions/route.test.ts`
- `src/lib/google-ads/conversion-diagnostics.ts`
- `src/lib/google-ads/quote-lead-conversions.ts`
- `src/lib/google-ads/__tests__/conversion-diagnostics-lifecycle.test.ts`
- `src/lib/google-ads/__tests__/conversion-outbox-contract.test.ts`

This is a refactor of paid-conversion diagnostics and qualified quote-lead outbox work. It must be treated as a separate analytics change; it is not visual verification and must not be exercised against a live ads/provider configuration as part of recovery.

### Unknown / separate account or framework work

- `src/app/forgot-password/ForgotPasswordClient.tsx`
- `src/app/quote/[id]/page.tsx`
- `src/app/why-true-color/page.tsx`
- `src/app/why-true-color/__tests__/page-contract.test.ts`
- `src/components/account/AuthGate.tsx`
- `src/components/account/ProfileForm.tsx`
- `src/components/account/PasswordForm.tsx`
- `src/lib/account/auth-actions.ts`
- `src/lib/account/__tests__/auth-actions.test.ts`
- `src/lib/paid/why-true-color-products.ts`

These paths include password/auth recovery, account profile treatment, a Next async-route signature change, and an extracted paid-page data module. Their intended release lane is not established by the mobile handoff. Do not silently include them merely to satisfy a build or visual run.

## What is working, unverified, risky and stopped

- **Working:** the committed private candidate at `2345fd5a` remains linear on current main. Its documented private homepage/picker checks and current wordmark evidence remain recorded in `MOBILE-VISUAL-MODERNIZATION-20260912.md`.
- **Unverified:** the dirty combined state has not had a clean-candidate production build, no-JS check, controlled performance sample, full CI, checkout contract verification or independent release review. The current remote main has not received the candidate branch.
- **Risky:** mixing the 61 paths would combine customer-payment/email behavior, Google Ads conversion processing, social APIs, authentication and visual work in one release. The uncommitted later product/cart/checkout presentation work also exceeds the originally committed homepage/picker slice.
- **Stopped direction:** do not resume the cancelled product-first creative plan. Nothing in this recovery authorizes new creative production, product-led social content, social publication or provider action.

## Safe split and smallest next slice

1. Preserve this worktree exactly as it is. Do not run a broad build, a payment-flow helper, provider script or deploy from this mixed state.
2. Treat the existing committed `2345fd5a` as the only reconciled mobile candidate. It needs no Git integration repair; it only needs its already-recorded production/no-JS/performance/commerce gates before any release decision.
3. For new implementation, use a clean worktree based on `38642b5e` and copy or re-create one reviewed lane at a time. Do not stage paths from this worktree in bulk.
4. The smallest safe next implementation slice is **not another visual expansion**: isolate and verify the already-committed homepage/picker candidate's production build/type failure first, without including account, payment/email, social or Ads paths. If its build fix requires any `Unknown` path above, stop and open that as a separately reviewed compatibility change.
5. Only after that gate can a later, separately approved mobile slice consider the uncommitted product-detail/cart/checkout UI paths. Its acceptance must preserve price/tax/cart payloads and use local mocks for writes.

## External-action boundary

This recovery performed no deploy, no social publication, no provider mutation, no customer email, and no order or payment creation.
