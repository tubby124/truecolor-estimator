import type { SupabaseClient } from "@supabase/supabase-js";
import {
  approveWaveInvoice,
  createOrFindWaveCustomer,
  createWaveInvoice,
  type WaveLineItem,
} from "@/lib/wave/invoice";

type WaveAction = "create" | "ready" | "wait";

interface WaveReservation {
  action: WaveAction;
  reservationId: string | null;
  invoiceId: string | null;
}

interface StoredOrderItem {
  product_name: unknown;
  qty: unknown;
  unit_price: unknown;
  line_total: unknown;
  category: unknown;
  line_items_json: unknown;
}

interface StoredOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  waveItems: WaveLineItem[];
  isRush: boolean;
}

export interface QuoteWaveProvisioningResult {
  action: "ready" | "wait";
  invoiceId: string | null;
}

export interface OrderWaveInvoicePlan {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  waveItems: WaveLineItem[];
  isRush?: boolean;
}

export class QuoteWaveProvisioningError extends Error {
  constructor(
    message: string,
    readonly ambiguous: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "QuoteWaveProvisioningError";
  }
}

function rpcMessage(error: { message?: string } | null, fallback: string): string {
  return error?.message?.trim() || fallback;
}

function firstRow(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? row as Record<string, unknown> : null;
}

export async function reserveOrderWaveProvisioning(
  supabase: SupabaseClient,
  orderId: string,
): Promise<WaveReservation> {
  const { data, error } = await supabase.rpc("reserve_quote_wave_provisioning", {
    p_order_id: orderId,
  });
  if (error) throw new Error(rpcMessage(error, "Wave provisioning could not be reserved"));
  const row = firstRow(data);
  if (!row || !["create", "ready", "wait"].includes(String(row.wave_action))) {
    throw new Error("Wave provisioning reservation returned an invalid result");
  }
  return {
    action: row.wave_action as WaveAction,
    reservationId: typeof row.wave_reservation_id === "string" ? row.wave_reservation_id : null,
    invoiceId: typeof row.linked_wave_invoice_id === "string" ? row.linked_wave_invoice_id : null,
  };
}

export const reserveQuoteWaveProvisioning = reserveOrderWaveProvisioning;

async function completeQuoteWaveProvisioning(
  supabase: SupabaseClient,
  input: { orderId: string; reservationId: string; invoiceId: string; invoiceNumber: string },
): Promise<void> {
  const { data, error } = await supabase.rpc("complete_quote_wave_provisioning", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_wave_invoice_id: input.invoiceId,
    p_wave_invoice_number: input.invoiceNumber,
  });
  if (error || data !== true) {
    throw new Error(error?.message || "Wave invoice linkage could not be finalized");
  }
}

async function failQuoteWaveProvisioning(
  supabase: SupabaseClient,
  input: { orderId: string; reservationId: string; ambiguous: boolean; error: string },
): Promise<void> {
  const { data, error } = await supabase.rpc("fail_quote_wave_provisioning", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_ambiguous: input.ambiguous,
    p_error: input.error,
  });
  if (error || data !== true) {
    throw new Error(error?.message || "Wave provisioning failure could not be recorded");
  }
}

