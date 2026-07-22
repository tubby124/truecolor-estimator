import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  conversionTransactionId,
  isRevenueConversionType,
  pretaxConversionValue,
} from "../conversions";

describe("paid revenue conversion helpers", () => {
  it("sends Google Ads pretax value rather than GST/PST-inclusive collections", () => {
    expect(pretaxConversionValue({ total: 321.9, gst: 14.5, pst: 17.4 })).toBe(290);
    expect(pretaxConversionValue({ total: 10, gst: 20, pst: 0 })).toBe(0);
  });

  it("recognizes only the two approved revenue paths", () => {
    expect(isRevenueConversionType("purchase_online")).toBe(true);
    expect(isRevenueConversionType("quote_won")).toBe(true);
    expect(isRevenueConversionType("manual_order")).toBe(false);
  });

  it("uses the order number only when the dedup key matches its classification", () => {
    expect(conversionTransactionId({
      conversionType: "quote_won",
      conversionKey: "quote_won:123",
      orderNumber: "TC-2026-0042",
    })).toBe("TC-2026-0042");
    expect(conversionTransactionId({
      conversionType: "purchase_online",
      conversionKey: "quote_won:123",
      orderNumber: "TC-2026-0042",
    })).toBeNull();
  });

  it("keeps the conversion claim RPC service-role-only", () => {
    const migration = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260720110000_google_ads_conversion_outbox.sql"),
      "utf8",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.claim_google_ads_conversions(integer) FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.claim_google_ads_conversions(integer) TO service_role",
    );
  });
});
