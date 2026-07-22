import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_INFO,
  MARKETING_PRICE_FACTS,
  getSameDayRushState,
} from "@/lib/business-info";
import { PRODUCTS } from "@/lib/data/products-content";
import { getConfigNum, getPricingRules, getProducts } from "@/lib/data/loader";
import { ORDER_MINIMUM_DOLLARS } from "@/lib/pricing/order-min";
import { RATING_VALUE, REVIEW_COUNT } from "@/lib/reviews";

describe("shared public business facts", () => {
  it("binds rush and marketing prices to authoritative sources", () => {
    expect(BUSINESS_INFO.sameDayRush.feeDollars).toBe(
      getConfigNum("rush_fee_flat")
    );

    const businessCards = getProducts().find(
      (product) => product.product_id === "BC-14PT-250-2S"
    );
    expect(businessCards?.price).toBe(
      MARKETING_PRICE_FACTS.businessCards.fromDollars
    );

    const coroplastTier = getPricingRules().find(
      (rule) => rule.rule_id === "PR-CORO-S-T1"
    );
    expect(coroplastTier?.price_per_sqft).toBe(
      MARKETING_PRICE_FACTS.coroplast.ratePerSqFt
    );
    expect(ORDER_MINIMUM_DOLLARS).toBe(
      MARKETING_PRICE_FACTS.coroplast.orderMinimumDollars
    );

    const flyers = getProducts().find(
      (product) => product.product_id === "FLYER-80LB-100"
    );
    expect(flyers?.price).toBe(MARKETING_PRICE_FACTS.flyers.fromDollars);

    const acp = getProducts().find(
      (product) => product.product_id === "RIGID-ACP3-18X24-S"
    );
    expect(acp?.price).toBe(MARKETING_PRICE_FACTS.acpSigns.fromDollars);

    const rateFacts = [
      ["PR-MAGNET-T1", MARKETING_PRICE_FACTS.vehicleMagnets],
      ["PR-DECAL-S", MARKETING_PRICE_FACTS.windowDecals],
      ["PR-LETTER-CUST", MARKETING_PRICE_FACTS.vinylLettering],
    ] as const;
    for (const [ruleId, fact] of rateFacts) {
      const rule = getPricingRules().find((item) => item.rule_id === ruleId);
      expect(rule?.price_per_sqft).toBe(fact.ratePerSqFt);
      expect(ORDER_MINIMUM_DOLLARS).toBe(fact.orderMinimumDollars);
    }
  });

  it("keeps catalogue anchors aligned with the documented configurations", () => {
    expect(PRODUCTS["business-cards"].fromPrice).toBe("$45");
    expect(PRODUCTS["flyers"].fromPrice).toBe("$45");
    expect(PRODUCTS["coroplast-signs"].fromPrice).toBe("$25");
    expect(PRODUCTS["window-decals"].fromPrice).toBe("$25");
    expect(PRODUCTS["acp-signs"].fromPrice).toBe("$39");
    expect(PRODUCTS["vehicle-magnets"].fromPrice).toBe("$25");
    expect(PRODUCTS["vinyl-lettering"].fromPrice).toBe("$25");
  });

  it("uses the shared verified review values", () => {
    expect(BUSINESS_INFO.reviews).toEqual({
      ratingValue: RATING_VALUE,
      reviewCount: REVIEW_COUNT,
    });
  });

  it("uses the 10 AM cutoff and closes the clock on weekends and evenings", () => {
    expect(
      getSameDayRushState({ day: "Mon", hour: 9, minute: 15 })
    ).toEqual({ status: "countdown", minutesRemaining: 45 });
    expect(
      getSameDayRushState({ day: "Mon", hour: 10, minute: 0 })
    ).toEqual({ status: "call" });
    expect(
      getSameDayRushState({ day: "Mon", hour: 17, minute: 0 })
    ).toEqual({ status: "closed" });
    expect(
      getSameDayRushState({ day: "Sat", hour: 9, minute: 0 })
    ).toEqual({ status: "closed" });
  });

  it("keeps shared AI and authoring sources free of known stale claims", () => {
    const files = [
      "public/llms.txt",
      ".claude/rules/truecolor-domain.md",
      ".claude/rules/seo-standards.md",
      ".claude/rules/brand-voice.md",
      ".claude/rules/content-pipeline.md",
      "src/lib/data/products-content.ts",
      "src/app/api/feed/products.xml/route.ts",
    ];
    const content = files
      .map((file) => readFileSync(join(process.cwd(), file), "utf8"))
      .join("\n");

    expect(content).not.toMatch(/Roland(?:\s+TrueVIS(?:\s+VG2)?)?\s+UV(?:\s+(?:printer|flatbed|ink|equipment|print))?/i);
    expect(content).not.toMatch(/UV(?:\s+(?:printer|flatbed|ink|print))[^\n]{0,50}Roland/i);
    expect(content).not.toMatch(/5\.0[^\n]{0,30}29|29[^\n]{0,30}(?:Google )?reviews/i);
    expect(content).not.toMatch(/Friday[^\n]{0,50}Saturday/i);
    expect(content).not.toMatch(/same[- ]day[^\n]{0,40}(?:noon|12\s*(?:p\.?m\.?|PM))/i);
    expect(content).not.toMatch(/local pickup only|no shipping available/i);

    const catalogue = readFileSync(
      join(process.cwd(), "src/lib/data/products-content.ts"),
      "utf8"
    );
    expect(catalogue).not.toMatch(/UV[- ]cured/i);
    expect(catalogue).not.toMatch(/direct(?:ly)?[- ]to[- ](?:the[- ])?substrate/i);
  });

  it("keeps llms.txt synchronized with review, equipment, and fulfillment facts", () => {
    const llms = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");

    expect(llms).toContain(
      `${BUSINESS_INFO.reviews.ratingValue} stars, ${BUSINESS_INFO.reviews.reviewCount} Google reviews`
    );
    expect(llms).toContain(BUSINESS_INFO.equipment.wideFormat.display);
    expect(llms).toContain(BUSINESS_INFO.equipment.digitalPress.display);
    expect(llms).toContain(BUSINESS_INFO.fulfillment.display);
  });
});
