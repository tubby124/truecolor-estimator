import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const auth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: auth }));
vi.mock("@/lib/wave/invoice", () => ({ createWaveInvoice: () => { throw new Error("Orphan Wave drafts must never be created"); } }));
import { POST } from "../route";
beforeEach(() => auth.mockResolvedValue({ email: "staff@example.test" }));
describe("order-backed Wave draft migration", () => {
  it("directs old clients to durable Make a Quote without provider writes", async () => {
    const response = await POST();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "ORDER_BACKED_QUOTE_REQUIRED", quoteUrl: "/staff/orders?manual=quote" });
  });
  it("requires staff authorization", async () => {
    auth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await POST()).status).toBe(401);
  });
});
