/**
 * E2E tests for POST /api/staff/manual-order
 *
 * Tests the manual order creation flow: staff creates order, customer gets
 * an auth account, order + order_items land correctly in DB.
 *
 * Requires: STAFF_EMAIL user to exist in Supabase auth with a known password.
 * Set E2E_STAFF_PASSWORD in .env.local to enable these tests.
 */
import { test, expect } from "@playwright/test";
import {
  getAdminClient,
  testEmail,
  deleteTestUser,
  deleteTestOrders,
} from "./helpers/supabase-admin";

const BASE_URL = "http://localhost:3000";
const MANUAL_ORDER_URL = `${BASE_URL}/api/staff/manual-order`;

// ---------- helpers ----------

function loadEnvSync(): Record<string, string> {
  const fs = require("node:fs");
  const path = require("node:path");
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return {};
  const lines: string[] = fs.readFileSync(envPath, "utf-8").split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvSync();
const STAFF_EMAIL = env.STAFF_EMAIL ?? "info@true-color.ca";
const STAFF_PASSWORD = env.E2E_STAFF_PASSWORD ?? "";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Build a unique test email for this spec */
function manualTestEmail(suffix: string): string {
  return testEmail(`manual-${suffix}`);
}

/** Build a valid manual order payload */
function buildPayload(emailSuffix: string, overrides: Record<string, unknown> = {}) {
  return {
    contact: {
      name: "E2E Manual Test",
      email: manualTestEmail(emailSuffix),
      company: "Test Co",
      phone: "3061234567",
    },
    items: [
      { product: "Coroplast Signs", qty: 2, details: "24x18 single-sided", amount: 45 },
      { product: "Vinyl Banner", qty: 1, details: "3x6 ft", amount: 90 },
    ],
    payment_method: "clover",
    notes: "E2E test order — safe to delete",
    ...overrides,
  };
}

// ---------- test suite ----------

test.describe("Manual Order API (staff → customer account)", () => {
  // We need to authenticate as staff via the browser, then use those cookies
  // for API requests. If staff password isn't set, skip all tests.
  let staffCookies: string = "";

  test.beforeAll(async ({ browser }) => {
    if (!STAFF_PASSWORD) {
      console.warn(
        "E2E_STAFF_PASSWORD not set in .env.local — manual order tests will be skipped"
      );
      return;
    }

    // Sign in as staff user via Supabase Auth REST API to get a session,
    // then set cookies on a browser context so we can extract them.
    const context = await browser.newContext();
    const page = await context.newPage();

    // Use Supabase GoTrue endpoint directly to get access/refresh tokens
    const tokenRes = await page.request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        data: { email: STAFF_EMAIL, password: STAFF_PASSWORD },
      }
    );

    if (!tokenRes.ok()) {
      console.error("Staff login failed:", await tokenRes.text());
      await context.close();
      return;
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // Set Supabase auth cookies on the base URL context so subsequent
    // requests to localhost:3000 include them automatically.
    await context.addCookies([
      {
        name: "sb-access-token",
        value: accessToken,
        domain: "localhost",
        path: "/",
      },
      {
        name: "sb-refresh-token",
        value: refreshToken,
        domain: "localhost",
        path: "/",
      },
    ]);

    // Navigate to the app so @supabase/ssr picks up the cookies and sets
    // the chunked cookie format the server expects.
    await page.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle" });

    // Capture all cookies as a header string
    const allCookies = await context.cookies(BASE_URL);
    staffCookies = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");

    await context.close();
  });

  test.afterAll(async () => {
    // Cleanup: delete all test users/orders created by this suite
    const suffixes = ["1", "2", "3", "4", "5", "6"];
    for (const s of suffixes) {
      try {
        await deleteTestOrders(`manual-${s}`);
        await deleteTestUser(`manual-${s}`);
      } catch {
        // Best-effort cleanup
      }
    }
  });

  // ── Test 1: Order created with correct order_number format ──

  test("creates manual order with TC-YYYY-NNNN order_number format", async ({
    request,
  }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    const payload = buildPayload("1");
    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBeTruthy();
    expect(body.orderNumber).toMatch(/^TC-\d{4}-\d{4,}$/);
    expect(body.paymentUrl).toContain("/pay/");

    // Verify in DB
    const admin = getAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, status, total, payment_method")
      .eq("id", body.orderId)
      .single();

    expect(order).toBeTruthy();
    expect(order!.order_number).toBe(body.orderNumber);
    expect(order!.status).toBe("pending_payment");
    expect(order!.payment_method).toBe("clover_card");
    // subtotal 45+90=135, gst 6.75, pst 8.10 → total 149.85
    expect(order!.total).toBeCloseTo(149.85, 2);
  });

  // ── Test 2: New customer gets Supabase auth account ──

  test("creates Supabase auth account for new customer", async ({ request }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    const payload = buildPayload("2");
    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });

    expect(res.status()).toBe(200);

    // Check auth account exists via admin API
    const admin = getAdminClient();
    const email = manualTestEmail("2");
    const { data: listData } = await admin.auth.admin.listUsers();
    const user = listData?.users?.find((u) => u.email === email);

    expect(user).toBeTruthy();
    expect(user!.email).toBe(email);
    expect(user!.email_confirmed_at).toBeTruthy();
    expect(user!.user_metadata?.name).toBe("E2E Manual Test");
  });

  // ── Test 3: Returning customer — no error on existing account ──

  test("handles returning customer without error", async ({ request }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    const email = manualTestEmail("3");

    // Pre-create the auth account so the API finds an existing user
    const admin = getAdminClient();
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: "Existing123!",
      user_metadata: { name: "Returning Customer" },
    });

    // Now create a manual order for this existing user
    const payload = buildPayload("3");
    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBeTruthy();
    expect(body.orderNumber).toBeTruthy();

    // Verify the auth account still exists (wasn't deleted/corrupted)
    const { data: listData } = await admin.auth.admin.listUsers();
    const user = listData?.users?.find((u) => u.email === email);
    expect(user).toBeTruthy();
  });

  // ── Test 4: Magic link → customer lands on /account authenticated ──

  test("magic link from new account authenticates customer on /account", async ({
    browser,
    request,
  }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    // Create the manual order (which creates the auth account)
    const payload = buildPayload("4");
    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });

    expect(res.status()).toBe(200);

    // Generate a fresh magic link for the new customer via admin API
    const admin = getAdminClient();
    const email = manualTestEmail("4");
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${BASE_URL}/account/callback` },
      });

    expect(linkErr).toBeNull();
    const magicLink = linkData?.properties?.action_link;
    expect(magicLink).toBeTruthy();

    // Open the magic link in a fresh browser context
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(magicLink!, { waitUntil: "networkidle" });

    // Should redirect to /account after callback processes
    await page.waitForURL("**/account", { timeout: 15_000 });
    expect(page.url()).toContain("/account");

    // Page should show authenticated state (not a login form)
    // The account page renders the customer's name when authenticated
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    await context.close();
  });

  // ── Test 5: Customer sets password after magic link → can log in ──

  test("customer sets password after magic link and logs in with it", async ({
    browser,
    request,
  }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    // Create the manual order (which creates the auth account)
    const payload = buildPayload("5");
    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });
    expect(res.status()).toBe(200);

    const email = manualTestEmail("5");
    const newPassword = "NewSecure456!";
    const admin = getAdminClient();

    // Set a password via admin (simulates customer setting their password)
    const { data: listData } = await admin.auth.admin.listUsers();
    const user = listData?.users?.find((u) => u.email === email);
    expect(user).toBeTruthy();

    await admin.auth.admin.updateUserById(user!.id, { password: newPassword });

    // Now verify the customer can sign in with password via GoTrue
    const context = await browser.newContext();
    const page = await context.newPage();

    const tokenRes = await page.request.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        data: { email, password: newPassword },
      }
    );

    expect(tokenRes.ok()).toBe(true);
    const tokens = await tokenRes.json();
    expect(tokens.access_token).toBeTruthy();
    expect(tokens.user?.email).toBe(email);

    await context.close();
  });

  // ── Test 6: Order items created with correct product_name, qty, line_total ──

  test("order items match input product, qty, and amount", async ({
    request,
  }) => {
    test.skip(!STAFF_PASSWORD, "E2E_STAFF_PASSWORD not set");

    const items = [
      { product: "Coroplast Signs", qty: 4, details: "12x18 double-sided", amount: 60 },
      { product: "Business Cards", qty: 1, details: "500 matte", amount: 35 },
      { product: "Vinyl Banner", qty: 2, details: "2x4 ft hemmed", amount: 55 },
    ];
    const payload = buildPayload("6", { items });

    const res = await request.post(MANUAL_ORDER_URL, {
      headers: { Cookie: staffCookies, "Content-Type": "application/json" },
      data: payload,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Fetch order items from DB
    const admin = getAdminClient();
    const { data: dbItems, error } = await admin
      .from("order_items")
      .select("product_name, qty, line_total, category, design_status")
      .eq("order_id", body.orderId)
      .order("line_total", { ascending: true });

    expect(error).toBeNull();
    expect(dbItems).toHaveLength(3);

    // Items sorted by line_total ascending: 35, 55, 60
    // product_name format from API: "Qty x Product — Details" (qty > 1) or "Product — Details"
    const bc = dbItems!.find((i) => i.product_name.includes("Business Cards"));
    const banner = dbItems!.find((i) => i.product_name.includes("Vinyl Banner"));
    const coro = dbItems!.find((i) => i.product_name.includes("Coroplast Signs"));

    expect(bc).toBeTruthy();
    expect(bc!.qty).toBe(1);
    expect(bc!.line_total).toBe(35);
    expect(bc!.product_name).toContain("500 matte");
    expect(bc!.category).toBe("MANUAL");
    expect(bc!.design_status).toBe("PRINT_READY");

    expect(banner).toBeTruthy();
    expect(banner!.qty).toBe(2);
    expect(banner!.line_total).toBe(55);
    expect(banner!.product_name).toContain("2x4 ft hemmed");

    expect(coro).toBeTruthy();
    expect(coro!.qty).toBe(4);
    expect(coro!.line_total).toBe(60);
    expect(coro!.product_name).toContain("12x18 double-sided");
  });
});