function taxClassFromJson(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = taxClassFromJson(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const taxClass = (value as Record<string, unknown>).taxClass;
  return typeof taxClass === "string" ? taxClass : null;
}

export function storedOrderItemToWaveLine(item: StoredOrderItem): WaveLineItem {
  const description = typeof item.product_name === "string" ? item.product_name.trim() : "";
  const qty = Number(item.qty);
  const unitPrice = Number(item.unit_price);
  const lineTotal = Number(item.line_total);
  if (
    !description || !Number.isSafeInteger(qty) || qty <= 0 ||
    !Number.isFinite(unitPrice) || unitPrice < 0 ||
    !Number.isFinite(lineTotal) || Math.abs(lineTotal - qty * unitPrice) > 0.011
  ) {
    throw new Error("Stored order contains an invalid line item");
  }

  const taxClass = taxClassFromJson(item.line_items_json);
  const structuredTaxClasses = new Set([
    "printed_good",
    "design_service",
    "rush_service",
    "installation_service",
  ]);
  const applyPst = taxClass && structuredTaxClasses.has(taxClass)
    ? true
    : String(item.category ?? "").toUpperCase() !== "SERVICE";

  return { description, qty, unitPrice, applyGst: true, applyPst };
}

function normalizeRelation(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : null;
}

async function loadStoredOrder(supabase: SupabaseClient, orderId: string): Promise<StoredOrder> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, subtotal, quote_request_id, is_rush, discount_code, discount_amount,
      customers ( name, email ),
      order_items ( product_name, qty, unit_price, line_total, category, line_items_json )
    `)
    .eq("id", orderId)
    .single();
  if (error || !data) throw new Error(error?.message || "Stored order is unavailable");

  const row = data as Record<string, unknown>;
  const customer = normalizeRelation(row.customers);
  const items = Array.isArray(row.order_items) ? row.order_items as StoredOrderItem[] : [];
  const customerEmail = typeof customer?.email === "string" ? customer.email.trim().toLowerCase() : "";
  const customerName = typeof customer?.name === "string" ? customer.name.trim() : "";
  const orderNumber = typeof row.order_number === "string" ? row.order_number.trim() : "";
  if (typeof row.id !== "string" || !customerEmail || !customerName || !orderNumber || items.length === 0) {
    throw new Error("Stored order is incomplete");
  }

  const waveItems = items.map(storedOrderItemToWaveLine);
  const storedSubtotalCents = Math.round(Number(row.subtotal) * 100);
  const discountCents = Math.round(Number(row.discount_amount ?? 0) * 100);
  const itemSubtotalBeforeDiscountCents = waveItems.reduce(
    (sum, item) => sum + Math.round(item.qty * item.unitPrice * 100),
    0,
  );
  if (
    !Number.isSafeInteger(storedSubtotalCents) || storedSubtotalCents < 0 ||
    !Number.isSafeInteger(discountCents) || discountCents < 0 ||
    itemSubtotalBeforeDiscountCents - discountCents !== storedSubtotalCents
  ) {
    throw new Error("Stored order items do not reconcile to the subtotal");
  }

  if (discountCents > 0) {
    const discountCode = typeof row.discount_code === "string" ? row.discount_code.trim() : "";
    waveItems.push({
      description: `Discount${discountCode ? ` (${discountCode})` : ""}`,
      qty: 1,
      unitPrice: -(discountCents / 100),
      applyGst: true,
      applyPst: true,
    });
  }

  return {
    id: row.id,
    orderNumber,
    customerEmail,
    customerName,
    waveItems,
    // Structured quote orders persist rush as an order item. Catalog orders
    // use Wave's explicit rush option because their order_items exclude it.
    isRush: row.quote_request_id == null && row.is_rush === true,
  };
}

function validatePlan(plan: OrderWaveInvoicePlan): OrderWaveInvoicePlan {
  if (
    !plan.orderNumber.trim() || !plan.customerEmail.trim() || !plan.customerName.trim() ||
    plan.waveItems.length === 0
  ) {
    throw new Error("Wave invoice plan is incomplete");
  }
  for (const item of plan.waveItems) {
    if (
      !item.description.trim() || !Number.isSafeInteger(item.qty) || item.qty <= 0 ||
      !Number.isFinite(item.unitPrice)
    ) {
      throw new Error("Wave invoice plan contains an invalid line item");
    }
  }
  return plan;
}

export async function provisionOrderWaveInvoice(
  supabase: SupabaseClient,
  orderId: string,
  suppliedPlan?: OrderWaveInvoicePlan,
): Promise<QuoteWaveProvisioningResult> {
  const reservation = await reserveOrderWaveProvisioning(supabase, orderId);
  if (reservation.action === "ready") {
    if (!reservation.invoiceId) throw new Error("Ready Wave provisioning has no linked invoice");
    return { action: "ready", invoiceId: reservation.invoiceId };
  }
  if (reservation.action === "wait") return { action: "wait", invoiceId: null };
  if (!reservation.reservationId) throw new Error("Wave provisioning reservation has no owner token");

  let externalCallStarted = false;
  try {
    const order = suppliedPlan
      ? { id: orderId, ...validatePlan(suppliedPlan), isRush: suppliedPlan.isRush === true }
      : await loadStoredOrder(supabase, orderId);
    externalCallStarted = true;
    const customerId = await createOrFindWaveCustomer(order.customerEmail, order.customerName);
    const invoice = await createWaveInvoice(customerId, order.waveItems, {
      orderNumber: order.orderNumber,
      isRush: order.isRush,
    });
    await approveWaveInvoice(invoice.invoiceId);
    await completeQuoteWaveProvisioning(supabase, {
      orderId,
      reservationId: reservation.reservationId,
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
    });
    return { action: "ready", invoiceId: invoice.invoiceId };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Wave provisioning failed";
    const ambiguous = externalCallStarted;
    try {
      await failQuoteWaveProvisioning(supabase, {
        orderId,
        reservationId: reservation.reservationId,
        ambiguous,
        error: message,
      });
    } catch (failureWriteError) {
      throw new QuoteWaveProvisioningError(
        `Wave provisioning failed and its reservation could not be finalized: ${failureWriteError instanceof Error ? failureWriteError.message : "unknown error"}`,
        true,
        { cause },
      );
    }
    throw new QuoteWaveProvisioningError(message, ambiguous, { cause });
  }
}

export async function provisionQuoteWaveInvoice(
  supabase: SupabaseClient,
  orderId: string,
): Promise<QuoteWaveProvisioningResult> {
  return provisionOrderWaveInvoice(supabase, orderId);
}
