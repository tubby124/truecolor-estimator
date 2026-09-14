# True Color Agentic Web + SEO Readiness Audit

- **Audit date:** 2026-09-14
- **Repository:** `tubby124/truecolor-estimator`
- **Checkout:** `/Users/owner/Downloads/Businesses/TrueColor/TRUE COLOR PRICING /truecolor-estimator`
- **Current branch / commit reviewed:** `main` at `8ea94bf8` (matching `origin/main` at final readback)
- **Runtime verification baseline:** `27c07f20`; the later `8ea94bf8` commit changed search documentation and a project-local skill only, not runtime source or dependencies
- **Audit type:** Read-only architecture, code, security, SEO, live-surface, and historical-plan review

## Executive verdict

True Color has a stronger foundation than a normal local print website, but it is **not yet safe to describe as an end-to-end agent-ready store**.

Two percentages matter because the old work had two different goals:

- **About 70% of the historical plan landed.** The site is unusually readable by search engines and AI systems, and much of the deterministic commerce identity work is present.
- **About 40% of genuine end-to-end agent readiness is present today.** An agent can find the business, read pages, inspect offers, reach the configurator, and obtain a price if it reverse-engineers the current interface. It cannot discover a supported action contract, safely stage an order, obtain explicit approval, submit exactly once, recover an uncertain result, and track the order through a documented machine interface.

The shortest honest summary is:

> **AI-readable: strong. Agent-operable: partial. Safely agent-transactional: not ready.**

Do not expose the existing order route as an agent tool. First place a small, versioned public contract in front of the existing pricing and commerce services, and split “prepare” from “confirm.”

## Readiness scorecard

| Area | Score | Current meaning |
| --- | ---: | --- |
| Search and AI discovery | **8/10** | Strong server-rendered pages, sitemaps, structured data, Merchant feeds, and `llms.txt` |
| Product identity and pricing truth | **7/10** | Stable commerce IDs and server repricing exist; a few human/agent reference files have drifted |
| Browser-agent usability | **6/10** | An agent with a browser can reach most public flows, but cart and checkout depend heavily on client state and JavaScript |
| Safe transaction execution | **3/10** | Existing order submission couples several irreversible side effects and has ambiguous retry behavior |
| Formal agent interoperability | **1.5/10** | No OpenAPI document, action manifest, option schema, scoped agent authorization, ACP/UCP adapter, or MCP surface |
| Privacy and operational safety | **5/10** | Several good controls exist, but confirmation links, artwork delivery, rate limiting, and consent actions need hardening |
| **End-to-end agent readiness** | **4/10** | Good foundation; the machine-action and safety layer is the missing middle |

These are architecture-readiness heuristics, not a blended SEO/marketing health score or a claim about current Google, ChatGPT, Merchant Center, or other provider approval. Organic search, GSC Generative AI, AI referrals, Maps/GBP, and paid orders remain separate evidence lanes. The browser-agent score is an inference from the rendered surfaces and code; no complete browser-agent or automated accessibility journey was run in this audit.

## What the old plan actually was

The repository history shows two related plans rather than one unfinished feature.

### Plan A: make the site discoverable and citable by AI

The March work added or strengthened:

- explicit AI/search crawler handling;
- `llms.txt`;
- WebSite, Organization/LocalBusiness, FAQ, Service, and product-related structured data;
- stable entity identifiers and provider relationships;
- image and page sitemap coverage;
- server-rendered service and product information.

That plan defined success mainly as **discoverable, extractable, and citable**. Most of it shipped.

### Plan B: create durable product identity from discovery to paid order

The later commerce plan asked for the same stable identity to survive this path:

```text
Merchant/feed offer
    -> canonical product family
    -> exact configuration and price
    -> cart and analytics
    -> server-repriced order
    -> invoice/payment session
    -> paid order record
```

Substantial pieces also shipped:

- stable product-family IDs;
- configuration fingerprints;
- Merchant offer IDs and versions;
- exact Merchant offer URLs;
- server-side repricing;
- durable order/payment identifiers;
- engine-derived Merchant feeds;
- database columns that preserve product and offer identity.

What did **not** ship was a formal, public, safe interface that lets an external agent use those capabilities without reverse-engineering the human UI.

## What works now

### Discovery and SEO foundation

