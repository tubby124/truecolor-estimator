/**
 * POST /api/estimate input validation.
 *
 * The route is public and unauthenticated, so a malformed or abusive body must
 * be rejected with 400 at the boundary instead of reaching estimate(). These
 * tests also pin the shapes real clients send — UnifiedConfigurator,
 * configurator-shared (useEngineQuote), ProductConfigurator, and the staff
 * estimator — so tightening validation can't silently break the configurator.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "../route";
import type { NextRequest } from "next/server";

function postJson(body: unknown): Promise<Response> {
  const request = new Request("http://localhost/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request as NextRequest);
}

function postRaw(body: string): Promise<Response> {
  const request = new Request("http://localhost/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return POST(request as NextRequest);
}

/** Mirrors UnifiedConfigurator.tsx's debounced /api/estimate body for STICKER. */
const VALID_STICKER = {
  category: "STICKER",
  material_code: "ARLPMF7008",
  width_in: 4,
  height_in: 4,
  sides: 1,
  qty: 100,
  design_status: "PRINT_READY",
  is_rush: false,
  pricing_version: "v1_2026-02-19",
  shape: "square",
};

describe("POST /api/estimate — valid bodies still price", () => {
  // vitest does not load .env.local; production runs V2 on.
  beforeAll(() => { vi.stubEnv("NEXT_PUBLIC_USE_STICKER_PRICING_V2", "true"); });
  afterAll(() => { vi.unstubAllEnvs(); });

  it("quotes a valid sticker body", async () => {
    const res = await postJson(VALID_STICKER);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("QUOTED");
    expect(typeof body.sell_price).toBe("number");
    expect(body.sell_price).toBeGreaterThan(0);
  });

  it("ignores an unknown top-level field instead of rejecting it", async () => {
    const res = await postJson({ ...VALID_STICKER, some_future_field: "whatever" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("QUOTED");
  });

  it("prices identically with and without the unknown field", async () => {
    const clean = await (await postJson(VALID_STICKER)).json();
    const extra = await (await postJson({ ...VALID_STICKER, nope: 1 })).json();
    expect(extra.sell_price).toBe(clean.sell_price);
  });

  it("accepts the flat-fee service body (zero dimensions)", async () => {
    // serviceMode SKUs in products-content.ts post width_in/height_in of 0.
    const res = await postJson({
      category: "DESIGN",
      material_code: "SVC-DESIGN-LOGO",
      width_in: 0,
      height_in: 0,
      sides: 1,
      qty: 1,
      design_status: "PRINT_READY",
    });
    expect(res.status).toBe(200);
  });

  it("accepts the staff estimator body (addons + skip_min_charge)", async () => {
    const res = await postJson({
      category: "BANNER",
      material_code: "RMBF004",
      width_in: 24,
      height_in: 48,
      sides: 1,
      qty: 2,
      addons: ["GROMMETS"],
      is_rush: false,
      design_status: "PRINT_READY",
      pricing_version: "v1_2026-02-19",
      skip_min_charge: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("QUOTED");
    expect(body.sell_price).toBeGreaterThan(0);
  });
});

describe("POST /api/estimate — malformed bodies are rejected", () => {
  async function expectRejected(body: unknown) {
    const res = await postJson(body);
    expect(res.status).toBe(400);
    const parsed = await res.json();
    expect(parsed.status).toBe("BLOCKED");
    expect(Array.isArray(parsed.clarification_notes)).toBe(true);
    expect(parsed.clarification_notes.length).toBeGreaterThan(0);
    return parsed;
  }

  it("rejects qty 0", async () => {
    await expectRejected({ ...VALID_STICKER, qty: 0 });
  });

  it("rejects a negative width", async () => {
    await expectRejected({ ...VALID_STICKER, width_in: -5 });
  });

  it("rejects a negative height", async () => {
    await expectRejected({ ...VALID_STICKER, height_in: -1 });
  });

  it("rejects qty as a non-numeric string", async () => {
    await expectRejected({ ...VALID_STICKER, qty: "abc" });
  });

  it("rejects a numeric string qty (clients send real numbers)", async () => {
    await expectRejected({ ...VALID_STICKER, qty: "100" });
  });

  it("rejects a missing category", async () => {
    const withoutCategory: Record<string, unknown> = { ...VALID_STICKER };
    delete withoutCategory.category;
    await expectRejected(withoutCategory);
  });

  it("rejects an unknown category", async () => {
    await expectRejected({ ...VALID_STICKER, category: "NOT_A_CATEGORY" });
  });

  it("rejects a qty over the upper bound", async () => {
    await expectRejected({ ...VALID_STICKER, qty: 100_001 });
  });

  it("rejects a fractional qty", async () => {
    await expectRejected({ ...VALID_STICKER, qty: 2.5 });
  });

  it("rejects a width over the dimension bound", async () => {
    await expectRejected({ ...VALID_STICKER, width_in: 481 });
  });

  it("rejects a non-finite dimension", async () => {
    // Must go through raw text: JSON.stringify(Infinity) emits `null`, so only
    // a literal overflowing exponent reaches JSON.parse as Infinity.
    const res = await postRaw(
      JSON.stringify(VALID_STICKER).replace('"width_in":4', '"width_in":1e999'),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ status: "BLOCKED" });
  });

  it("treats an explicit null optional field as absent", async () => {
    // JSON.stringify drops undefined, but a hand-rolled client can send null.
    const res = await postJson({ ...VALID_STICKER, width_in: null, height_in: null });
    expect(res.status).toBe(200);
  });

  it("rejects sides outside 1 or 2", async () => {
    await expectRejected({ ...VALID_STICKER, sides: 3 });
  });

  it("rejects an unrecognized shape", async () => {
    await expectRejected({ ...VALID_STICKER, shape: "hexagon" });
  });

  it("rejects an unrecognized design_status", async () => {
    await expectRejected({ ...VALID_STICKER, design_status: "FREE_PLEASE" });
  });

  it("rejects an unrecognized addon", async () => {
    await expectRejected({ ...VALID_STICKER, addons: ["DROP_TABLE"] });
  });

  it("rejects addons that are not an array", async () => {
    await expectRejected({ ...VALID_STICKER, addons: "GROMMETS" });
  });

  it("rejects an oversized material_code", async () => {
    await expectRejected({ ...VALID_STICKER, material_code: "X".repeat(65) });
  });

  it("rejects a non-string material_code", async () => {
    await expectRejected({ ...VALID_STICKER, material_code: 42 });
  });

  it("rejects a non-boolean is_rush", async () => {
    await expectRejected({ ...VALID_STICKER, is_rush: "yes" });
  });

  it("rejects a JSON array body", async () => {
    await expectRejected([VALID_STICKER]);
  });

  it("rejects a JSON primitive body", async () => {
    await expectRejected("STICKER");
  });

  it("rejects a null body", async () => {
    await expectRejected(null);
  });

  it("rejects a non-JSON body", async () => {
    const res = await postRaw("not json at all {{{");
    expect(res.status).toBe(400);
    const parsed = await res.json();
    expect(parsed.status).toBe("BLOCKED");
    expect(parsed.clarification_notes[0]).toContain("JSON");
  });

  it("rejects an empty body", async () => {
    const res = await postRaw("");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ status: "BLOCKED" });
  });
});
