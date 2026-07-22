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
  });
});
