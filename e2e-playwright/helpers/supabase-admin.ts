/**
 * Supabase admin helpers for E2E tests.
 * Uses service-role key to create/delete test users and generate magic links.
 *
 * Reads from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

let _client: SupabaseClient | null = null;

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing .env.local at ${envPath} — needed for E2E tests`);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

export function getAdminClient(): SupabaseClient {
  if (_client) return _client;
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export function getSiteUrl(): string {
  const env = loadEnv();
  return env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Test user prefix — makes cleanup easy */
const TEST_EMAIL_PREFIX = "tc-e2e-test";

export function testEmail(suffix = "default"): string {
  return `${TEST_EMAIL_PREFIX}+${suffix}@true-color.ca`;
}

export interface TestUser {
  id: string;
  email: string;
}

/**
 * Creates a test user with email_confirm: true so they're immediately verified.
 * Returns user ID + email. Idempotent — if user exists, returns existing.
 */
export async function createTestUser(
  suffix = "default",
  metadata?: Record<string, string>
): Promise<TestUser> {
  const admin = getAdminClient();
  const email = testEmail(suffix);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: "TestPass123!",
    user_metadata: { name: "E2E Test User", ...metadata },
  });

  if (error) {
    // User already exists — look them up
    if (error.message?.includes("already") || error.message?.includes("registered")) {
      const { data: listData } = await admin.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) return { id: existing.id, email };
    }
    throw new Error(`createTestUser failed: ${error.message}`);
  }

  return { id: data.user.id, email };
}

/**
 * Deletes a test user by email suffix. Non-fatal if user doesn't exist.
 */
export async function deleteTestUser(suffix = "default"): Promise<void> {
  const admin = getAdminClient();
  const email = testEmail(suffix);

  const { data: listData } = await admin.auth.admin.listUsers();
  const user = listData?.users?.find((u) => u.email === email);
  if (!user) return;

  await admin.auth.admin.deleteUser(user.id);

  // Also clean up customer row
  await admin.from("customers").delete().eq("email", email);
}

/**
 * Generates a magic link for the test user. Returns the full URL.
 */
export async function generateMagicLink(suffix = "default"): Promise<string> {
  const admin = getAdminClient();
  const email = testEmail(suffix);
  const siteUrl = getSiteUrl();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/account/callback` },
  });

  if (error) throw new Error(`generateMagicLink failed: ${error.message}`);
  return data.properties.action_link;
}

/**
 * Generates a password recovery link for the test user. Returns the full URL.
 */
export async function generatePasswordResetLink(suffix = "default"): Promise<string> {
  const admin = getAdminClient();
  const email = testEmail(suffix);
  const siteUrl = getSiteUrl();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/account/callback` },
  });

  if (error) throw new Error(`generatePasswordResetLink failed: ${error.message}`);
  return data.properties.action_link;
}

/**
 * Creates a test order for a test user (via direct DB insert).
 * Returns order ID and order number.
 */
export async function createTestOrder(
  suffix = "default",
  overrides: Partial<{
    status: string;
    subtotal: number;
    total: number;
    payment_method: string;
  }> = {}
): Promise<{ orderId: string; orderNumber: string }> {
  const admin = getAdminClient();
  const email = testEmail(suffix);

  // Get or create customer
  const { data: customer } = await admin
    .from("customers")
    .upsert(
      { email, name: "E2E Test User", phone: "3060000000" },
      { onConflict: "email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (!customer) throw new Error("Failed to create test customer");

  const orderNumber = `TC-E2E-${Date.now()}`;
  const subtotal = overrides.subtotal ?? 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const pst = Math.round(subtotal * 0.06 * 100) / 100;
  const total = overrides.total ?? Math.round((subtotal + gst + pst) * 100) / 100;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      customer_id: customer.id,
      order_number: orderNumber,
      status: overrides.status ?? "payment_received",
      subtotal,
      gst,
      pst,
      total,
      payment_method: overrides.payment_method ?? "clover",
    })
    .select("id, order_number")
    .single();

  if (error || !order) throw new Error(`Failed to create test order: ${error?.message}`);

  // Add a test order item
  await admin.from("order_items").insert({
    order_id: order.id,
    product_name: "E2E Test Product",
    category: "coroplast-signs",
    qty: 2,
    width_in: 24,
    height_in: 18,
    sides: 1,
    line_total: subtotal,
    design_status: "pending",
  });

  return { orderId: order.id, orderNumber: order.order_number };
}

/**
 * Deletes all test orders for a test user.
 */
export async function deleteTestOrders(suffix = "default"): Promise<void> {
  const admin = getAdminClient();
  const email = testEmail(suffix);

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!customer) return;

  // Delete order items first (FK constraint)
  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .eq("customer_id", customer.id);

  if (orders?.length) {
    const orderIds = orders.map((o) => o.id);
    await admin.from("order_items").delete().in("order_id", orderIds);
    await admin.from("orders").delete().in("id", orderIds);
  }
}
