import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relative: string) {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("paid funnel event ownership", () => {
  it("uses the exact paid landing and product selection event names", () => {
    expect(source("src/lib/analytics.ts")).toContain('gtag("event", "view_paid_landing"');
    expect(source("src/components/paid/PaidProductLink.tsx")).toContain('window.gtag("event", "select_product"');
  });

  it("durably owns quote_submit on the successful DB insert path, not the browser", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("AFTER INSERT ON public.quote_requests");
    expect(migration).toContain("VALUES (NEW.id, 'quote_submit')");
    expect(source("src/app/api/quote-request/route.ts")).not.toContain('event_name: "quote_submit"');
    expect(source("src/components/paid/PaidQuoteForm.tsx")).not.toContain("trackQuoteSubmit");
  });

  it("keeps add-to-cart and checkout-start names aligned with GA4 commerce", () => {
    const analytics = source("src/lib/analytics.ts");
    expect(analytics).toContain('gtag("event", "add_to_cart"');
    expect(analytics).toContain('gtag("event", "begin_checkout"');
    const checkout = source("src/app/checkout/page.tsx");
    expect(checkout).toContain("cart.length > 0");
    expect(checkout).toContain("BEGIN_CHECKOUT_EVENT_KEY");
    expect(checkout).toContain("checkoutEventFingerprint(cart)");
  });

  it("delegates every customer tel link through one global tracker", () => {
    const tracker = source("src/components/site/CallTracker.tsx");
    expect(tracker).toContain('document.addEventListener("click", handleClick, { capture: true })');
    expect(tracker).toContain('closest<HTMLAnchorElement>(\'a[href^="tel:"]\')');
    expect(tracker).toContain('anchor.dataset.callPlacement ?? "tel_link"');
    const paidLinks = source("src/components/paid/PaidProductLink.tsx");
    expect(paidLinks).toContain("data-call-placement={placement}");
    expect(paidLinks).not.toContain("trackClickToCall");
  });

  it("mounts that tracker on every surface that renders a tel: link", () => {
    // SiteNav covers the main tree. These four render outside it — the paid
    // landing page has its own layout, and /pay, error and 404 bypass it — so
    // each needs its own mount or the calls placed from them are invisible.
    for (const surface of [
      "src/components/site/SiteNav.tsx",
      "src/app/why-true-color/layout.tsx",
      "src/app/pay/[token]/page.tsx",
      "src/app/error.tsx",
      "src/app/not-found.tsx",
    ]) {
      expect(source(surface), surface).toContain("<CallTracker />");
    }
  });

  it("marks the displayed number for the Google Ads swap without touching JSON-LD", () => {
    for (const surface of [
      "src/app/why-true-color/layout.tsx",
      "src/app/contact/page.tsx",
    ]) {
      expect(source(surface), surface).toContain('className="tc-phone"');
    }
    // The JSON-LD telephone is a structured-data contract with Search; a
    // forwarding number there would misrepresent the business.
    const layout = source("src/app/layout.tsx");
    expect(layout).toContain('telephone: "+13069548688"');
    expect(layout).not.toMatch(/tc-phone/);
  });

  it("keeps the paid landing view attributable to the page it fired on", () => {
    const analytics = source("src/lib/analytics.ts");
    expect(analytics).toContain("export function trackPaidLandingView(pagePath?: string)");
    expect(analytics).not.toContain('page_path: "/why-true-color"');
  });

  it("uses the order UUID for server-side purchase deduplication", () => {
    const measurement = source("src/lib/analytics/measurementProtocol.ts");
    expect(measurement).toContain("export function sendMeasurementProtocolPurchase");
    expect(measurement).toContain('currency: "CAD"');
    for (const route of [
      "src/app/api/webhooks/clover/route.ts",
      "src/app/api/staff/orders/[id]/confirm-clover/route.ts",
      "src/app/api/staff/orders/[id]/confirm-etransfer/route.ts",
      "src/app/api/staff/orders/[id]/status/route.ts",
      "src/app/api/cron/reconcile-payments/route.ts",
      "src/lib/payment/wave-payment-effects.ts",
    ]) {
      expect(source(route), route).toContain("sendMeasurementProtocolPurchase");
    }
    expect(source("src/lib/payment/wave-payment-effects.ts")).toContain("transaction_id: order.id");
    expect(source("src/app/order-confirmed/PurchaseEvent.tsx")).toContain("transaction_id: orderId");
  });
});
