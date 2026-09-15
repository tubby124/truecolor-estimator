import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(
  process.cwd(),
  "src/app/api/staff/customers/[id]/assign-discount/route.ts",
), "utf8");

describe("discount assignment Wave safety", () => {
  it("blocks every pending-order mutation before attaching a customer discount", () => {
    const guard = source.indexOf("if (orders?.length)");
    const lookupFailure = source.indexOf("if (ordersErr)");
    const customerMutation = source.indexOf("pending_discount_code: dc.code");
    expect(guard).toBeGreaterThan(0);
    expect(lookupFailure).toBeGreaterThan(0);
    expect(lookupFailure).toBeLessThan(guard);
    expect(source.slice(lookupFailure, guard)).toContain("No discount was applied");
    expect(customerMutation).toBeGreaterThan(guard);
    expect(source.slice(guard, customerMutation)).toContain("reviewed order-replacement workflow");
    expect(source).not.toContain("sendPaymentRequestEmail");
  });
});
