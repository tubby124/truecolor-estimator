import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, upsertMock, singleMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  upsertMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: fromMock }),
}));

import { POST } from "../route";

function request(secret: string | undefined, body: unknown = {
  post_id: "post-1",
  platform: "instagram",
  status: "published",
}) {
  return new Request("https://truecolorprinting.ca/api/webhooks/n8n", {
    method: "POST",
    headers: secret ? { "content-type": "application/json", "x-n8n-secret": secret } : {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/n8n", () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = "correct-secret";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    upsertMock.mockReset().mockResolvedValue({ error: null });
    singleMock.mockReset().mockResolvedValue({ data: null });
    fromMock.mockReset().mockImplementation((table: string) => {
      if (table === "social_post_results") {
        return {
          upsert: upsertMock,
        };
      }
      if (table === "social_posts") {
        return {
          select: () => ({
            eq: () => ({ single: singleMock }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.N8N_WEBHOOK_SECRET;
  });

  it("fails closed without a configured server secret", async () => {
    delete process.env.N8N_WEBHOOK_SECRET;

    const response = await POST(request("anything"));

    expect(response.status).toBe(503);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or incorrect shared secret before database access", async () => {
    const missing = await POST(request(undefined));
    const incorrect = await POST(request("wrong"));

    expect(missing.status).toBe(401);
    expect(incorrect.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("records an authenticated n8n result", async () => {
    const response = await POST(request("correct-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        post_id: "post-1",
        platform: "instagram",
        status: "published",
      }),
      { onConflict: "post_id,platform" },
    );
  });

  it("rejects unsupported statuses instead of coercing them into failures", async () => {
    const response = await POST(request("correct-secret", {
      post_id: "post-1",
      platform: "instagram",
      status: "pending",
    }));

    expect(response.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not leak provider error details", async () => {
    upsertMock.mockResolvedValue({ error: { message: "private database detail" } });

    const response = await POST(request("correct-secret"));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database detail");
  });
});
