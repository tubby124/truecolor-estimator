import { afterEach, describe, expect, it, vi } from "vitest";
import { CloverCheckoutError, createCloverCheckout } from "../clover";

const originalKey = process.env.CLOVER_ECOMM_PRIVATE_KEY;
const originalMerchant = process.env.CLOVER_MERCHANT_ID;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.CLOVER_ECOMM_PRIVATE_KEY;
  else process.env.CLOVER_ECOMM_PRIVATE_KEY = originalKey;
  if (originalMerchant === undefined) delete process.env.CLOVER_MERCHANT_ID;
  else process.env.CLOVER_MERCHANT_ID = originalMerchant;
});

function configure() {
  process.env.CLOVER_ECOMM_PRIVATE_KEY = "private";
  process.env.CLOVER_MERCHANT_ID = "merchant";
}

describe("Clover checkout outcome classification", () => {
  it("classifies missing configuration and 4xx responses as definite failures", async () => {
    delete process.env.CLOVER_ECOMM_PRIVATE_KEY;
    await expect(createCloverCheckout(1000, "Quote")).rejects.toMatchObject({ outcome: "definite" });

    configure();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })));
    await expect(createCloverCheckout(1000, "Quote")).rejects.toMatchObject({ outcome: "definite" });
  });

  it("classifies network loss and 5xx responses as ambiguous", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network lost")));
    await expect(createCloverCheckout(1000, "Quote")).rejects.toMatchObject({ outcome: "ambiguous" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unknown", { status: 503 })));
    await expect(createCloverCheckout(1000, "Quote")).rejects.toBeInstanceOf(CloverCheckoutError);
    await expect(createCloverCheckout(1000, "Quote")).rejects.toMatchObject({ outcome: "ambiguous" });
  });

  it("returns a resumable URL, session id, and expiry", async () => {
    configure();
    const expirationTime = Date.now() + 15 * 60_000;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      href: "https://checkout.clover.test/session",
      checkoutSessionId: "session-1",
      expirationTime,
    }), { status: 200 })));
    await expect(createCloverCheckout(1000, "Quote")).resolves.toEqual({
      checkoutUrl: "https://checkout.clover.test/session",
      sessionId: "session-1",
      expiresAt: new Date(expirationTime).toISOString(),
    });
  });
});
