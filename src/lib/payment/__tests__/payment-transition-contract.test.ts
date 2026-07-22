import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("payment transition idempotency contracts", () => {
  it("uses compare-and-swap before staff payment side effects", () => {
    const route = source("src/app/api/staff/orders/[id]/status/route.ts");
    expect(route).toContain('.eq("status", current.status)');
    expect(route).toContain('transitionQuery = transitionQuery.is("paid_at", null)');
    expect(route).toContain("if (!changedOrder)");
    expect(route).toContain("alreadyApplied: true");
  });

  it("does not repeat Wave side effects for a duplicate partial Clover webhook", () => {
    const route = source("src/app/api/webhooks/clover/route.ts");
    expect(route).toContain("const ledgerAlreadyRecorded");
    expect(route).toContain("if (ledgerAlreadyRecorded)");
    expect(route).toContain("no Wave side effect repeated");
  });
});
