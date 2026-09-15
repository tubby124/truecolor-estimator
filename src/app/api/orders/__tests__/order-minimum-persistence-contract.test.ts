import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(process.cwd(), "src/app/api/orders/route.ts"), "utf8");

describe("catalog order-minimum persistence", () => {
  it("persists a required pricing version for the system-generated fee line", () => {
    const fee = source.indexOf('product_name: SMALL_ORDER_FEE_LABEL');
    expect(fee).toBeGreaterThan(0);
    expect(source.slice(fee, fee + 900)).toContain("pricing_version: SYSTEM_PRICING_VERSION");
    expect(source).toContain("pricing_version: item.commerce_identity?.pricingVersion ?? SYSTEM_PRICING_VERSION");
  });
});