- Indexed service and product content pages are server-rendered and carry conventional titles, descriptions, headings, canonicals, internal links, and structured data.
- `robots.txt`, XML sitemap, image sitemap, Merchant feeds, `security.txt`, and `llms.txt` respond in production.
- The live `llms.txt` is broad: 300 lines, about 124 unique URLs, with no dead destinations in the sampled link check. Eighteen links redirect, so it is useful but not fully canonical.
- Search and product pages return usable HTML to an OpenAI search crawler user agent.
- Security headers are strong: HSTS, a content-security policy, frame denial, and content-type protection were observed.
- Current local SEO evidence records good mobile Core Web Vitals for 98% of URLs.

Fresh provider evidence now proves real AI discovery, not just technical readiness:

- The authenticated Search Console Generative AI report returned **956 impressions across 99 pages** for 2026-08-16 through 2026-09-12, versus a rounded **1.35K** in the prior 28 days. That is about a 29% decline to monitor; the report does not expose queries, clicks, rank, orders, or a complete AI total.
- A separate completed 30-day GA4 read returned **69 ChatGPT sessions / 48 engaged**, **4 Claude / 3 engaged**, and **4 Gemini / 3 engaged**. None had an attributed ecommerce purchase or revenue. Existing acquisition attribution is not decision-grade, so this proves visits, not commercial outcome.

This is worth preserving. Current Google guidance still says ordinary SEO fundamentals are the basis for visibility in AI search; a second “AI-only SEO” site is not needed.

### Commerce and pricing foundation

- The pricing engine has validated input parsing and deterministic output.
- The order route performs server-side repricing rather than trusting browser totals.
- Product families have stable IDs, configuration fingerprints, offer IDs, and offer versions.
- The Merchant catalog contains 18 exact offers generated from current commerce truth.
- Payment tokens are scoped, expiring, rotation-aware, and timing-safe.
- Order/provider uniqueness and resume concepts already exist in the database and service layer.
- Exact product URLs can emit server-rendered Product/Offer data.

This means the expensive domain work is not being started from zero. The missing layer can reuse it.

### Current public journey

| Journey stage | Human/browser agent | Machine agent | Main gap |
| --- | --- | --- | --- |
| Discover business/services | Good | Good | Some public fact drift |
| Read policies | Good | Fair | Facts are not exposed through one canonical machine endpoint |
| Browse products | Good | Fair | No versioned catalog/options contract |
| Configure a product | Good with JavaScript | Weak | No public option schema or capability declaration |
| Get a price | Good | Technically possible | Current response exposes internal costing and is undocumented |
| Build/resume cart | Session-bound | Poor | Cart lives in browser `sessionStorage` |
| Review order | Good with JavaScript | Poor | No server-side checkout intent or stable review resource |
| Approve purchase | Human form action | Unsafe | No explicit agent/user approval receipt |
| Submit exactly once | Usually | Unsafe | Ambiguous failures cause the client to abandon the idempotency key |
| Track result | Link-based | Unsafe/undocumented | UUID bearer page exposes too much and lacks a scoped status contract |
| Upload artwork | Available | Unsafe for broad automation | Public-bucket assumptions and process-local rate limiting |

## Intended future-proof shape

The safest design is protocol-neutral in the middle, with thin adapters at the outside:

```text
Search engines / browser agents / ChatGPT / Google / future agents
                              |
           HTML + schema + feed + OpenAPI contract
                              |
        versioned catalog, estimate, policy, cart APIs
                              |
            PREPARE checkout (no external side effect)
                              |
             explicit human/agent approval receipt
                              |
        CONFIRM once (idempotent, durable, recoverable)
                              |
       Order DB -> Wave -> Clover -> email -> status
                              |
             thin UCP / ACP / WebMCP adapters
```

OpenAPI should come first because it is stable, testable, and not tied to one platform. Google’s Universal Commerce Protocol (UCP), the Agentic Commerce Protocol (ACP), browser-exposed tools such as WebMCP, or a future protocol should call the same underlying services. They should not each contain separate pricing or order logic.

## Findings, ordered by what blocks agent use

### P0 — Sanitize the public estimate surface before advertising it

**Evidence:** `src/app/api/estimate/route.ts`, `src/lib/engine/parse-request.ts`

