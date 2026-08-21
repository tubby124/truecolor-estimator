# True Color Paid Funnel Cost Repair — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Reduce paid-search CPA by replacing generic paid-traffic browsing with an instrumented, intent-matched path into a product configurator, while making analytics trustworthy enough to judge the result.

**Architecture:** Keep the CA$30/day cap and current campaign state unchanged. First stop synthetic GA4 pollution and establish a clean baseline. Then replace the generic paid landing route with purpose-built chooser routes: one for generic print-price demand and one for generic sign-shop demand. Each route sends the buyer to a small set of directly orderable configurators or a clearly scoped custom-quote path; it must preserve existing paid click IDs and event taxonomy.

**Tech Stack:** Next.js 16, TypeScript, GA4/gtag, Supabase order/quote attribution, Google Ads controlled campaign config, Vitest, Playwright.

**Baseline evidence (2026-08-21):**
- Paid search: CA$397.65 / 250 clicks / CA$1.59 CPC / two attributable purchases.
- `/why-true-color`: 59 paid sessions but only one add-to-cart and one checkout start.
- Generic Print Price and Generic Sign Shop currently send traffic to `/why-true-color?source=google-ads`.
- 76 synthetic `tc_core` sessions remain in production GA4.

**Hard constraints:**
- No Google Ads budget, bidding, keyword, or campaign-status mutation in this plan.
- No invented pricing or claims; existing sourced approved claims only.
- Preserve click-ID / UTM handling, privacy safeguards, and real conversion upload rules.
- Do not modify protected organic SEO pages. New paid-only pages must be `noindex`.
- One meaningful routing change at a time; do not decorate a tiny sample with A/B clutter.

## Red-team amendment — approved experiment posture

Do **not** repoint both generic groups together. The two proven paid purchases cannot currently be tied to `/why-true-color`, so the landing page is a high-confidence friction hypothesis, not a proven revenue killer.

1. Ship analytics hygiene and both new routes without changing Google Ads.
2. Preserve `/why-true-color` as the control.
3. Move **Generic Print Price only** first: it is the highest-spend generic route (CA$89.39 / 58 clicks in the initial 30-day audit). Keep Generic Sign Shop on control.
4. Freeze budget, bids, keywords, ad copy, targeting, and all other final URLs for the measurement window.
5. Compare 14 completed days after the change against the 14 completed days before it. Primary success = attributable paid order or qualified paid quote; secondary diagnostics = chooser selection, cart, checkout start. Guardrails = CTR, CPC, approved claims, final URL health, and conversion-upload continuity.
6. Repoint Generic Sign Shop only if the first test improves the secondary funnel without damaging primary business outcomes. Never call a higher `price_calculated` count a win by itself.

The current Google conversion values exclude sales tax (CA$87.50 versus a CA$97.13 paid order; CA$51.82 versus CA$57.52). Keep tax out of future value bidding, but before Maximize Conversion Value/Target ROAS, decide whether the optimization value should be net sale or contribution margin. Do not let the algorithm optimize for cheap CA$25 orders simply because they are easier to convert.

---

### Task 1: Stop synthetic production GA4 traffic

**Objective:** Ensure Playwright paid-journey tests cannot generate GA4 sessions in production.

**Files:**
- Modify: `e2e-playwright/seo-paid-journeys.spec.ts`
- Inspect/modify as required: `src/lib/analytics.ts`, analytics bootstrap component(s)
- Test: existing paid-journey test plus a focused analytics guard test

**Step 1: Write a failing regression test**
- Prove a URL containing `utm_campaign=tc_core` cannot call `gtag` in the production analytics configuration.
- Preserve normal GA4 events for real Google Ads traffic.

**Step 2: Verify the exact source of pollution**
- Confirm the test currently opens `https://truecolorprinting.ca/why-true-color?...utm_campaign=tc_core...`.
- Confirm whether the test uses a live browser / production host and whether analytics is loaded.

**Step 3: Implement smallest safe guard**
- Prefer a test-only analytics-disable signal that cannot be supplied by a real visitor (for example, controlled Playwright init state or local/staging host).
- Do not suppress real `google / cpc` sessions merely because they contain UTM parameters.
- Remove or rename `tc_core` only after the no-production-event guard is in place.

**Step 4: Verify**
- Run focused unit test.
- Run only the paid Playwright journey in a safe environment.
- Query GA4 after the next reporting window; `tc_core` must not increase.

**Step 5: Commit**
- `test: block synthetic paid-journey analytics from production`

---

### Task 2: Add a paid-route funnel ledger

**Objective:** Make every paid landing route comparable without counting reactive calculator events as unique buyer intent.

**Files:**
- Modify: `src/lib/analytics.ts`
- Modify: `src/components/paid/PaidProductLink.tsx`
- Modify/create: paid funnel report and its tests under `scripts/google-ads/`
- Test: analytics and reporting tests

**Step 1: Write failing tests**
- A paid route records: landing path, product chooser selection, product-view, add-to-cart, checkout start, and paid purchase.
- Events retain a normalized pathname only; no raw query strings, click IDs, email, or phone fields.

