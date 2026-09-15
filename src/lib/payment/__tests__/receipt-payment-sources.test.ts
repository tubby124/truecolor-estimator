import { describe, expect, it, vi } from "vitest";
import {
  loadReceiptPaymentSources,
  receiptPaymentSourceLabel,
  receiptPaymentSourcesFromLedger,
} from "../receipt-payment-sources";

describe("receipt payment sources", () => {
  it("uses the actual counted ledger source for a single-provider receipt", () => {
    const sources = receiptPaymentSourcesFromLedger([
      { amount: "1359.75", method: "wave", status: "recorded" },
    ]);

    expect(sources).toEqual(["wave"]);
    expect(receiptPaymentSourceLabel(sources)).toBe("Wave Payments");
  });

  it("lists every actual source for a mixed partial payment", () => {
    const sources = receiptPaymentSourcesFromLedger([
      { amount: 500, method: "wave", status: "recorded" },
      { amount: 700, method: "clover", status: "recorded" },
      { amount: 159.75, method: "etransfer", status: "recorded" },
    ]);

    expect(receiptPaymentSourceLabel(sources)).toBe(
      "Wave Payments + Credit / debit card (Clover) + Interac e-Transfer",
    );
  });

  it("ignores voided, refunded, zero, negative, and duplicate-source rows", () => {
    expect(receiptPaymentSourcesFromLedger([
      { amount: 50, method: "wave", status: "voided" },
      { amount: 50, method: "clover", status: "refunded" },
      { amount: 0, method: "cash", status: "recorded" },
      { amount: -1, method: "etransfer", status: "recorded" },
      { amount: 20, method: "clover", status: "recorded" },
      { amount: 30, method: "clover", status: "recorded" },
    ])).toEqual(["clover"]);
  });

  it("uses a truthful generic source when legacy ledger evidence is absent", () => {
    expect(receiptPaymentSourcesFromLedger([])).toEqual(["recorded"]);
    expect(receiptPaymentSourceLabel(["recorded"])).toBe("Recorded payment");
  });

  it("uses the generic source when the ledger query fails", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    const client = { from: vi.fn(() => query) };

    await expect(loadReceiptPaymentSources(client as never, "order-1")).resolves.toEqual(["recorded"]);
  });

  it("uses the generic source when the ledger client throws", async () => {
    const client = { from: vi.fn(() => { throw new Error("unavailable"); }) };
    await expect(loadReceiptPaymentSources(client as never, "order-1")).resolves.toEqual(["recorded"]);
  });
});