The live estimate route accepts a structured request and calculates successfully, which is useful. Its public response also includes the internal cost breakdown and pricing rules that fired. The customer-facing interface hides those details, but the API currently returns the engine result directly. The route also has no durable public rate limit.

**Why it matters:** Publishing this route in OpenAPI would make private unit economics easy to extract at scale. It also couples a future public contract to internal engine fields.

**Required change:** Define a public response object containing only customer-safe fields: product/configuration identity, retail subtotal/tax/total, currency, price version, expiry, fulfillment facts, warnings, and a signed estimate reference. Apply a durable edge/database rate limit. Keep the full result server-side.

### P0 — Preserve the same idempotency key through uncertain checkout outcomes

**Evidence:** `src/app/checkout/page.tsx`, `src/app/api/orders/route.ts`, `src/lib/payment/__tests__/order-idempotency-contract.test.ts`

The server has meaningful reservation and resume logic. However, the checkout client deletes its logical submission key on every `409` or `503`. Those responses can occur after an order, Wave invoice, or Clover state may already exist. A retry can therefore become a new logical purchase.

**Why it matters:** Human double-clicks are dangerous; autonomous retries are much more likely. An agent must be able to ask, “What happened to this exact intent?” without creating a second intent.

**Required change:** Keep the original key for every ambiguous/recoverable result. Return a durable intent/order status URL. Mint a new key only when the server proves the old intent is terminal or a human explicitly abandons it.

### P1 — Split review from irreversible execution

**Evidence:** `src/app/api/orders/route.ts`

A successful order submission can create the order, provision a Wave invoice, create or resume a Clover session, and send messages in one flow. There is no public `prepare -> approve -> confirm` boundary.

**Why it matters:** An agent needs to show exactly what it intends to buy—including current price, tax, fulfillment, policy version, and uploaded artwork—then receive explicit authority before any external side effect.

**Required change:**

1. `prepare` validates, reprices, and stores a short-lived checkout intent with **no** provider or email side effects.
2. The user reviews an immutable summary and grants a scoped approval.
3. `confirm` consumes that approval exactly once and creates provider/customer side effects.
4. `status` allows safe recovery using the original intent ID.

### P1 — Replace UUID-only confirmation access with scoped, minimal access

**Evidence:** `src/app/order-confirmed/page.tsx`, `src/lib/analytics/path.ts`, `src/lib/analytics/google-ads.ts`

`/order-confirmed?oid=<uuid>` acts as a bearer link. It can retrieve customer email, order lines, totals, payment details, and a receipt token. The route is not classified with the other analytics-sensitive paths.

**Why it matters:** Links can leak through history, referrers, screenshots, logs, analytics, support messages, or an agent transcript.

**Required change:** Require authenticated ownership or a separate signed, short-lived, purpose-scoped token. Return the smallest useful status object. Do not expose a receipt token from an order UUID alone. Apply `no-store`, a strict referrer policy, and analytics exclusion.

### P1 — Make every GET operation side-effect free

The quote-payment link is deliberately review-only on GET, but the direct-order `/pay/[token]` page can still create or resume Clover provider state while rendering a GET. Automated scanners, link previewers, crawlers, and browsing agents routinely follow GET links.

**Required change:** GET may display state only. Creating/resuming payment state must be an idempotent POST after an explicit user action.

### P1 — Publish a supported machine contract

There is no OpenAPI document, public route allowlist, product option schema, action manifest, delegated-agent scope model, ACP adapter, UCP adapter, or MCP surface. The repository contains roughly 117 route handlers, but route existence is not a public contract.

`llms.txt` describes the company and links to human pages. It does not define request schemas, authorization, consent, idempotency, file handling, order status, or recovery.

**Required change:** Add a versioned, additive public surface:

- `GET /api/v1/catalog`
- `GET /api/v1/products/{product_id}`
- `GET /api/v1/products/{product_id}/configuration-schema`
- `POST /api/v1/estimates`
- `GET /api/v1/policies`
- later: server cart, checkout-intent prepare/confirm/status
- `/openapi.json` and a short human-readable agent integration page

Use consistent error envelopes, request IDs, ISO timestamps, CAD currency, explicit capability scopes, and documented retry rules.

### P1 — Do not wrap the current quote routes as agent actions

**Evidence:** `src/app/api/quote/route.ts`, `src/app/api/quote-request/route.ts`

