# Daily social posting, caption facts and image treatment audit

September 6, 2026. Audited canonical source at `40868735`; public homepage/products read this session. This is a local audit and proposed build order, not an implementation or fresh protected scheduler/provider readback. Owner reports automatic posting is working. Existing delivery receipts remain in the practice and Sunday runbooks.

## Verified implementation

- Caption API (`src/app/api/staff/social/captions/route.ts`) calls OpenRouter with `anthropic/claude-sonnet-4-6`, including optional image input. It returns three platform captions and hashtags. No live research, catalogue retrieval, explicit timeout, cost metering or full response schema validation in this route.
- `src/lib/data/social-hashtags.ts` supplies hardcoded business facts, prices, competitor comparisons, seasonal 2026 templates and a request for 12–15 hashtags. This conflicts with the maintained shop-voice direction. Example: prompt says retractable banners start around $110; public homepage currently says $219. Neither homepage marketing text nor model recall replaces pricing-engine validation for an actual offer.
- Batch UI caps seven photos, prepares sequentially in the browser and defaults to weekly spacing. API caps 14 destination rows: seven photos on two platforms. One daily creative for 365 days means 730 FB/IG delivery records.
- Existing VPS runner requires exactly six IDs and an expiry. General app cron can read ten approved due rows per invocation, limited to the preceding hour. A missed hour requires an explicit recovery policy. Annual scheduling requires an ongoing hosted trigger, not simply increasing upload limits.
- Approval binds exact content, target, schedule and media hash. Uncertain delivery holds for reconciliation instead of blind retries. Retain these protections.
- Upload uses Sharp: rotate, strip metadata, downsize widths over 1080, JPEG quality 85 or retain PNG. No enlargement, background removal or studio enhancement. Public delivery derivatives and private original library are distinct.
- Dated library receipt reports 519 byte-unique originals. This is not proof of 519 distinct, cleared, unused social subjects. Visual deduplication and usage rotation remain necessary.
- Runtime is single-business: global Meta configuration, staff authorization and Regina timezone. Resale requires account isolation and onboarding, not just changing prompts.

## Recommended product behaviour

Build a versioned business profile from structured catalogue (`src/lib/data/products-content.ts`), current pricing tables/engine, approved service facts, verified product URLs and shop voice. Public website content can suggest subjects; conflicting prices, availability or turnaround claims must be held or omitted. Preserve source and checked date per claim. Never infer material, size or customer satisfaction solely from an image.

For each photo: identify likely product and confidence; match a real catalogue entry; choose a useful audience/angle; select an appropriate image treatment; generate platform-specific captions, product link and a small relevant hashtag set; validate facts and repetition; present the exact final media/copy/date for batch approval. Low-confidence product matches need review.

Hashtag research should maintain dated candidate sets by product, audience and location, with periodic platform-policy verification and performance review. Suggested starting policy: 3–5 specific Instagram tags, separately configurable Facebook tags. These are relevance candidates, not claimed high-volume or guaranteed-reach tags. Example for a verified Saskatoon banner photo: #Saskatoon #YXE #VinylBanners #CustomBanners #SaskatoonBusiness. Do not label model-generated guesses as researched trends. Current five-tag rollout details were reported in search results but not independently confirmed from a primary announcement in this audit.

Plan 365 calendar days (start date configurable), finalize in rolling 30-day batches, allow an entire evergreen year to be drafted if desired. Rotate products, customer uses, process, useful tips, design help and seasonal preparation. Add exact/visual duplicate detection, previous-post history, asset cooldowns and an explicit evergreen/date-sensitive distinction. Changed source facts flag affected drafts; never silently rewrite approved content. Track saves, profile actions and attributable enquiries alongside reach. Daily cadence is a test, not a promised growth outcome.

## Owner editorial direction — September 6 follow-up

Owner wants a recognizable brand built mainly around real client showcases, with an offer every one or two weeks and later coordinated Google Business Profile offers. This supersedes a price-led default for every caption. Proposed 14-day mix: 10 client showcases, 3 process/helpful-detail posts, 1 offer; replace one showcase with a second offer when weekly promotion is warranted. This is a starting experiment, not an algorithm claim or approved calendar.

