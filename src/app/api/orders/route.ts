/**
 * POST /api/orders
 *
 * Creates:
 *   1. Supabase customer (upsert by email)
 *   2. Supabase order + order_items rows
 *   3. Wave invoice (DRAFT — silent, not sent to customer yet)
 *   4. Clover Hosted Checkout session
 *
 * Returns: { orderId, orderNumber, checkoutUrl }
 * On eTransfer: returns { orderId, orderNumber, checkoutUrl: null }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { CloverCheckoutError, createCloverCheckout } from "@/lib/payment/clover";
import {
  completeOrderCheckout,
  failOrderCheckout,
  reserveOrderCheckout,
} from "@/lib/payment/order-checkout";
import {
  provisionOrderWaveInvoice,
  QuoteWaveProvisioningError,
} from "@/lib/payment/quote-wave";
import { encodePaymentToken } from "@/lib/payment/token";
import type { CartItem } from "@/lib/cart/cart";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { sendStaffOrderNotification } from "@/lib/email/staffNotification";
import { estimate } from "@/lib/engine";
import { sanitizeError } from "@/lib/errors/sanitize";
import { computeOrderMinSurcharge, SMALL_ORDER_FEE_LABEL } from "@/lib/pricing/order-min";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { classifyReferrer } from "@/lib/analytics/referrer";
import { mergeLatestPaidAttribution, mergeUtmAttribution } from "@/lib/analytics/utm";
import { mapAttributionToDb, mapLatestPaidAttributionToDb } from "@/lib/analytics/attribution-db";
import { recordAuditEvent, extractRequestContext } from "@/lib/audit/record";

export interface CreateOrderRequest {
  checkout_submission_id: string;
  items: CartItem[];
  contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  };
  is_rush: boolean;
  payment_method: "clover_card" | "etransfer";
  notes?: string;
  file_storage_paths?: string[];
  discount_code?: string;   // optional — re-validated server-side before use
  discount_amount?: number; // client hint only — authoritative amount comes from DB
  marketing_consent?: boolean; // CASL — explicit opt-in from checkout checkbox
  utm_source?: string;     // first-touch attribution — captured by UtmCapture
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  keyword?: string;
  matchtype?: string;
  device?: string;
  loc_physical_ms?: string;
  loc_interest_ms?: string;
  adgroupid?: string;
  creative?: string;
  campaignid?: string;
  network?: string;
}

const GST_RATE = 0.05;
const PST_RATE = 0.06;
const RUSH_FEE = 40;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Server-side price revalidation.
 * Re-runs the pricing engine for each cart item and overrides the client-submitted
 * sell_price with the authoritative server price. Prevents price manipulation attacks
 * where a malicious user submits fake prices (e.g. sell_price: 0.01).
 *
 * If the engine can't price an item, checkout is rejected. Custom/unusual work
 * must use the quote flow; public client prices are never authoritative.
 *
 * NOTE: is_rush is intentionally NOT passed to the engine here. Rush is a flat $40
 * per-order fee applied at the order level (line 246), not per-item. Passing is_rush
 * to estimate() would add $40 to EACH item's sell_price, then the order-level rush
 * would add another $40, resulting in overcharging.
 */