`POST /api/quote` is a `501 Not Implemented` stub. The working `/api/quote-request` route is a human multipart/Turnstile workflow that can immediately write a quote, upsert a customer, create a confirmed authentication user, and send staff/customer notifications.

**Why it matters:** A machine client either reaches a dead endpoint or jumps directly into database, account, and communication side effects. There is no draft/review/consent/confirm boundary.

**Required change:** Do not advertise either current route as an agent tool. Build a versioned quote-intent flow that validates and prepares a review with no communications or account creation; require explicit contact consent and confirmation before the one-time handoff.

### P1 — Move cart and checkout state to resumable server resources

**Evidence:** `src/lib/cart/cart.ts`, `src/app/checkout/page.tsx`

Cart data lives in `sessionStorage`; checkout is a client component whose server HTML is mainly a loading skeleton. A browsing agent can operate it, but it cannot reliably hand the job to another session, device, or human, and a non-JavaScript client cannot review it.

**Required change:** Use an expiring, opaque server cart/intent ID. Render a useful review summary on the server. Keep the human UI; make it a client of the same contract.

### P1 — Protect artwork as private customer data

**Evidence:** `src/app/api/upload/route.ts`, account/staff upload routes, `src/lib/rateLimit.ts`

Artwork and proofs are built around permanent public-bucket URLs or a public fallback if signing fails. Anonymous upload accepts large multipart bodies, primarily trusts MIME/extension, returns storage paths, and uses a header-derived per-process limiter.

**Required change:** Keep the bucket private; use short-lived ownership-checked signed access only; bind pending uploads to a cart/checkout capability; validate file signatures and scan content; reject oversized bodies before full buffering; use a shared durable limiter; expire orphan uploads.

### P1 — Enforce coupon limits atomically

**Evidence:** `src/app/api/orders/route.ts`

The route counts redemptions before order creation and records the redemption later as a nonfatal step. Parallel requests can all observe remaining capacity and exceed the intended limit.

**Required change:** Claim redemption and create/reprice the order inside one database transaction or locked RPC, with database constraints for both global and customer limits.

### P2 — Reconcile public and internal facts before agents amplify them

Confirmed drift includes:

- website/schema review count `43` versus a current GBP baseline of `49`;
- an invalid or nonstandard `PrintShop` schema type in the local SEO baseline;
- `llms.txt` says `1–3 business days after art approval`, while the canonical commerce policy says `2–3 business days after art approval and payment`;
- 18 `llms.txt` destinations redirect;
- the active 24×36 ACP price is `$78` and the `$66` SKU is retired, while part of the quick reference and coding-agent price guard still call `$66` protected truth.

**Why it matters:** Agents repeat structured facts confidently. Conflicting “truth” files can also cause a future coding agent to restore a retired price.

**Required change:** Select one machine-readable authority for each fact and generate schema, feed, selected page facts, and AI summaries from it. Reconcile the ACP reference/guard without changing the current `$78` runtime. Respect the existing SEO rule of one controlled experiment at a time.

### P2 — Treat search crawlers and training crawlers as separate policy choices

The crawler list groups search/citation user agents with training crawlers. OpenAI distinguishes OAI-SearchBot/ChatGPT-User from GPTBot. CCBot is a separate third-party crawler.

**Required change:** Write down the owner’s policy for search inclusion, user-invoked browsing, and model training separately. Do not change access merely to follow a trend.

### P2 — Enrich exact-offer Product schema from the same commerce truth

Current exact-offer schema includes core name/SKU/description/brand/price/availability/condition fields. It does not include an image, shipping details, or merchant return policy.

**Required change:** Add only fields supported by current policy and fulfillment truth. Generate them from the same source as the Merchant feed. Do not invent shipping promises.

### P2 — Sign one-click unsubscribe and keep GET read-only

The current unsubscribe endpoint accepts a raw email address and mutates consent through GET or POST.

**Required change:** Use a signed opaque recipient token. GET should present confirmation; validated POST should perform the one-click mutation.

### P2 — Development dependency and local-machine hygiene

- Production dependency audit: **0 known vulnerabilities** with `npm audit --omit=dev`.
- Full dependency audit: **4 development-tool findings** (3 moderate, 1 high), with fixes available.
- The pre-audit install had Next `16.2.11` even though the committed package and lockfile require `16.3.4`. The dependency tree was restored from `package-lock.json`; exact-lock verification is recorded below.
- The npm cache had grown to 9.2 GB and filled the disk during the first reinstall attempt. Only the disposable npm cache was cleared; no source or user data was removed.