**Step 2: Implement event/ledger rules**
- Use `select_item` as the canonical product-choice event, with placement and destination.
- Report unique sessions/users or event counts with clear labels; do not present raw `price_calculated` fires as buyer count.
- Add a 7-day route report: spend, clicks, paid sessions, chooser selections, carts, checkout starts, paid quotes, paid orders, attributed revenue.

**Step 3: Verify**
- Existing analytics tests pass.
- A controlled local/staging journey produces exactly one event per intended milestone.
- Read-only report output has no PII/click IDs.

**Step 4: Commit**
- `feat: add paid-route funnel ledger`

---

### Task 3: Build a generic-print-price chooser route

**Objective:** Replace generic `printing prices` browsing with a short decision page that sends buyers directly to the most likely orderable product.

**Files:**
- Create: `src/app/printing-prices-order-online/page.tsx` (name can change only if route inventory requires)
- Create/reuse: `src/components/paid/` chooser component
- Modify: metadata/noindex route handling if needed
- Test: route/component tests and Playwright mobile/desktop smoke

**Required UX:**
- Above the fold: “What are you printing?” with a maximum of six sourced choices relevant to paid generic print demand.
- Each choice directly opens its matching configurator: e.g. business cards, stickers/labels, flyers, posters, banners, signs.
- One clearly labelled custom-quote path for jobs that do not fit standard products.
- Do not send the primary CTA to `/products` or require a buyer to browse a large catalogue.
- Keep local trust/pickup and price transparency concise; no invented turnaround or price claims.
- `noindex,follow`; preserve all UTM/click-ID capture.

**Step 1: Write failing route tests**
- Route is noindex, renders required orderable links, and sends product-selection analytics with the paid landing placement.

**Step 2: Implement minimal page**
- Reuse product data and `PaidProductLink`; do not duplicate hardcoded prices.

**Step 3: Verify**
- 375px and desktop screenshots.
- Every product link returns 200 and opens an orderable configurator.
- Keyboard navigation and visible focus states work.

**Step 4: Commit**
- `feat: add generic print-price paid chooser`

---

### Task 4: Build a generic-sign-shop chooser route

**Objective:** Stop generic sign demand from landing in a mixed print catalogue.

**Files:**
- Create: `src/app/sign-shop-order-online/page.tsx`
- Reuse: paid chooser component from Task 3
- Test: route/component tests and Playwright smoke

**Required UX:**
- Above the fold: coroplast/yard signs, aluminum/ACP signs, banners, window decals, vehicle graphics/custom quote.
- Every standard option links directly to an orderable configurator; non-standard vehicle/sign-install work goes to the quote path.
- Copy must use only approved sourced claims and avoid buyer-demographic targeting.
- `noindex,follow`; preserve paid attribution.

**Step 1: Write failing route tests.**

**Step 2: Implement using the shared chooser.**

**Step 3: Verify mobile/desktop, links, events, and route headers.**

**Step 4: Commit.**
- `feat: add generic sign-shop paid chooser`

---

### Task 5: Run a controlled destination experiment

**Objective:** Change only final URLs after Tasks 1–4 are production proven.

**Files:**
- Modify: `docs/paid-search/campaign-config.mjs`
- Modify: corresponding validator, node-test expected counts, generated CSV/editor artifacts, and `COPY-LEARNING-LOG.md`
- Test: full Google Ads controlled config suite and destination probe

**Step 1: Preflight**
- Read current campaign/ad groups/final URLs, spend, and conversion outbox.
- Confirm generic-print-price → print-price chooser and generic-sign-shop → sign chooser are the only two proposed changes.
- Keep every product-specific ad group on its dedicated product route.

**Step 2: Add failing contract tests**
- Exact final URL expectations, no broad-keyword changes, approved claims resolve, and destination checks return 200.

**Step 3: Implement config-only destination changes**
- No budget/bid/status mutation.
- Preserve UTM suffix and campaign/adgroup IDs.

**Step 4: Validate then deploy**
- Run local validator, node tests, generated artifact `--check`, read-only live drift check, then validate-only mutation.
- Execute only after the build and final URL checks are clean; read back live final URLs after mutation.

**Step 5: Commit and document**
- Record baseline and exact experiment start date in `COPY-LEARNING-LOG.md`.

---

### Task 6: Evaluate before changing bidding or budget

**Objective:** Keep the campaign from optimizing to noise.

**Decision gate:** after at least 14 completed days from the destination change, compare the new routes with the pre-change baseline.

**Required readout:**
- spend, clicks, paid sessions;
- chooser selections;
- cart and checkout-start rate;
- paid quote requests;
- attributable paid orders/revenue;
- unattributed commercial sales, separately;
- search-term quality and landing-route split.

**Rules:**
- Do not raise daily budget merely because Lost IS (budget) is non-zero.
- Do not switch to Maximize Conversions until clean conversion volume is sustained and there is a defensible cost-per-qualified-order baseline.
- Treat any reach for the CA$600 hard stop as a deliberate decision point, not an automatic scale signal.

---

## Final integration verification

1. Full production build with sufficient Node heap.
2. Targeted analytics, paid route, and Google Ads config tests.
3. Authenticated staff route remains unchanged.
4. Live route HTTP checks through the Railway origin with the production Host header.
5. Read-only GA4/Ads/Supabase report confirms event and attribution continuity.
6. Independent code-quality review before any live Google Ads destination mutation.
