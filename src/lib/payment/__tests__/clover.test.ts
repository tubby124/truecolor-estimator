import { describe, expect, it } from "vitest";
import {
  CLOVER_LINE_ITEM_NAME_MAX,
  normalizeCloverLineItemName,
} from "../clover";

describe("Clover Hosted Checkout", () => {
  it("keeps line item names under Clover's 127-character hard limit", () => {
    const longManualOrderDescription =
      "1. Stickers (Stickers (clear)); 2. Sticker (white background) (Stickers (white background)); 3. Sticker (white background) (Stickers (white background)); 4. Sticker (white background) (Stickers (white background))";

    const normalized = normalizeCloverLineItemName(longManualOrderDescription);

    expect(normalized.length).toBeLessThan(127);
    expect(normalized.length).toBeLessThanOrEqual(CLOVER_LINE_ITEM_NAME_MAX);
    expect(normalized).toMatch(/\.\.\.$/);
  });

  it("normalizes whitespace and supplies a safe fallback name", () => {
    expect(normalizeCloverLineItemName("  Coroplast   signs\n")).toBe("Coroplast signs");
    expect(normalizeCloverLineItemName("   ")).toBe("True Color order");
  });
});