Development-only findings do not prove a production vulnerability, but CI and local builds should not depend on a stale install.

## SEO preservation rules for this work

Agent readiness should be additive. It does not require rebuilding the public site or rewriting ranking pages.

1. Keep current service/location page URLs, titles, H1s, canonicals, copy, and internal-link structure unless a separate SEO experiment approves a change.
2. Keep account, cart, checkout, confirmation, and write APIs out of the search index.
3. Keep machine endpoints concise and versioned; expose them through OpenAPI and a human integration page, not thousands of thin indexable URLs.
4. Generate feed, Product schema, catalog API, and transactional identifiers from the same commerce authority.
5. Separate `in_stock/orderable` from `on_hand/immediate`. Custom-made products can be orderable without pretending they are sitting on a shelf.
6. Keep `llms.txt` compact and canonical. Generate volatile facts. If long reference content is useful, link to a separate full Markdown resource.
7. Validate structured data and Merchant destinations after every identity or policy change.
8. Do not call Merchant work complete until provider approval and a public destination readback are observed.

## Recommended delivery sequence

### Phase 0 — Containment and truth (roughly 3–7 focused days)

- sanitize and rate-limit estimate output;
- fix idempotency-key handling and add status/resume semantics;
- secure confirmation access and remove GET side effects;
- reconcile the confirmed policy, review-count, redirect, schema-type, and ACP-reference drift;
- define the public/private route boundary.

**Exit proof:** cost fields cannot leave a public endpoint; the same failed/retried checkout intent cannot create a second logical order; no order data is retrievable by UUID alone.

### Phase 1 — Read-only agent contract (roughly 1–2 weeks)

- build versioned catalog, configuration-schema, estimate, and policy endpoints;
- publish OpenAPI and consistent error/idempotency documentation;
- make responses accessible and useful without JavaScript;
- generate public fields from existing domain truth.

**Exit proof:** a fresh client can discover and quote three materially different products using only the contract, with results matching the human estimator.

### Phase 2 — Agent-safe cart and checkout intent (roughly 2–4 weeks)

- introduce durable server carts;
- implement prepare/review/approve/confirm/status;
- add scoped capabilities, approval receipts, expiry, policy hashes, and exact retry behavior;
- make provider/email effects occur only after confirm;
- harden uploads, coupons, and status privacy.

**Exit proof:** duplicate, timed-out, stale-price, and interrupted submissions converge on one outcome; nothing external happens before approval.

### Phase 3 — Protocol adapters and one controlled pilot (roughly 1–3 weeks)

- add a thin UCP adapter first because the project already has Merchant product identity;
- add ACP where channel eligibility and onboarding support it;
- consider WebMCP for low-risk browser actions such as search, configure, preview, and add-to-cart;
- keep the protocol adapters out of pricing/order business logic.

**Exit proof:** one approved offer completes from discovery to a single provider-visible order and a customer-visible result, with IDs matched at every layer.

**Practical estimate:** about **4–8 focused engineering weeks** for one safe agent-commerce pilot, excluding provider waitlists/reviews. Broad product, upload, quote, payment, and post-purchase coverage is more like **8–12 weeks**. These ranges assume the work is kept additive and one pilot is proven before expansion.

## Acceptance journeys

The shared design is not proven by variations of one easy product. Test at least these three:

### Journey A — Exact Merchant offer, local pickup

- discover an exact offer ID;
- retrieve canonical product/configuration facts;
- create an estimate;
- prepare and review tax/pickup/policy facts;
- approve and confirm once;
- recover the same result after a simulated timeout;
- match feed offer ID, cart line, order line, provider record, and receipt.

### Journey B — Custom-size configured product with artwork

- retrieve allowed dimensions/options;
- reject an invalid combination with a stable error code;
- calculate a current price;
- privately upload and bind artwork;
- prepare/review/approve/confirm;
- prove another customer or leaked path cannot read the artwork.

### Journey C — Quote-only or exception path

- identify that the request cannot be purchased immediately;
- create a draft inquiry without emailing or creating provider state before approval;
- obtain explicit contact consent;
- confirm once;
- expose a minimal status/handoff reference.

