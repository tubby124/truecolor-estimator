import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import type { ReactElement } from "react";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), redirect: vi.fn(), table: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth, createServiceClient: () => ({ from: mocks.from }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../QuotesTable", () => ({ QuotesTable: mocks.table }));
import StaffQuotesPage from "../page";
const id = "00000000-0000-4000-8000-000000000001";
function allElements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(allElements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  return [element, ...allElements(element.props.children)];
}
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ email: "staff@example.test" }); });
describe("focused structured quote correction", () => {
  it("loads a requested older archived quote outside the latest 200 and passes it to the focused builder", async () => {
    const exact = vi.fn().mockReturnValue({ maybeSingle: async () => ({ data: { id, is_archived: true, replied_at: "old" }, error: null }) });
    mocks.from.mockReturnValue({ select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }), eq: exact }) });
    const output = await StaffQuotesPage({ searchParams: Promise.resolve({ quote: id }) });
    const table = allElements(output).find((element) => element.type === mocks.table);
    expect(exact).toHaveBeenCalledWith("id", id);
    expect(table?.props.focusedQuoteId).toBe(id);
    expect(table?.props.quotes).toEqual([{ id, is_archived: true, replied_at: "old" }]);
  });
  it("requires server staff authorization before loading customer data", async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    mocks.redirect.mockImplementation(() => { throw new Error("redirect"); });
    await expect(StaffQuotesPage({ searchParams: Promise.resolve({ quote: id }) })).rejects.toThrow("redirect");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("does not silently fall back to a generic page for missing quote", async () => {
    mocks.from.mockReturnValue({ select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }), eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) });
    const output = await StaffQuotesPage({ searchParams: Promise.resolve({ quote: id }) });
    expect(allElements(output).some((element) => element.type === mocks.table)).toBe(false);
  });
});
