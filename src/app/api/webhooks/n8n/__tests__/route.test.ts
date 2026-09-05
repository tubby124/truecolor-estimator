import { afterEach, describe, expect, it, vi } from "vitest";
const { db } = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: db }));
import { POST } from "../route";
const request = (secret?: string) => new Request("https://example.com/api/webhooks/n8n", { method: "POST", headers: secret ? { "x-n8n-secret": secret } : {}, body: JSON.stringify({ post_id: "pilot", platform: "instagram", status: "published" }) });
afterEach(() => { delete process.env.N8N_WEBHOOK_SECRET; vi.clearAllMocks(); });
describe("retired social callback", () => {
  it("fails closed without configuration", async () => { expect((await POST(request())).status).toBe(503); expect(db).not.toHaveBeenCalled(); });
  it("rejects wrong and absent secrets", async () => { process.env.N8N_WEBHOOK_SECRET = "test-secret"; expect((await POST(request())).status).toBe(401); expect((await POST(request("wrong"))).status).toBe(401); expect(db).not.toHaveBeenCalled(); });
  it("never lets a delayed authenticated callback change pilot state or receipts", async () => { process.env.N8N_WEBHOOK_SECRET = "test-secret"; expect((await POST(request("test-secret"))).status).toBe(410); expect(db).not.toHaveBeenCalled(); });
});
