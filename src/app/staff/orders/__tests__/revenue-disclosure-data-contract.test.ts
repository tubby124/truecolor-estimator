import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), "utf8");

const stripWhitespace = (value: string) => value.replace(/\s+/g, " ");

describe("staff orders revenue-disclosure data contract", () => {
  it("selects paid_at with existing staff orders data", () => {
    const page = source("src/app/staff/orders/page.tsx");
    const ordersSelect = page.slice(
      page.indexOf('.from("orders")'),
      page.indexOf('.order("created_at"'),
    );

    expect(ordersSelect).toContain("paid_at");
  });

  it("passes existing server-calculated newQuoteCount into OrdersTable", () => {
    const page = stripWhitespace(source("src/app/staff/orders/page.tsx"));
    const table = source("src/app/staff/orders/OrdersTable.tsx");

    expect(page).toContain("<OrdersTable initialOrders={orders} newQuoteCount={newQuoteCount} />");
    expect(table).toContain("newQuoteCount: number");
    expect(table).toMatch(/export function OrdersTable\(\{\s*initialOrders,\s*newQuoteCount\s*\}: Props\)/);
  });
});
