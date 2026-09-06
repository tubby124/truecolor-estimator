import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth }));
vi.mock("@/lib/email/smtp", () => ({ sendEmail: mocks.send }));
import { POST } from "../route";
const estimateRequest = { category: "SIGN", material_code: "MPHCC020", width_in: 24, height_in: 36, qty: 1, sides: 1 };
const post = (body: unknown) => POST(new Request("https://example.test/email", { method: "POST", body: JSON.stringify({ requestId: "00000000-0000-4000-8000-000000000001", ...(body as object) }) }));
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ email: "staff@example.test" }); mocks.send.mockResolvedValue({ id: "synthetic" }); });
describe("emailed quote amounts", () => {
  it("requires durable quote history for negotiated pricing", async () => {
    expect((await post({ to: "customer@example.test", items: [{ estimateRequest, manualOverride: { subtotal: 30, reason: "Agreed discount" } }] })).status).toBe(409);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("blocks stale money before any email is sent", async () => {
    expect((await post({ to: "customer@example.test", items: [{ estimateRequest, expectedSubtotal: 1 }] })).status).toBe(409);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("renders identical canonical money in multi-item HTML and text, ignoring client result", async () => {
    const response = await post({ to: "customer@example.test", items: [{ estimateRequest, expectedSubtotal: 48, quoteData: { status: "QUOTED", sell_price: 1 } }] });
    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledOnce();
    const { html, text } = mocks.send.mock.calls[0][0];
    expect(html).toContain("$53.28"); expect(text).toContain("$53.28");
    expect(text).not.toContain("$1.00");
    const firstKey = mocks.send.mock.calls[0][0].idempotencyKey;
    await post({ to: "customer@example.test", items: [{ estimateRequest, expectedSubtotal: 48, quoteData: { status: "QUOTED", sell_price: 1 } }] });
    expect(mocks.send.mock.calls[1][0].idempotencyKey).toBe(firstKey);
    expect(firstKey).toMatch(/^estimate:/);
  });
});