export function revalidateItemPrices(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    try {
      const result = estimate({
        category: item.category as Parameters<typeof estimate>[0]["category"],
        material_code: item.config.material_code,
        width_in: item.config.width_in,
        height_in: item.config.height_in,
        sides: item.config.sides as 1 | 2 | undefined,
        qty: item.qty,
        addons: item.config.addons as Parameters<typeof estimate>[0]["addons"],
        design_status: item.config.design_status as Parameters<typeof estimate>[0]["design_status"],
        is_rush: false,
      });

      if (result.status === "QUOTED" && result.sell_price != null) {
        const serverPrice = result.sell_price;
        const clientPrice = item.sell_price;
        const diff = Math.abs(serverPrice - clientPrice);
        const diffPct = clientPrice > 0 ? diff / clientPrice : 1;

        if (diffPct > 0.01 || diff > 0.5) {
          // Log manipulation attempt or stale client-side price
          console.warn(
            `[orders] price revalidation: client=$${clientPrice.toFixed(2)} server=$${serverPrice.toFixed(2)} diff=$${diff.toFixed(2)} (${(diffPct * 100).toFixed(1)}%) — using server price | item: ${item.product_name}`
          );
        }
        return { ...item, sell_price: serverPrice, design_fee: result.design_fee ?? 0, line_items: result.line_items };
      }
      throw new Error(`Pricing engine returned ${result.status}`);
    } catch (err) {
      console.error(`[orders] price revalidation error for ${item.product_name}:`, err);
      throw new Error(`Unable to price ${item.product_name}. Please request a custom quote.`);
    }
  });
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 orders per IP per minute (generous for a print shop)
  const ip = getClientIp(req);
  if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as CreateOrderRequest;
    const {
      checkout_submission_id, items: rawItems, contact, is_rush, payment_method, notes, file_storage_paths,
      discount_code: rawDiscountCode, marketing_consent,
      utm_source, utm_campaign, utm_medium, utm_content, utm_term,
      gclid, gbraid, wbraid, keyword, matchtype, device, loc_physical_ms,
      loc_interest_ms, adgroupid, creative, campaignid, network,
    } = body;

    if (!UUID_RE.test(checkout_submission_id ?? "")) {
      return NextResponse.json({ error: "A valid checkout submission ID is required" }, { status: 400 });
    }

    if (!rawItems?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (rawItems.length > 20) {
      return NextResponse.json({ error: "Too many items in cart (max 20)" }, { status: 400 });
    }
    if (!contact?.email || !contact?.name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    // Input length limits
    if (contact.name.length > 100) {
      return NextResponse.json({ error: "Name is too long (max 100 characters)" }, { status: 400 });
    }
    if (contact.email.length > 254) {
      return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }
    if ((contact.company ?? "").length > 100) {
      return NextResponse.json({ error: "Company name is too long (max 100 characters)" }, { status: 400 });
    }
    if ((contact.phone ?? "").length > 20) {
      return NextResponse.json({ error: "Phone number is too long" }, { status: 400 });
    }
    if ((notes ?? "").length > 1000) {
      return NextResponse.json({ error: "Order notes are too long (max 1000 characters)" }, { status: 400 });
    }

    // ── Server-side price revalidation (prevents price manipulation attacks) ──
    let items: CartItem[];
    try {
      items = revalidateItemPrices(rawItems);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "One or more items require a custom quote." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // 1. Find-or-insert customer.
    // The old upsert overwrote name/company/phone on every order — a returning
    // customer typing "jane" instead of "Jane Smith" or leaving phone blank
    // wiped their good profile data. The customer profile is owned by /account;
    // checkout only seeds it on first order. Updates flow through ProfileForm.
    const emailKey = contact.email.toLowerCase().trim();
    let customer: { id: string } | null = null;

    const { data: existing, error: lookupErr } = await supabase
      .from("customers")
      .select("id")
      .eq("email", emailKey)
      .maybeSingle();

    if (lookupErr) {
      console.error("[orders] customer lookup:", lookupErr);
      return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
    }

    if (existing) {
      customer = existing;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("customers")
        .insert({
          email: emailKey,
          name: contact.name.trim(),
          company: contact.company?.trim() || null,
          phone: contact.phone?.trim() || null,
        })
        .select("id")
        .single();
      if (insErr) {
        // Concurrent first-time orders from the same email — one wins the
        // unique constraint, the other re-selects.
        const { data: raced } = await supabase
          .from("customers")
          .select("id")
          .eq("email", emailKey)
          .maybeSingle();
        if (!raced) {
          console.error("[orders] customer insert + re-fetch failed:", insErr);
          return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
        }
        customer = raced;
      } else {
        customer = inserted;
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
    }

    // Save CASL marketing consent (non-fatal — columns added via migration).
    // Must `await` — void doesn't fire the HTTP request (2026-05-15 audit).
    if (marketing_consent !== undefined) {
      const { error: consentErr } = await supabase
        .from("customers")
        .update({
          marketing_consent: marketing_consent === true,
          consent_at: new Date().toISOString(),
          consent_ip: ip,
        } as Record<string, unknown>)
        .eq("id", customer.id);
      if (consentErr) console.error("[orders] marketing_consent save failed (non-fatal):", consentErr.message);
    }

    // Update address if provided (non-fatal — column added via migration, may not exist yet).
    if (contact.address?.trim()) {
      const { error: addrErr } = await supabase
        .from("customers")
        .update({ address: contact.address.trim() } as Record<string, unknown>)
        .eq("id", customer.id);
      if (addrErr) console.error("[orders] address save failed (non-fatal):", addrErr.message);
    }

    // Append company to saved companies[] list (non-fatal — requires migration)
    if (contact.company?.trim()) {
      void (async () => {
        try {
          const { data: c } = await supabase
            .from("customers")
            .select("companies")
            .eq("id", customer.id)
            .maybeSingle();
          const current: string[] = Array.isArray((c as { companies?: unknown })?.companies)
            ? (c as { companies: string[] }).companies
            : [];
          const newCo = contact.company!.trim();
          if (!current.includes(newCo)) {
            await supabase
              .from("customers")
              .update({ companies: [...current, newCo] } as Record<string, unknown>)
              .eq("id", customer.id);
          }
        } catch {
          // companies column may not exist yet — skip
        }
      })();
    }

    // 2. Validate discount code (server-side — never trust client amount)
    let validatedDiscountCode: string | null = null;
    let validatedDiscount = 0;
    let discountCodeId: string | null = null;
    const { data: storedSubmission, error: storedSubmissionError } = await supabase
      .from("orders")
      .select("discount_code, discount_amount")
      .eq("checkout_submission_id", checkout_submission_id)
      .maybeSingle();
    if (storedSubmissionError) {
      return NextResponse.json({ error: "Could not verify the saved checkout attempt" }, { status: 500 });
    }
    if (storedSubmission) {
      validatedDiscountCode = typeof storedSubmission.discount_code === "string"
        ? storedSubmission.discount_code
        : null;
      validatedDiscount = Math.max(0, Number(storedSubmission.discount_amount ?? 0));
    } else if (rawDiscountCode?.trim()) {
      try {
        const codeUpper = rawDiscountCode.trim().toUpperCase();
        const { data: dc } = await supabase
          .from("discount_codes")
          .select("id, code, discount_amount, is_active, per_account_limit, max_uses, expires_at")
          .ilike("code", codeUpper)
          .maybeSingle();

        if (dc && dc.is_active && (!dc.expires_at || new Date(dc.expires_at) > new Date())) {
          // Check per-account usage
          const { count: used } = await supabase
            .from("discount_redemptions")
            .select("*", { count: "exact", head: true })
            .eq("code_id", dc.id)
            .eq("customer_id", customer.id);

          // Check global max_uses
          let globalOk = true;
          if (dc.max_uses !== null) {
            const { count: totalUsed } = await supabase
              .from("discount_redemptions")
              .select("*", { count: "exact", head: true })
              .eq("code_id", dc.id);
            globalOk = (totalUsed ?? 0) < dc.max_uses;
          }

          if ((used ?? 0) < dc.per_account_limit && globalOk) {
            validatedDiscountCode = dc.code;
            validatedDiscount = Number(dc.discount_amount);
            discountCodeId = dc.id;
          } else {
            console.warn(`[orders] discount code ${codeUpper} rejected — already used or limit reached for customer ${customer.id}`);
          }
        } else if (dc) {
          console.warn(`[orders] discount code ${codeUpper} rejected — inactive or expired`);
        }
      } catch (discountErr) {
        // Non-fatal — order proceeds without discount
        console.error("[orders] discount validation error (non-fatal):", discountErr);
      }
    }

    // 3. Calculate totals
    const itemsSubtotal = items.reduce((s, i) => s + i.sell_price, 0);
    const rush = is_rush ? RUSH_FEE : 0;
    // Discount reduces pre-tax base (legally correct — reduces taxable amount)
    const discount = Math.min(validatedDiscount, itemsSubtotal + rush); // cap: total can't go negative
    const discountedItemsSubtotal = itemsSubtotal - discount;
    // Order-total minimum surcharge — replaces the per-product min charge that was
    // killed 2026-05-19. If the discounted items total is below the order minimum
    // ($25), top it up via a transparent "Small order setup fee" line. Discount is
    // applied first so customers using a coupon don't get unexpectedly bumped.
    // PST applies to it (setup is a service on tangible goods); GST always applies.
    const orderMin = computeOrderMinSurcharge(discountedItemsSubtotal + rush);
    const smallOrderFee = orderMin.surcharge;
    const discountedSubtotal = discountedItemsSubtotal + smallOrderFee;
    // Saskatchewan PST-20 taxes the full charge for taxable printed material,
    // including design, production, rush, and setup charges.
    const pstBase = Math.max(0, discountedSubtotal + rush);
    const gst = Math.round((discountedSubtotal + rush) * GST_RATE * 100) / 100;
    const pst = Math.round(pstBase * PST_RATE * 100) / 100;
    const total = discountedSubtotal + rush + gst + pst;
    const checkoutRequestFingerprint = createHash("sha256")
      .update(JSON.stringify({
        customer: {
          email: emailKey,
          name: contact.name.trim(),
          company: contact.company?.trim() || null,
          phone: contact.phone?.trim() || null,
          address: contact.address?.trim() || null,
        },
        payment_method,
        is_rush,
        notes: notes?.trim() || null,
        discount_code: validatedDiscountCode,
        discount_cents: Math.round(discount * 100),
        items: items.map((item) => ({
          category: item.category,
          product_name: item.product_name,
          qty: item.qty,
          sell_price_cents: Math.round(item.sell_price * 100),
          design_fee_cents: Math.round((item.design_fee ?? 0) * 100),
          material_code: item.config.material_code ?? null,
          width_in: item.config.width_in ?? null,
          height_in: item.config.height_in ?? null,
          sides: item.config.sides ?? 1,
          addons: [...(item.config.addons ?? [])].sort(),
          design_status: item.config.design_status ?? "PRINT_READY",
        })),
      }))
      .digest("hex");

    // 3. Create order row — retry up to 3 times on order_number collision (Postgres code 23505)
    // count+1 approach: safe for a small shop; retry handles the rare concurrent-request edge case
    const orderYear = new Date().getFullYear();
    type OrderRow = {
      id: string;
      order_number: string;
      customer_id: string;
      status: string;
      paid_at: string | null;
      total: number;
      payment_method: string;
      conversion_type: string | null;
      quote_request_id: string | null;
      checkout_request_fingerprint: string | null;
    };
    type OrderInsertError = { code?: string; message?: string; details?: string; hint?: string } | null;
    let order: OrderRow | null = null;
    let orderErr: OrderInsertError = null;
    let resumedOrder = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      const orderNumber = `TC-${orderYear}-${String((orderCount ?? 0) + 1).padStart(4, "0")}`;

      const utm = mergeUtmAttribution(
        {
          utm_source, utm_campaign, utm_medium, utm_content, utm_term,
          gclid, gbraid, wbraid, keyword, matchtype, device, loc_physical_ms,
          loc_interest_ms, adgroupid, creative, campaignid, network,
        },
        req.headers.get("cookie"),
      );
      const latestPaidTouch = mergeLatestPaidAttribution(
        {
          utm_source, utm_campaign, utm_medium, utm_content, utm_term,
          gclid, gbraid, wbraid, keyword, matchtype, device, loc_physical_ms,
          loc_interest_ms, adgroupid, creative, campaignid, network,
        },
        req.headers.get("cookie"),
      );
      // Prefer the cookie's first-touch landing_referrer (true upstream — e.g.
      // google.com, maps.google.com, chatgpt.com) over the POST request's Referer
      // header which is always self-domain (/checkout). Falls back to the request
      // header only when the cookie is missing (older sessions pre-fix).
      const firstTouchRef = utm.landing_referrer || req.headers.get("referer") || null;
      const refClass = classifyReferrer(firstTouchRef);

      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          status: "pending_payment",
          is_rush,
          subtotal: discountedSubtotal,
          gst,
          pst,
          total,
          discount_code: validatedDiscountCode ?? undefined,
          discount_amount: discount,
          payment_method,
          checkout_submission_id,
          checkout_request_fingerprint: checkoutRequestFingerprint,
          conversion_type: "purchase_online",
          conversion_key: `purchase_online:${orderNumber}`,
          notes: notes?.trim() || (contact.company ? `Company: ${contact.company}` : null),
          ...mapAttributionToDb(utm),
          ...mapLatestPaidAttributionToDb(latestPaidTouch),
          referrer_source: (utm.utm_source ?? refClass.source).slice(0, 100),
          referrer_medium: (utm.utm_medium ?? refClass.medium).slice(0, 50),
          raw_referrer: (utm.landing_referrer ?? req.headers.get("referer") ?? "").slice(0, 500) || null,
        })
        .select("id, order_number, customer_id, status, paid_at, total, payment_method, conversion_type, quote_request_id, checkout_request_fingerprint")
        .single();

      order = data as OrderRow | null;
      orderErr = error as OrderInsertError;
      if (!error || (error as { code?: string }).code !== "23505") break;

      // A repeated browser submission reuses the one existing order. This
      // lookup distinguishes the idempotency-key conflict from an unrelated
      // order_number collision, which still retries with a fresh number.
      const { data: existingAttempt, error: existingAttemptError } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, status, paid_at, total, payment_method, conversion_type, quote_request_id, checkout_request_fingerprint")
        .eq("checkout_submission_id", checkout_submission_id)
        .maybeSingle();
      if (existingAttemptError) {
        orderErr = existingAttemptError as OrderInsertError;
        break;
      }
      if (existingAttempt) {
        order = existingAttempt as OrderRow;
        orderErr = null;
        resumedOrder = true;
        break;
      }
      // Otherwise this was an order_number collision; re-fetch count and retry.
    }

    if (orderErr || !order) {
      console.error("[orders] INSERT failed:", {
        code: orderErr?.code,
        message: orderErr?.message,
        details: orderErr?.details,
        hint: orderErr?.hint,
      });
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    if (resumedOrder) {
      const sameAttempt = order.customer_id === customer.id &&
        order.checkout_request_fingerprint === checkoutRequestFingerprint &&
        order.payment_method === payment_method &&
        order.conversion_type === "purchase_online" && order.quote_request_id === null;
      if (!sameAttempt) {
        return NextResponse.json(
          { error: "This checkout attempt no longer matches the saved order. No payment was started." },
          { status: 409 },
        );
      }
      if (order.paid_at !== null && ["payment_received", "in_production", "ready_for_pickup", "complete"].includes(order.status)) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
        return NextResponse.json({
          orderId: order.id,
          orderNumber: order.order_number,
          checkoutUrl: `${siteUrl}/order-confirmed?oid=${order.id}`,
          waveInvoiceId: null,
        });
      }
      if (order.status !== "pending_payment" || order.paid_at !== null) {
        return NextResponse.json(
          { error: "This checkout attempt is no longer payable. No payment was started." },
          { status: 409 },
        );
      }
    }

    // Audit event: order created (non-fatal — see src/lib/audit/record.ts)
    const reqCtx = extractRequestContext(req);
    if (!resumedOrder) void recordAuditEvent({
      actor_type: "customer",
      actor_id: contact.email.toLowerCase().trim(),
      event_type: "order.created",
      entity_type: "order",
      entity_id: order.id,
      detail: {
        order_number: order.order_number,
        total,
        payment_method,
        is_rush,
        item_count: items.length,
        discount_code: validatedDiscountCode ?? null,
      },
      ip: reqCtx.ip,
      user_agent: reqCtx.user_agent,
    });

    // Increment customer lifetime stats (non-fatal)
    if (!resumedOrder) void (async () => {
      try {
        const { data: c } = await supabase
          .from("customers")
          .select("order_count, total_spent")
          .eq("id", customer.id)
          .single();
        if (c) {
          await supabase
            .from("customers")
            .update({
              order_count: (c.order_count ?? 0) + 1,
              total_spent: Math.round(((c.total_spent ?? 0) + total) * 100) / 100,
            })
            .eq("id", customer.id);
        }
      } catch {
        console.error("[orders] customer stats increment failed (non-fatal)");
      }
    })();

    // Clear staff-assigned pending discount once consumed (non-fatal). Must `await`.
    if (!resumedOrder && validatedDiscountCode) {
      const { error: clearErr } = await supabase
        .from("customers")
        .update({ pending_discount_code: null } as Record<string, unknown>)
        .eq("id", customer.id)
        .eq("pending_discount_code", validatedDiscountCode); // guard: only clear the code that was actually used
      if (clearErr) console.error("[orders] pending_discount_code clear failed (non-fatal):", clearErr.message);
    }

    // Record discount redemption (non-fatal — order is already saved)
    if (!resumedOrder && discountCodeId && discount > 0) {
      void supabase
        .from("discount_redemptions")
        .insert({
          code_id: discountCodeId,
          customer_id: customer.id,
          order_id: order.id,
          amount_saved: discount,
        } as Record<string, unknown>)
        .then(({ error: redemptionErr }) => {
          if (redemptionErr) {
            console.error("[orders] discount redemption insert failed (non-fatal):", redemptionErr);
          }
        });
    }

    // Save all file paths to order (requires DB migration: file_storage_paths TEXT[] — best-effort).
    // Must `await`.
    if (file_storage_paths?.length) {
      const { error: filesErr } = await supabase
        .from("orders")
        .update({ file_storage_paths } as Record<string, unknown>)
        .eq("id", order.id);
      if (filesErr) console.error("[orders] file_storage_paths save failed (non-fatal):", filesErr.message);
    }

    // 4. Create order_items rows
    // line_items_json requires DB migration: ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_items_json JSONB;
    const orderItems = items.map((item, index) => ({
      order_id: order.id,
      checkout_line_key: `${checkout_submission_id}:${index}`,
      category: item.category,
      product_name: item.product_name,
      material_code: item.config.material_code ?? null,
      width_in: item.config.width_in ?? null,
      height_in: item.config.height_in ?? null,
      sides: item.config.sides ?? 1,
      qty: item.qty,
      addons: item.config.addons ?? [],
      is_rush,
      design_status: item.config.design_status ?? "PRINT_READY",
      unit_price: item.sell_price / item.qty,
      line_total: item.sell_price,
      ...(item.line_items ? { line_items_json: item.line_items } : {}),
    }));

    // Attach first file path to first order item (DB column only stores one path per item)
    if (file_storage_paths?.length && orderItems.length > 0) {
      (orderItems[0] as Record<string, unknown>).file_storage_path = file_storage_paths[0];
    }

    // Append the small-order setup fee as a transparent order line so the customer
    // receipt + order detail page explain the surcharge instead of mystery dollars.
    if (smallOrderFee > 0) {
      orderItems.push({
        order_id: order.id,
        checkout_line_key: `${checkout_submission_id}:${orderItems.length}`,
        category: "SERVICE",
        product_name: SMALL_ORDER_FEE_LABEL,
        material_code: null,
        width_in: null,
        height_in: null,
        sides: 1,
        qty: 1,
        addons: [],
        is_rush,
        design_status: "PRINT_READY",
        unit_price: smallOrderFee,
        line_total: smallOrderFee,
      });
    }

    const { error: itemsErr } = await supabase
      .from("order_items")
      .upsert(orderItems, { onConflict: "checkout_line_key", ignoreDuplicates: true });
    if (itemsErr) {
      console.error("[orders] order_items upsert:", itemsErr);
      return NextResponse.json(
        { error: "Could not save the order items. No payment was started." },
        { status: 500 },
      );
    }

    const { data: persistedItems, error: persistedItemsError } = await supabase
      .from("order_items")
      .select("checkout_line_key, line_total")
      .eq("order_id", order.id);
    if (persistedItemsError) {
      return NextResponse.json(
        { error: "Could not verify the saved order items. No payment was started." },
        { status: 500 },
      );
    }
    const expectedKeys = new Set(orderItems.map((item) => item.checkout_line_key));
    const persistedSubtotalCents = (persistedItems ?? []).reduce(
      (sum, item) => sum + Math.round(Number(item.line_total) * 100),
      0,
    );
    const expectedSubtotalCents = orderItems.reduce(
      (sum, item) => sum + Math.round(Number(item.line_total) * 100),
      0,
    );
    if (
      persistedItems?.length !== orderItems.length ||
      persistedSubtotalCents !== expectedSubtotalCents ||
      persistedItems.some((item) => !expectedKeys.has(String(item.checkout_line_key)))
    ) {
      return NextResponse.json(
        { error: "The saved order items no longer match this checkout attempt. No payment was started." },
        { status: 409 },
      );
    }

    // 5. Provision and approve Wave under a locked, fail-closed reservation.
    // Clover is unreachable until the approved invoice is durably linked to
    // this order. Any outcome after a Wave call begins is treated as ambiguous
    // and requires staff reconciliation instead of an automatic retry.
    const waveItems = items.flatMap((item) => {
      const fee = item.design_fee ?? 0;
      const productAmt = item.sell_price - fee;
      const lines = [];
      if (productAmt > 0) {
        lines.push({ description: item.label, unitPrice: productAmt / item.qty, qty: item.qty, applyGst: true, applyPst: true });
      }
      if (fee > 0) {
        lines.push({ description: "Design / Artwork Fee", unitPrice: fee, qty: 1, applyGst: true, applyPst: true });
      }
      if (productAmt <= 0 && fee <= 0) {
        lines.push({ description: item.label, unitPrice: item.sell_price / item.qty, qty: item.qty, applyGst: true, applyPst: true });
      }
      return lines;
    });

    if (discount > 0) {
      waveItems.push({
        description: `Discount${validatedDiscountCode ? ` (${validatedDiscountCode})` : ""}`,
        unitPrice: -discount,
        qty: 1,
        applyGst: true,
        applyPst: true,
      });
    }
    if (smallOrderFee > 0) {
      waveItems.push({
        description: SMALL_ORDER_FEE_LABEL,
        unitPrice: smallOrderFee,
        qty: 1,
        applyGst: true,
        applyPst: true,
      });
    }

    let waveInvoiceId: string | null = null;
    try {
      const wave = await provisionOrderWaveInvoice(
        supabase,
        order.id,
        resumedOrder ? undefined : {
          orderNumber: order.order_number,
          customerEmail: emailKey,
          customerName: contact.name.trim(),
          waveItems,
          isRush: is_rush,
        },
      );
      if (wave.action !== "ready" || !wave.invoiceId) {
        return NextResponse.json(
          { error: "Order accounting setup is still being verified. No payment was started.", orderId: order.id },
          { status: 409 },
        );
      }
      waveInvoiceId = wave.invoiceId;
    } catch (waveErr) {
      const msg = waveErr instanceof Error ? waveErr.message : String(waveErr);
      const ambiguous = waveErr instanceof QuoteWaveProvisioningError && waveErr.ambiguous;
      console.error("[orders] Wave provisioning blocked checkout:", msg);
      void recordAuditEvent({
        actor_type: "system",
        actor_id: "api/orders",
        event_type: "wave.order_provision_failed",
        entity_type: "order",
        entity_id: order.id,
        detail: { order_number: order.order_number, ambiguous, clover_called: false, error: msg.slice(0, 500) },
      });
      return NextResponse.json(
        { error: "Order accounting setup could not be confirmed. No payment was started.", orderId: order.id },
        { status: 503 },
      );
    }

    // 6. Clover Hosted Checkout (card) or /pay/{token} fallback URL (eTransfer)
    let checkoutUrl: string | null = null;
    let emailCheckoutUrl: string | null = null;
    if (payment_method === "clover_card") {
      const totalCents = Math.round(total * 100);
      const description =
        items.length === 1
          ? `True Color Order ${order.order_number} — ${items[0].product_name}`
          : `True Color Order ${order.order_number} (${items.length} items)`;

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        "https://truecolorprinting.ca";
      const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;

      const checkoutReservation = await reserveOrderCheckout(supabase, order.id);
      if (checkoutReservation.action === "resume" && checkoutReservation.checkoutUrl) {
        checkoutUrl = checkoutReservation.checkoutUrl;
      } else if (checkoutReservation.action === "wait") {
        return NextResponse.json(
          { error: "Secure checkout is already being created or verified. No second session was started.", orderId: order.id },
          { status: 409 },
        );
      } else {
        if (!checkoutReservation.reservationId) {
          return NextResponse.json(
            { error: "Secure checkout could not be reserved. No payment was started.", orderId: order.id },
            { status: 503 },
          );
        }
        try {
          const clover = await createCloverCheckout(totalCents, description, contact.email, redirectUrl, order.id);
          await completeOrderCheckout(supabase, {
            orderId: order.id,
            reservationId: checkoutReservation.reservationId,
            checkoutUrl: clover.checkoutUrl,
            sessionId: clover.sessionId,
            expiresAt: clover.expiresAt,
          });
          checkoutUrl = clover.checkoutUrl;
        } catch (cloverError) {
          const ambiguous = !(cloverError instanceof CloverCheckoutError) || cloverError.outcome === "ambiguous";
          await failOrderCheckout(supabase, {
            orderId: order.id,
            reservationId: checkoutReservation.reservationId,
            ambiguous,
            error: cloverError instanceof Error ? cloverError.message : "Unknown Clover checkout error",
          }).catch((reservationError) => {
            console.error("[orders] Clover reservation failure update failed:", reservationError);
          });
          return NextResponse.json(
            {
              error: ambiguous
                ? "Secure checkout is being verified. No second session will be started."
                : "Secure checkout could not be started. Please try again.",
              orderId: order.id,
            },
            { status: ambiguous ? 409 : 503 },
          );
        }
      }

      // The durable email link resumes this reservation and creates a new
      // session only after the prior one has definitely expired.
      try {
        const payToken = encodePaymentToken(total, description, contact.email, redirectUrl, {
          orderId: order.id,
        });
        emailCheckoutUrl = `${siteUrl}/pay/${payToken}`;
      } catch {
        emailCheckoutUrl = checkoutUrl;
      }
    } else if (payment_method === "etransfer") {
      // Generate a /pay/{token} URL as an optional card payment fallback.
      // No Clover API call needed — /pay/ creates a fresh Clover session on each click.
      // Stored in payment_reference (unused/null for eTransfer orders) so the
      // /order-confirmed page and email can surface a "Pay by card instead" option.
      try {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ??
          "https://truecolorprinting.ca";
        const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
        const desc =
          items.length === 1
            ? items[0].product_name
            : `True Color Order ${order.order_number} (${items.length} items)`;
        const payToken = encodePaymentToken(total, desc, contact.email, redirectUrl, {
          orderId: order.id,
        });
        checkoutUrl = `${siteUrl}/pay/${payToken}`;
        emailCheckoutUrl = checkoutUrl;
        // Note: this is the eTransfer fallback path where payment_reference stores
        // the /pay/{token} URL (not the order.id). Used by /order-confirmed to
        // surface a "Pay by card instead" option. Must `await`.
        const { error: updErr } = await supabase
          .from("orders")
          .update({ payment_reference: checkoutUrl } as Record<string, unknown>)
          .eq("id", order.id);
        if (updErr) console.error("[orders] payment_reference save (eTransfer fallback) failed (non-fatal):", updErr.message);
      } catch {
        // Non-fatal — eTransfer still works without card fallback
      }
    }


    // 7. Send order confirmation email to customer (non-fatal)
    if (!resumedOrder) try {
      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        contact,
        items: orderItems.map((item, idx) => ({
          product_name: item.product_name,
          qty: item.qty,
          width_in: item.width_in,
          height_in: item.height_in,
          sides: item.sides,
          design_status: item.design_status,
          line_total: item.line_total,
          line_items: items[idx]?.line_items,
        })),
        subtotal: discountedSubtotal,
        gst,
        pst,
        total,
        discount_code: validatedDiscountCode ?? undefined,
        discount_amount: discount > 0 ? discount : undefined,
        is_rush,
        payment_method,
        checkout_url: emailCheckoutUrl ?? checkoutUrl ?? undefined,
        uploadedFileCount: file_storage_paths?.length ?? 0,
      });
    } catch (emailErr) {
      console.error("[orders] confirmation email failed (non-fatal):", emailErr);
    }

    // 9. Brevo sync deferred to payment_received — see webhooks/clover/route.ts and confirm-etransfer/route.ts
    // Syncing at pending_payment caused drip emails to fire before payment was confirmed (TC-15).

    // 10. Send staff notification email (non-fatal)
    if (!resumedOrder) try {
      const siteUrlForEmail =
        process.env.NEXT_PUBLIC_SITE_URL ??
        "https://truecolorprinting.ca";
      await sendStaffOrderNotification({
        orderNumber: order.order_number,
        contact,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          qty: item.qty,
          width_in: item.width_in,
          height_in: item.height_in,
          sides: item.sides,
          design_status: item.design_status,
          line_total: item.line_total,
        })),
        subtotal: discountedSubtotal,
        gst,
        pst,
        total,
        discount_code: validatedDiscountCode ?? undefined,
        discount_amount: discount > 0 ? discount : undefined,
        is_rush,
        payment_method,
        notes: notes ?? null,
        filePaths: file_storage_paths ?? [],
        siteUrl: siteUrlForEmail,
      });
    } catch (staffEmailErr) {
      console.error("[orders] staff notification failed (non-fatal):", staffEmailErr);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl,
      waveInvoiceId,
    });
  } catch (err) {
    console.error("[orders]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
