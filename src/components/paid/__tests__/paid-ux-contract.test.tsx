import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PAID_CART_ACTIONS, PaidCartConfirmation } from "../PaidCartConfirmation";
import {
  buildPaidQuotePayload,
  handlePaidQuoteTurnstileFailure,
  isPaidQuoteSubmitDisabled,
  PaidQuoteForm,
  resetPaidQuoteTurnstile,
  TURNSTILE_ERROR_MESSAGE,
  TURNSTILE_EXPIRED_MESSAGE,
} from "../PaidQuoteForm";
import { LICENSED_REVIEW_ROUTE, PaidReviewCards, VERIFIED_REVIEW_CARDS } from "../PaidReviewCards";

const originalTurnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

afterEach(() => {
  if (originalTurnstileSiteKey === undefined) {
    delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  } else {
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = originalTurnstileSiteKey;
  }
});

describe("paid landing UX contracts", () => {
  it("renders native, attributed review cards from the licensed review source", () => {
    const html = renderToStaticMarkup(<PaidReviewCards />);

    expect(VERIFIED_REVIEW_CARDS).toHaveLength(3);
    for (const review of VERIFIED_REVIEW_CARDS) {
      expect(html).toContain(review.name);
      expect(html).toContain(review.quote);
    }
    expect(html).toContain(`href="${LICENSED_REVIEW_ROUTE}"`);
    expect(html).toContain("Google reviews, verified by Trustindex");
  });

  it("keeps all three next-step actions visible after add to cart", () => {
    const html = renderToStaticMarkup(<PaidCartConfirmation productName="Vinyl Banners" />);

    expect(PAID_CART_ACTIONS.map(({ href }) => href)).toEqual([
      "/why-true-color",
      "/cart",
      "/checkout",
    ]);
    expect(html).toContain("Added to cart");
    expect(html).toContain("Continue shopping");
    expect(html).toContain("View cart");
    expect(html).toContain("Checkout");
    expect(html).toContain("aria-label=\"Cart next steps\"");
  });

  it("renders a compact, required-field quote form for the existing API flow", () => {
    const html = renderToStaticMarkup(<PaidQuoteForm />);

    expect(html).toContain("id=\"paid-compact-quote\"");
    expect(html).toContain("name=\"name\"");
    expect(html).toContain("name=\"email\"");
    expect(html).toContain("name=\"product\"");
    expect(html).toContain("name=\"details\"");
    expect(html).toContain("Request My Quote");
    expect(html).not.toContain("No file chosen");
  });

  it("builds an API-valid quote payload without exposing a quantity field", () => {
    const input = new FormData();
    input.set("name", "  Test Buyer  ");
    input.set("email", "buyer@example.com");
    input.set("product", "Vinyl Banners");
    input.set("details", "A custom banner size");

    const payload = buildPaidQuotePayload(input, "turnstile-token");
    const items = JSON.parse(String(payload.get("items"))) as Array<Record<string, string>>;
    expect(payload.get("name")).toBe("Test Buyer");
    expect(payload.get("email")).toBe("buyer@example.com");
    expect(payload.get("cf-turnstile-response")).toBe("turnstile-token");
    expect(items).toEqual([expect.objectContaining({
      product: "Vinyl Banners",
      qty: "To be confirmed",
      notes: "A custom banner size",
    })]);
  });

  it("disables quote submission while a configured Turnstile has no token", () => {
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = "test-site-key";
    const html = renderToStaticMarkup(<PaidQuoteForm />);

    expect(isPaidQuoteSubmitDisabled({
      status: "idle",
      turnstileConfigured: true,
      turnstileToken: "",
    })).toBe(true);
    expect(html).toMatch(/<button type="submit" disabled=""/);
    expect(html).toContain("Secure verification in progress…");

    expect(isPaidQuoteSubmitDisabled({
      status: "idle",
      turnstileConfigured: true,
      turnstileToken: "verified-token",
    })).toBe(false);
  });

  it.each([
    ["expired", TURNSTILE_EXPIRED_MESSAGE],
    ["error", TURNSTILE_ERROR_MESSAGE],
  ] as const)("clears and resets the widget when Turnstile is %s", (reason, expectedMessage) => {
    let token = "one-time-token";
    const reset = vi.fn();
    const reportError = vi.fn();

    handlePaidQuoteTurnstileFailure(
      reason,
      { reset },
      () => { token = ""; },
      reportError,
    );

    expect(token).toBe("");
    expect(reset).toHaveBeenCalledOnce();
    expect(reportError).toHaveBeenCalledWith(expectedMessage);
    expect(isPaidQuoteSubmitDisabled({
      status: "error",
      turnstileConfigured: true,
      turnstileToken: token,
    })).toBe(true);
  });

  it("consumes the token after an attempt and requires a fresh token before retry", () => {
    let token = "first-token";
    const reset = vi.fn();

    resetPaidQuoteTurnstile({ reset }, () => { token = ""; });

    expect(reset).toHaveBeenCalledOnce();
    expect(isPaidQuoteSubmitDisabled({
      status: "error",
      turnstileConfigured: true,
      turnstileToken: token,
    })).toBe(true);

    token = "fresh-retry-token";
    expect(isPaidQuoteSubmitDisabled({
      status: "error",
      turnstileConfigured: true,
      turnstileToken: token,
    })).toBe(false);
  });

  it("wires expiry, error, attempt-finally, and send-another resets into the form", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/paid/PaidQuoteForm.tsx"),
      "utf8",
    );

    expect(source).toContain("ref={turnstileRef}");
    expect(source).toContain('onExpire={() => handleTurnstileFailure("expired")}');
    expect(source).toContain('onError={() => handleTurnstileFailure("error")}');
    expect(source).toMatch(/finally\s*{\s*clearAndResetTurnstile\(\)/);
    expect(source).toContain("onClick={handleSendAnother}");
  });

  it("keeps ProductPageClient in the persistent confirmation state after adding", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/product/ProductPageClient.tsx"),
      "utf8",
    );

    expect(source).toContain("<PaidCartConfirmation productName={product.name} />");
    expect(source).toContain("!addedToCart && <div");
    expect(source).not.toContain("setTimeout(() => setAddedToCart(false)");
  });

  it("makes selected artwork uploads fail closed and keyboard operable", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/checkout/page.tsx"), "utf8");
    expect(source).toContain('role="button"');
    expect(source).toContain("tabIndex={0}");
    expect(source).toContain("tabIndex={-1}");
    expect(source).toContain('className="hidden"');
    expect(source).toContain('event.key === "Enter" || event.key === " "');
    expect(source).toContain("filePaths.length !== artworkFiles.length");
    expect(source).toContain("No order or payment was started");
    expect(source).toContain("Please enter a valid email address.");
  });
});
