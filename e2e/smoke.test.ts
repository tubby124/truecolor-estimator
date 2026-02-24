/**
 * Smoke Tests — True Color Estimator
 *
 * HTTP-level integration tests against the live Vercel deployment.
 * Uses fetch (Node 18+ built-in) — no browser download needed.
 *
 * Run:  npm run test:smoke
 *
 * Note: Tests require the live site to be up. They do NOT test
 * payment processing or email delivery — those remain manual (see NEXT_STEPS.md).
 */

import { describe, it, expect } from "vitest";

const BASE = "https://truecolor-estimator.vercel.app";

// ─── Page loads ───────────────────────────────────────────────────────────────

describe("Smoke 1 — all key pages return 200", () => {
  const pages = [
    "/",
    "/products/coroplast-signs",
    "/products/vinyl-banners",
    "/products/vehicle-magnets",
    "/products/business-cards",
    "/products/foam-board-signs",
    "/products/retractable-banners",
    "/cart",
    "/checkout",
    "/gallery",
    "/about",
    "/services",
    "/quote",
    "/staff/login",
  ];

  for (const page of pages) {
    it(`GET ${page} → 200`, async () => {
      const res = await fetch(`${BASE}${page}`);
      expect(res.status).toBe(200);
    }, 15_000);
  }
});

// ─── Estimate API ─────────────────────────────────────────────────────────────

describe("Smoke 2 — estimate API", () => {
  it("coroplast 18×24 qty 1 → QUOTED with price", async () => {
    const res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "SIGN",
        material_code: "MPHCC020",
        width_in: 18,
        height_in: 24,
        sides: 1,
        qty: 1,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("QUOTED");
    expect(data.sell_price).toBeGreaterThan(0);
  }, 15_000);

  it("coroplast 18×24 qty 5 → 8% bulk discount applied", async () => {
    const res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "SIGN",
        material_code: "MPHCC020",
        width_in: 18,
        height_in: 24,
        sides: 1,
        qty: 5,
      }),
    });
    const data = await res.json();
    expect(data.qty_discount_applied).toBe(true);
    expect(data.qty_discount_pct).toBe(8);
  }, 15_000);

  it("coroplast + H_STAKE → price higher than without", async () => {
    const [baseRes, stakeRes] = await Promise.all([
      fetch(`${BASE}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "SIGN", material_code: "MPHCC020", width_in: 18, height_in: 24, sides: 1, qty: 1 }),
      }),
      fetch(`${BASE}/api/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "SIGN", material_code: "MPHCC020", width_in: 18, height_in: 24, sides: 1, qty: 1, addons: ["H_STAKE"] }),
      }),
    ]);
    const [base, stake] = await Promise.all([baseRes.json(), stakeRes.json()]);
    expect(stake.sell_price).toBeGreaterThan(base.sell_price);
  }, 15_000);

  it("magnet qty 5 → 5% bulk discount applied", async () => {
    const res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "MAGNET",
        material_code: "MAG302437550M",
        width_in: 12,
        height_in: 18,
        sides: 1,
        qty: 5,
      }),
    });
    const data = await res.json();
    expect(data.qty_discount_applied).toBe(true);
    expect(data.qty_discount_pct).toBe(5);
  }, 15_000);

  it("magnet qty 10 → 10% bulk discount applied", async () => {
    const res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "MAGNET",
        material_code: "MAG302437550M",
        width_in: 12,
        height_in: 18,
        sides: 1,
        qty: 10,
      }),
    });
    const data = await res.json();
    expect(data.qty_discount_applied).toBe(true);
    expect(data.qty_discount_pct).toBe(10);
  }, 15_000);

  it("SIGN 4×8 ft → FIXED_SIZE at $232 (verbatim CSV price)", async () => {
    const res = await fetch(`${BASE}/api/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "SIGN",
        material_code: "MPHCC020",
        width_in: 48,
        height_in: 96,
        sides: 1,
        qty: 1,
      }),
    });
    const data = await res.json();
    expect(data.tier_applied).toBe("FIXED_SIZE");
    expect(data.sell_price).toBe(232);
  }, 15_000);
});

// ─── Security — Clover webhook ────────────────────────────────────────────────

describe("Smoke 3 — Clover webhook HMAC guard", () => {
  it("missing signature → 401", async () => {
    const res = await fetch(`${BASE}/api/webhooks/clover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "auth", merchantId: "test" }),
    });
    expect(res.status).toBe(401);
  }, 10_000);

  it("bad signature → 401", async () => {
    const res = await fetch(`${BASE}/api/webhooks/clover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-clover-signature": "this-is-wrong",
      },
      body: JSON.stringify({ type: "auth", merchantId: "test" }),
    });
    expect(res.status).toBe(401);
  }, 10_000);
});

// ─── Security — staff API auth guard ──────────────────────────────────────────

describe("Smoke 4 — staff API auth guard (unauthenticated → 401)", () => {
  it("PATCH /api/staff/orders/:id/status without session → 401", async () => {
    const res = await fetch(`${BASE}/api/staff/orders/fake-order-id/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "complete" }),
    });
    expect(res.status).toBe(401);
  }, 10_000);

  it("POST /api/staff/orders/:id/reply without session → 401", async () => {
    const res = await fetch(`${BASE}/api/staff/orders/fake-order-id/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });
    expect(res.status).toBe(401);
  }, 10_000);

  it("POST /api/staff/quote/wave without session → 401", async () => {
    const res = await fetch(`${BASE}/api/staff/quote/wave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: "fake" }),
    });
    expect(res.status).toBe(401);
  }, 10_000);
});

// ─── Manual smoke tests (cannot be automated) ─────────────────────────────────
// These require a real browser session, real payment, and inbox access.
// See NEXT_STEPS.md for the step-by-step manual checklists.
//
// Smoke Test A: Card payment + account creation
//   1. /products/coroplast-signs → 18×24 qty 5 → confirm "save 8%" shown
//   2. Add H-Stakes × 2 → confirm price updates
//   3. Checkout → Clover card → check /order-confirmed
//   4. Go to /account → confirm order shows
//   5. Check inbox: phone should say (306) 954-8688
//
// Smoke Test B: eTransfer + all status emails
//   1. Place eTransfer order → /staff/orders → advance to payment_received → check email
//   2. → in_production → check email
//   3. → ready_for_pickup → check customer email AND Wave invoice in customer inbox
//   4. → complete → confirm no email
//
// Smoke Test C: Staff estimator grommets
//   1. /staff → BANNER 24×72 qty 1 → toggle GROMMETS → price increases
//   2. Matches /products/vinyl-banners for same config
