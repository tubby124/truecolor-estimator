import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const auth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: auth, createServiceClient: () => { throw new Error("Retired route must never access orders"); } }));
import { POST } from "../route";
describe("retired total-only repricing", () => {
  beforeEach(() => auth.mockResolvedValue({ email: "staff@example.test" }));
  it("blocks all totals without customer messages, tokens or persistence", async () => {
    const response = await POST();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "FULL_CORRECTION_REQUIRED" });
  });
  it("retains staff authorization", async () => {
    auth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await POST()).status).toBe(401);
  });
});