Every journey must also cover stale price, expired intent, duplicate request, cancellation, consent, tax, fulfillment ambiguity, and a no-JavaScript/read-only path.

## No-ship gates

Do not claim end-to-end agent readiness while any of these are true:

- a public response exposes engine costs, margins, private rules, secrets, or excessive customer data;
- an ambiguous retry can create another logical order;
- GET can create payment/provider/customer-message side effects;
- an agent can create an order before a reviewable approval receipt exists;
- the public contract has no versioning, stable errors, status operation, or idempotency rules;
- artwork access depends on an unguessable public URL;
- three materially different acceptance journeys have not passed;
- a protocol demo works only by bypassing server repricing, policy truth, or existing SEO controls;
- provider approval or a recipient-visible result is inferred rather than observed.

## Verification receipts

### Repository and local checks

- Repository instructions, current-state documents, SEO standard, project-local search router, earlier audit, commerce plans, and relevant history were reviewed through current documentation commit `8ea94bf8`.
- `npm run validate:commerce-truth`: passed; two non-authoritative sources remain intentionally quarantined.
- Initial full check on the pre-audit dependency tree: ESLint had 0 errors and 28 warnings; TypeScript passed; 171 test files and 1,647 tests passed; pricing/commerce/Google Ads checks passed; production build passed.
- The stale local Next version was then detected, so that initial result is **not** presented as exact-lock proof.
- `npm ci` restored the committed dependency tree with Next `16.3.4`.
- Exact-lock `bash scripts/codex/check.sh --full` on runtime commit `27c07f20`: passed. ESLint reported 0 errors and 29 warnings; 171 test files and 1,647 tests passed; pricing validation completed with two non-blocking warnings; Google Ads checks passed; TypeScript and the production build passed. The later current commit `8ea94bf8` is documentation/skill-only; its project-record check was rerun separately.
- `npm audit --omit=dev`: 0 production findings.
- `npm audit`: 4 development-tool findings (3 moderate, 1 high).

### Live, non-mutating readback

- Public robots, AI summary, sitemaps, feeds, security policy, health endpoint, shipping/return policies, product pages, cart, and checkout responded successfully.
- Health returned `ok: true`.
- Merchant feed contained 18 offers.
- Exact offer URLs emitted server-rendered Product/Offer data.
- Product pages returned `noindex, follow`; this is a current launch/indexing choice, not proof that Merchant products are approved.
- The estimate endpoint was tested with a valid and invalid non-mutating calculation request; methods and validation behaved predictably, and the internal-field exposure was confirmed.

### Not verified or intentionally not mutated

- No order, invoice, Clover session, email, quote, lead, upload, payment, provider setting, Merchant status, or production data was created or changed.
- The last repository record reviewed said Merchant Center had 16 offers under review and none approved/publicly showing as of 2026-09-07. That provider status was **not authenticated and refreshed during this audit**, so it may have changed.
- Production smoke coverage deliberately stops before live payment and email completion.
- This audit created documentation only; it did not implement, deploy, publish, or submit the recommended changes.

## Current external standards consulted

- [Google: succeeding in AI search builds on SEO fundamentals](https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing)
- [OpenAI: search crawler, user agent, and GPTBot controls](https://help.openai.com/en/articles/12627856)
- [OpenAI: shopping research uses merchant product data and public web information](https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt)
- [Agentic Commerce Protocol documentation](https://www.agenticcommerce.dev/docs)
- [Google Universal Commerce Protocol documentation](https://developers.google.com/merchant/ucp)
- [UCP announcements and version changes](https://ucp.dev/documentation/announcements/)
- [Chrome WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp)
- [`llms.txt` proposal](https://llmstxt.org/)

## Bottom line

The previous tokens were not wasted. They produced a real head start: clean discovery surfaces, strong SEO plumbing, stable offer identity, server repricing, and usable commerce internals.

The remaining work is also not “add more AI text.” It is a bounded transaction-safety and interoperability project:

1. close the privacy/retry leaks;
2. publish a safe read-only contract;
3. add prepare/approve/confirm/status;
4. attach UCP/ACP/WebMCP as thin adapters;
5. prove one end-to-end offer without weakening SEO.

That is the path from a website agents can **read** to a store agents can **use responsibly**.
