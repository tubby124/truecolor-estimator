import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse, type NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth }));

import { POST } from "../route";

const MINIMUM_PRICE_REQUEST = {
  category: "BANNER",
  material_code: "RMBF004",
  width_in: 1,
  height_in: 1,
  sides: 1,
  qty: 1,
  design_status: "PRINT_READY",
  skip_min_charge: true,
};

function postJson(body: unknown): Promise<Response> {
  return POST(new Request("http://localhost/api/staff/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest);
}

describe("POST /api/staff/estimate", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ id: "staff-1", email: "info@true-color.ca" });
  });

  it("requires a staff session", async () => {
    mocks.auth.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const res = await postJson(MINIMUM_PRICE_REQUEST);
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the full engine response only after staff authorization", async () => {
    const res = await postJson(MINIMUM_PRICE_REQUEST);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body.cost).toBeDefined();
    expect(body.rules_fired).toBeInstanceOf(Array);
    expect(body.line_items[0]).toHaveProperty("rule_id");
    expect(body.estimate_request.skip_min_charge).toBe(true);
  });
});
