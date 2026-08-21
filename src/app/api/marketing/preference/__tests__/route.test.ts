import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ rpc }),
}));

import { POST } from "../route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/marketing/preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("historical marketing preference route", () => {
  beforeEach(() => rpc.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("redeems an affirmative choice through one atomic RPC", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const response = await POST(request({ token: "opaque-token", choice: "accept" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, subscribed: true });
    expect(rpc).toHaveBeenCalledWith("redeem_marketing_preference_token", {
      p_token: "opaque-token",
      p_choice: "accept",
    });
  });

  it("does not expose whether an expired or used token ever existed", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const response = await POST(request({ token: "opaque-token", choice: "decline" }));
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "This preference link is expired or already used" });
  });

  it("rejects malformed choices before calling the database", async () => {
    const response = await POST(request({ token: "opaque-token", choice: "maybe" }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a generic server error when the atomic redemption fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    const response = await POST(request({ token: "opaque-token", choice: "accept" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Could not save preference" });
  });
});
