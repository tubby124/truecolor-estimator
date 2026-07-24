import { describe, expect, it } from "vitest";
import {
  clearQuoteSubmission,
  fingerprintQuotePayload,
  getOrCreateQuoteSubmission,
} from "@/lib/quote-request-client";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function quotePayload(name = "Taylor") {
  const payload = new FormData();
  payload.append("name", name);
  payload.append("email", "taylor@example.com");
  payload.append(
    "items",
    JSON.stringify([{ product: "Coroplast Signs", qty: "10" }]),
  );
  return payload;
}

describe("quote request browser idempotency", () => {
  it("reuses one key for the same payload across remounts and reloads", () => {
    const storage = new MemoryStorage();
    const first = getOrCreateQuoteSubmission("paid", quotePayload(), {
      storage,
      randomUUID: () => "11111111-1111-4111-8111-111111111111",
    });
    const retry = getOrCreateQuoteSubmission("paid", quotePayload(), {
      storage,
      randomUUID: () => "22222222-2222-4222-8222-222222222222",
    });

    expect(retry).toEqual(first);
  });

  it("uses a new key when the customer changes the logical quote", () => {
    const storage = new MemoryStorage();
    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ];
    const first = getOrCreateQuoteSubmission("paid", quotePayload("Taylor"), {
      storage,
      randomUUID: () => ids.shift()!,
    });
    const changed = getOrCreateQuoteSubmission("paid", quotePayload("Morgan"), {
      storage,
      randomUUID: () => ids.shift()!,
    });

    expect(changed.submissionKey).not.toBe(first.submissionKey);
    expect(changed.fingerprint).not.toBe(first.fingerprint);
  });

  it("ignores volatile security and attribution fields", () => {
    const first = quotePayload();
    first.append("cf-turnstile-response", "token-one");
    first.append("gclid", "click-one");
    const retry = quotePayload();
    retry.append("cf-turnstile-response", "token-two");
    retry.append("gclid", "click-two");

    expect(fingerprintQuotePayload(retry)).toBe(fingerprintQuotePayload(first));
  });

  it("clears only the confirmed submission key", () => {
    const storage = new MemoryStorage();
    const first = getOrCreateQuoteSubmission("paid", quotePayload(), {
      storage,
      randomUUID: () => "11111111-1111-4111-8111-111111111111",
    });
    clearQuoteSubmission("paid", "different-key", storage);
    expect(
      getOrCreateQuoteSubmission("paid", quotePayload(), {
        storage,
        randomUUID: () => "22222222-2222-4222-8222-222222222222",
      }).submissionKey,
    ).toBe(first.submissionKey);

    clearQuoteSubmission("paid", first.submissionKey, storage);
    expect(
      getOrCreateQuoteSubmission("paid", quotePayload(), {
        storage,
        randomUUID: () => "33333333-3333-4333-8333-333333333333",
      }).submissionKey,
    ).not.toBe(first.submissionKey);
  });
});
