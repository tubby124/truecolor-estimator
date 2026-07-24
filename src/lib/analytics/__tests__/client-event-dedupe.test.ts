import { describe, expect, it } from "vitest";
import {
  BEGIN_CHECKOUT_EVENT_KEY,
  checkoutEventFingerprint,
  claimClientEvent,
  purchaseEventStorageKey,
} from "@/lib/analytics/client-event-dedupe";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("client analytics deduplication", () => {
  it("claims the same event fingerprint only once", () => {
    const storage = memoryStorage();
    expect(claimClientEvent(storage, BEGIN_CHECKOUT_EVENT_KEY, "cart-a")).toBe(true);
    expect(claimClientEvent(storage, BEGIN_CHECKOUT_EVENT_KEY, "cart-a")).toBe(false);
    expect(claimClientEvent(storage, BEGIN_CHECKOUT_EVENT_KEY, "cart-b")).toBe(true);
  });

  it("changes the checkout fingerprint when the cart changes", () => {
    const first = checkoutEventFingerprint([
      { id: "a", product_slug: "stickers", qty: 25, sell_price: 30 },
    ]);
    const changed = checkoutEventFingerprint([
      { id: "a", product_slug: "stickers", qty: 50, sell_price: 45 },
    ]);
    expect(first).not.toBe(changed);
  });

  it("scopes purchase claims by order number", () => {
    expect(purchaseEventStorageKey("TC-2026-1001")).toBe(
      "tc_analytics_purchase:TC-2026-1001",
    );
  });

  it("fails open when storage is unavailable", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(claimClientEvent(blocked, "key", "value")).toBe(true);
  });
});
