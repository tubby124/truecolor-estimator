import { describe, expect, it } from "vitest";
import { canonicalVariantKey, deriveCommerceIdentity, merchantPilotIdentity } from "@/lib/commerce/catalog";

const config = { category: "DISPLAY", material_code: "RBS33507875S", width_in: 33.5, height_in: 80, sides: 1 as const, qty: 1 };

describe("commerce catalog identity", () => {
  it("keeps an exact physical offer stable and material-sensitive", () => {
    const one = deriveCommerceIdentity({ product_slug: "retractable-banners", config });
    const two = deriveCommerceIdentity({ product_slug: "retractable-banners", config });
    const changed = deriveCommerceIdentity({ product_slug: "retractable-banners", config: { ...config, material_code: "OTHER" } });
    expect(one).toMatchObject({ commerceProductId: "tc:family:retractable-banners", merchantOfferId: "tc-retractable-banners-85e2542c9a34" });
    expect(one.merchantOfferId?.length).toBeLessThanOrEqual(50);
    expect(one.configurationFingerprint).toBe(two.configurationFingerprint);
    expect(one.merchantOfferId).not.toBe(changed.merchantOfferId);
  });

  it("does not invent a legacy identity without a complete configuration", () => {
    const identity = deriveCommerceIdentity({ product_slug: "retractable-banners", config: { category: "DISPLAY" } });
    expect(identity.commerceProductId).toBeNull();
    expect(identity.classificationReason).toContain("unclassified");
    expect(canonicalVariantKey({ category: "DISPLAY" })).toBeNull();
  });

  it("defines a deterministic non-serving pilot candidate", () => {
    expect(merchantPilotIdentity().merchantOfferId).toBe("tc-retractable-banners-85e2542c9a34");
  });
});
