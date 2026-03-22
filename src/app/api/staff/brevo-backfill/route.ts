/**
 * POST /api/staff/brevo-backfill
 *
 * One-time backfill: syncs all existing customers (with at least one order)
 * to Brevo list 25 ("True Color Customers") with aggregate order data.
 *
 * Staff-only. Idempotent — safe to run multiple times (updateEnabled: true).
 * Fetches all data in 2 queries (customers + orders), then batches Brevo calls.
 */

import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

const BREVO_API = "https://api.brevo.com/v3";
const CUSTOMER_LIST_ID = 25;
const BREVO_BATCH_SIZE = 10;

interface OrderRow {
  customer_id: string;
  order_number: string;
  total: number;
  created_at: string;
  status: string;
  order_items: { product_name: string }[];
}

export async function POST() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "BREVO_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createServiceClient();

  // 1. Fetch all customers + all orders in 2 queries (no N+1)
  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("id, name, email, company, phone");

  if (custErr) {
    return NextResponse.json({ error: custErr.message }, { status: 500 });
  }

  if (!customers || customers.length === 0) {
    return NextResponse.json({ synced: 0, skipped: 0, errors: [] });
  }

  const { data: allOrders, error: ordErr } = await supabase
    .from("orders")
    .select(
      "customer_id, order_number, total, created_at, status, order_items ( product_name )"
    )
    .order("created_at", { ascending: false });

  if (ordErr) {
    return NextResponse.json({ error: ordErr.message }, { status: 500 });
  }

  // Group orders by customer_id
  const ordersByCustomer = new Map<string, OrderRow[]>();
  for (const o of (allOrders ?? []) as OrderRow[]) {
    const arr = ordersByCustomer.get(o.customer_id) ?? [];
    arr.push(o);
    ordersByCustomer.set(o.customer_id, arr);
  }

  // Fetch auth users to determine ACCOUNT_STATUS accurately
  const authEmails = new Set<string>();
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (u.email) authEmails.add(u.email.toLowerCase());
    }
  }

  // 2. Build Brevo payloads
  type ContactPayload = {
    email: string;
    attributes: Record<string, string | number>;
    listIds: number[];
    updateEnabled: true;
  };
  const payloads: ContactPayload[] = [];
  let skipped = 0;

  for (const cust of customers) {
    if (!cust.email) {
      skipped++;
      continue;
    }

    const custOrders = ordersByCustomer.get(cust.id);
    if (!custOrders || custOrders.length === 0) {
      skipped++;
      continue;
    }

    const orderCount = custOrders.length;
    const totalSpent = custOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const lastOrder = custOrders[0];
    const firstOrder = custOrders[custOrders.length - 1];
    const lastProduct = lastOrder.order_items
      .map((i) => i.product_name)
      .join(", ")
      .slice(0, 100);

    const toDate = (iso: string) => iso.split("T")[0];

    const nameParts = (cust.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] || cust.email.split("@")[0];
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const attributes: Record<string, string | number> = {
      FIRSTNAME: firstName,
      ORDER_COUNT: orderCount,
      TOTAL_SPENT: Math.round(totalSpent * 100) / 100,
      LAST_ORDER_DATE: toDate(lastOrder.created_at),
      FIRST_ORDER_DATE: toDate(firstOrder.created_at),
      LAST_ORDER_NUMBER: lastOrder.order_number,
      LAST_PRODUCT: lastProduct || "N/A",
      CUSTOMER_SOURCE: "backfill",
      CONSENT_TYPE: "implied_business",
      ACCOUNT_STATUS: authEmails.has(cust.email.toLowerCase()) ? "active" : "none",
    };

    if (lastName) attributes.LASTNAME = lastName;
    if (cust.company) attributes.COMPANY = cust.company;
    if (cust.phone) attributes.SMS = cust.phone;

    payloads.push({
      email: cust.email.toLowerCase(),
      attributes,
      listIds: [CUSTOMER_LIST_ID],
      updateEnabled: true,
    });
  }

  // 3. Send to Brevo in concurrent batches
  let synced = 0;
  const errors: { email: string; error: string }[] = [];

  for (let i = 0; i < payloads.length; i += BREVO_BATCH_SIZE) {
    const batch = payloads.slice(i, i + BREVO_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (payload) => {
        const res = await fetch(`${BREVO_API}/contacts`, {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          await res.text().catch(() => "");
          throw new Error(`Brevo ${res.status}`);
        }
      })
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        synced++;
      } else {
        errors.push({
          email: batch[j].email,
          error: result.reason instanceof Error
            ? result.reason.message
            : "Unknown error",
        });
      }
    }
  }

  return NextResponse.json({ synced, skipped, errors });
}