Showcase structure: concrete customer need (only if known), observable print detail, finished result, optional low-pressure invitation. Vary close-ups/full product/installation views and openings. Never invent customer outcomes, quotes, location or job recency. Use consistent restrained backgrounds for loose products and retain genuine installation context. Avoid adding a sales graphic or price to every photo.

Keep one structured offer record with eligible products, exact value, start/end dates, timezone, exclusions, source-approved price and landing page. Render channel-specific copy for IG/FB and later GBP from the same record. Expired offers must be excluded from new scheduling. GBP is future work; no connection, offer creation or publication was performed. Coordinate campaigns across channels without requiring identical wording. Evaluate reach, saves/shares, profile visits and attributable enquiries; no guaranteed visibility or sales claim.

## Image treatment

1. Loose cards, signs and other standalone products: segment the product, preserve its printed surface, composite onto a consistent neutral studio background and add restrained shadow. Review edges, colour and typography.
2. Installed wall/window/vehicle graphics: retain installation context; crop/straighten and cautiously correct exposure/noise. Do not turn an installed sign into a floating studio product.
3. Already good photographs: retain them. Low-resolution or blurred photographs: prefer a better original; enlarging pixels cannot guarantee recovered text/detail.

Keep immutable originals and private reviewed masters; create final social derivatives last. Generative image editing can change text, logos, geometry or colours even when asked not to. For exact artwork, preserve/composite original product pixels; use generation for backgrounds only. OCR and comparison can assist review but do not prove fidelity. ChatGPT/Codex image editing is suitable for a small manual visual trial; unattended commercial processing should use a metered API. No images were edited or sent to an image provider during this audit.

## Provider choice and cost

Keep OpenRouter initially; make provider/model configurable and test the same 20–30 representative photos for factual accuracy, voice, valid output, latency and cost. It is a routing layer; quality is substantially controlled by the supplied facts and prompts. Add schema validation, bounded retries/timeouts, per-business budgets and explicit provider privacy settings. Direct OpenAI or Anthropic reduces intermediaries; OpenRouter makes provider changes easier.

Illustration only: at Sonnet 4.6 published USD $3/M input and $15/M output, 2,000 total input tokens plus 500 output tokens costs $0.0135 per creative, about $4.93 for 365 single-pass generations. Actual image-token use, longer output, retries, routing/funding fees, research, editing and hosting change the total. One generation can produce both platform captions. Measure actual usage before pricing a service. ChatGPT subscription and API billing are separate.

## Build order and acceptance

1. Replace static caption facts with the profile/catalogue sources and schema validation; test unsupported claims, ambiguous product photos and source changes.
2. Add daily cadence, resumable background preparation, paginated queue/calendar, grouped monthly approval, usage history and an ongoing monitored trigger. Test timezone boundaries, missed schedules, partial platform success and duplicate-dispatch prevention.
3. Trial 10 representative image treatments with original/final comparison before integrating any paid image service.
4. Extract reusable business profiles, tenant-scoped data/storage/credentials, owner roles, OAuth onboarding, token health, per-client limits and costs. Verify required Meta access/review for external client accounts. Start with a managed pilot before self-service resale.

## Research sources

- [True Color homepage](https://truecolorprinting.ca/) and [products](https://truecolorprinting.ca/products), read September 6.
- [OpenRouter routing](https://openrouter.ai/docs/guides/routing/provider-selection).
- [Sonnet 4.6 pricing](https://platform.claude.com/docs/en/models/sonnet-4-6/overview).
- [ChatGPT image editing](https://help.openai.com/en/articles/11084440-chatgpt-images).
- [OpenAI image API guide](https://developers.openai.com/api/docs/guides/image-generation).
- [Separate ChatGPT/API billing](https://help.openai.com/en/articles/9039756-chatgpt-search).
- [Photoroom product-image API](https://www.photoroom.com/api), a candidate for segmentation trials, not selected or purchased.
- [Meta official Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).
