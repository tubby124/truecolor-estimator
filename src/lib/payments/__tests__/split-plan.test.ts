import { describe, expect, it } from "vitest";
import { buildSplitPaymentPlan } from "../split-plan";

describe("split payment plan", () => {
  it("models two companies funding one order", () => {
    const plan = buildSplitPaymentPlan(1000, [
      {
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A", email: "ap@company-a.test" },
      },
      {
        amount: 500,
        method: "clover",
        payer: { company: "Company B", email: "ap@company-b.test" },
      },
    ], { requireFullAllocation: true });

    expect(plan.coversOrder).toBe(true);
    expect(plan.amountAllocated).toBe(1000);
    expect(plan.remainingUnallocated).toBe(0);
    expect(plan.entries.map((entry) => entry.payer?.company)).toEqual(["Company A", "Company B"]);
  });

  it("allows a deposit plan when full allocation is not required", () => {
    const plan = buildSplitPaymentPlan(1000, [
      {
        amount: 250,
        method: "etransfer",
        payer: { name: "Deposit payer" },
      },
    ]);

    expect(plan.coversOrder).toBe(false);
    expect(plan.amountAllocated).toBe(250);
    expect(plan.remainingUnallocated).toBe(750);
  });

  it("rejects missing payer identity", () => {
    expect(() => buildSplitPaymentPlan(1000, [
      { amount: 500, method: "cash", payer: {} },
    ])).toThrow("needs a payer name, company, or email");
  });

  it("rejects over-allocated plans", () => {
    expect(() => buildSplitPaymentPlan(1000, [
      { amount: 700, method: "etransfer", payer: { company: "Company A" } },
      { amount: 400, method: "clover", payer: { company: "Company B" } },
    ])).toThrow("exceed order total by $100.00");
  });

  it("rejects incomplete plans when full allocation is required", () => {
    expect(() => buildSplitPaymentPlan(1000, [
      { amount: 500, method: "etransfer", payer: { company: "Company A" } },
    ], { requireFullAllocation: true })).toThrow("leave $500.00 unallocated");
  });
});
