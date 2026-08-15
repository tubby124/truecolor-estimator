# Meta PPC Measurement Runbook

The site uses Meta dataset **1413637299787953** (`truecolor`) for a consent-aware web Pixel and Conversions API (CAPI) setup.

## What the site sends

| Funnel action | Browser Pixel | Server CAPI | Optimizes |
| --- | --- | --- | --- |
| Product page view | `ViewContent` | — | Retargeting audiences |
| Add to cart | `AddToCart` | — | Retargeting audiences |
| Checkout opened | `InitiateCheckout` | — | Retargeting audiences |
| Quote/contact/portal form submitted | `Lead` | `Lead` | Lead campaigns |
| Payment verified | `Purchase` | `Purchase` | Revenue campaigns |

`Lead` and `Purchase` use matching event IDs across browser and server, so Meta deduplicates them. Purchases are sent only after a Clover webhook or staff payment confirmation; redirecting to a thank-you page never by itself counts as a sale.

Meta tracking is disabled unless the visitor accepts the optional marketing-cookie banner. The server stores `_fbp` and `_fbc` only for a consenting checkout and uses them only for the later verified purchase event.

## One-time production activation

1. In Meta Events Manager, open dataset `truecolor` (Pixel ID `1413637299787953`). Confirm `truecolorprinting.ca` is connected and verify the domain in Business Settings if it is not already verified.
2. In Events Manager, generate a Conversions API access token for this dataset. Do not put it in Git or a client-side variable.
3. In Railway, add these service variables:

   ```text
   NEXT_PUBLIC_META_PIXEL_ID=1413637299787953
   META_CAPI_ACCESS_TOKEN=<token from Events Manager>
   META_CAPI_GRAPH_VERSION=v23.0
   ```

4. Apply `supabase/migrations/20260815110000_meta_capi_attribution.sql` to the production Supabase project, then deploy the application.
5. For validation only, add `META_CAPI_TEST_EVENT_CODE=<Events Manager test code>`. Open an incognito browser, accept marketing cookies, submit a test quote, and confirm both Pixel and server `Lead` events appear in Events Manager's Test Events view as one deduplicated event. Remove the test-code variable after validation.
6. Run one real-value test order through the normal payment-confirmation path and confirm one deduplicated `Purchase` with CAD value. Do not use a successful redirect as proof—wait for the Clover webhook or staff confirmation.

## Campaign configuration

1. Use the **Sales** objective with website conversion location.
2. Start cold campaigns optimized for `Lead` until purchase volume is consistently sufficient for Purchase optimization. Move proven campaigns to `Purchase` after roughly 20+ verified purchases per week; this is an operating threshold, not a pricing rule.
3. Create audiences for 30-day `ViewContent`, `AddToCart`, and `InitiateCheckout` visitors; exclude 180-day `Purchase` visitors from prospecting.
4. Create a custom conversion for quote leads only if the native `Lead` event needs additional reporting segmentation. Do not create a URL-only purchase conversion.
5. Add this UTM pattern to each ad URL so Meta, GA4, and order records align:

   ```text
   utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
   ```

## Weekly PPC check

- Events Manager: event match quality, deduplication, and diagnostics.
- Ads Manager: spend, landing-page views, `Lead`, `Purchase`, cost per lead, cost per purchase, and purchase value.
- Site records: compare paid-social order and quote counts against Ads Manager. Investigate material differences before changing budget.
- Remove `META_CAPI_TEST_EVENT_CODE` immediately after test verification; it is for testing only.
