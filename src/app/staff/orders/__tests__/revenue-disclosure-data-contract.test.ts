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

  it("renders five operational stats before hiding paid totals in the disclosure", () => {
    const table = source("src/app/staff/orders/OrdersTable.tsx");
    const normalized = stripWhitespace(table);
    const statsSection = table.slice(
      table.indexOf("{/* ── Stats bar"),
      table.indexOf("{/* ── Search + filter + sort row"),
    );

    expect(statsSection.match(/<StatCard label=/g)).toHaveLength(5);
    expect(statsSection).toContain('label="Active orders"');
    expect(statsSection).toContain('label="Pending payment"');
    expect(statsSection).toContain('label="In production"');
    expect(statsSection).toContain('label="Ready for pickup"');
    expect(statsSection).toContain('label="New quote requests"');
    expect(statsSection).not.toContain('label="Today"');
    expect(statsSection).not.toContain('label="This week"');
    expect(statsSection).not.toContain('label="This month"');

    expect(normalized).toContain("buildOrdersDashboardStats(orders, { now: new Date(), timeZone: ORDERS_STATS_TIME_ZONE })");
    expect(statsSection).toContain("newQuoteCount");
  });

  it("keeps business totals closed by default behind an accessible button", () => {
    const table = source("src/app/staff/orders/OrdersTable.tsx");
    const normalized = stripWhitespace(table);
    const statsSection = table.slice(
      table.indexOf("{/* ── Stats bar"),
      table.indexOf("{/* ── Search + filter + sort row"),
    );

    expect(normalized).toContain("const [businessTotalsOpen, setBusinessTotalsOpen] = useState(false)");
    expect(statsSection).toContain('type="button"');
    expect(statsSection).toContain('aria-expanded={businessTotalsOpen}');
    expect(statsSection).toContain('aria-controls="business-totals-panel"');
    expect(statsSection).toContain("Business totals");
    expect(statsSection).toContain('{businessTotalsOpen ? "Hide" : "Show"}');
    expect(statsSection).toContain('id="business-totals-panel"');
    expect(statsSection).toContain("Paid orders only. Archived and unpaid orders are excluded.");
    expect(statsSection).toContain("Paid today");
    expect(statsSection).toContain("Paid this week");
    expect(statsSection).toContain("Paid this month");
    expect(normalized).not.toMatch(/(?:localStorage|sessionStorage)/);
  });
});
