import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildCloverOrderDescription,
  loadCloverOrderDescription,
} from "../clover-order-description";
import { CLOVER_LINE_ITEM_NAME_MAX } from "../clover";

describe("Clover order descriptions", () => {
  it("shows the persisted wall-decal quantity, size, and installation detail", () => {
    expect(buildCloverOrderDescription({
      orderNumber: "TC-2026-1042",
      items: [{
        product_name: "ACTIVATE Wall decal",
        qty: 1,
        width_in: 120,
        height_in: 96,
        sides: 1,
        addons: ["INSTALLATION"],
      }],
    })).toBe("Order TC-2026-1042: 1x ACTIVATE Wall decal (120x96 in, installation)");
  });

  it("identifies materially different items without changing their quantities", () => {
    expect(buildCloverOrderDescription({
      orderNumber: "TC-2026-1043",
      items: [
        { product_name: "Business cards", qty: 500, width_in: 3.5, height_in: 2, sides: 2 },
        { product_name: "Logo design", qty: 1 },
      ],
    })).toBe("Order TC-2026-1043: 500x Business cards (3.5x2 in, double-sided); 1x Logo design");
  });

  it("makes a partial balance explicit while retaining the order and item", () => {
    expect(buildCloverOrderDescription({
      orderNumber: "TC-2026-1044",
      isPartialBalance: true,
      items: [{ product_name: "Vinyl banner", qty: "2", width_in: "36", height_in: "84" }],
    })).toBe("Balance for TC-2026-1044: 2x Vinyl banner (36x84 in)");
  });

  it("does not invent installation when the persisted item does not include it", () => {
    const label = buildCloverOrderDescription({
      orderNumber: "TC-2026-1042",
      items: [{ product_name: "ACTIVATE Wall decal", qty: 1, width_in: 120, height_in: 96 }],
    });

    expect(label).toBe("Order TC-2026-1042: 1x ACTIVATE Wall decal (120x96 in)");
    expect(label).not.toContain("installation");
  });

  it("keeps every item name and quantity before adding optional detail", () => {
    const label = buildCloverOrderDescription({
      orderNumber: "TC-2026-1047",
      items: [
        {
          product_name: "Custom storefront window graphic",
          qty: 1,
          width_in: 120,
          height_in: 96,
          addons: ["INSTALLATION", "LAMINATE"],
        },
        { product_name: "Detailed logo cleanup and production artwork package", qty: 1 },
      ],
    });

    expect(label).toContain("1x Custom storefront window graphic");
    expect(label).toContain("1x Detailed logo cleanup and production artwork package");
    expect(label.length).toBeLessThanOrEqual(CLOVER_LINE_ITEM_NAME_MAX);
  });

  it("keeps the order identity and omitted-item count within Clover's name limit", () => {
    const label = buildCloverOrderDescription({
      orderNumber: "TC-2026-1045",
      items: [
        { product_name: "A very long custom storefront window graphic with detailed finishing", qty: 1 },
        { product_name: "Professional installation and surface preparation", qty: 1 },
        { product_name: "Logo cleanup and production artwork", qty: 1 },
      ],
    });

    expect(label).toContain("Order TC-2026-1045");
    expect(label).toContain("+2 more");
    expect(label.length).toBeLessThanOrEqual(CLOVER_LINE_ITEM_NAME_MAX);
  });

  it("loads only persisted server-side order item fields", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        order_number: "TC-2026-1046",
        order_items: [{ product_name: "Coroplast signs", qty: 4, width_in: 18, height_in: 24 }],
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(loadCloverOrderDescription(
      { from } as never,
      "order-id",
      false,
    )).resolves.toBe("Order TC-2026-1046: 4x Coroplast signs (18x24 in)");
    expect(from).toHaveBeenCalledWith("orders");
    expect(select).toHaveBeenCalledWith(expect.stringContaining("order_items"));
    expect(eq).toHaveBeenCalledWith("id", "order-id");
  });

  it("wires the persisted label into the unchanged Clover checkout call", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/pay/[token]/page.tsx"), "utf8");
    expect(page).toContain("description = await loadCloverOrderDescription(");
    expect(page.indexOf("remainingCents !== amountCents")).toBeLessThan(
      page.indexOf("description = await loadCloverOrderDescription("),
    );
    expect(page).toContain("amountCents, description, customerEmail, redirectUrl, orderId");
  });
});
