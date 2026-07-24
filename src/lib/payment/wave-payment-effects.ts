import { sendMeasurementProtocolEvent, deriveClientIdFromCustomer } from "@/lib/analytics/measurementProtocol";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { createServiceClient } from "@/lib/supabase/server";

export type WavePaymentEffectType =
  | "receipt"
  | "ga4_purchase"
  | "brevo_payment_date";

export interface WavePaymentEffectJob {
  id: string;
  order_id: string;
  effect_type: WavePaymentEffectType;
  attempt_count: number;
}

export interface WavePaymentOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  subtotal: number | string;
  gst: number | string;
  pst: number | string | null;
  total: number | string;
  is_rush: boolean | null;
  discount_code: string | null;
  discount_amount: number | string | null;
  created_at: string;
  paid_at: string;
  receipt_token: string | null;
  customers:
    | {
        email: string | null;
        name: string | null;
        company: string | null;
      }
    | Array<{
        email: string | null;
        name: string | null;
        company: string | null;
      }>
    | null;
  order_items: Array<{
    product_name: string;
    qty: number | string;
    width_in: number | string | null;
    height_in: number | string | null;
    sides: number | string;
    line_total: number | string;
  }>;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

export interface WavePaymentEffectRun {
  claimed: number;
  sent: number;
  retried: number;
  dead: number;
}

const MAX_ATTEMPTS = 8;

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown Wave payment effect error";
  return message
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500) || "Unknown Wave payment effect error";
}

function singleCustomer(order: WavePaymentOrder) {
  return Array.isArray(order.customers) ? order.customers[0] ?? null : order.customers;
}

async function loadOrder(
  supabase: ServiceClient,
  orderId: string,
): Promise<WavePaymentOrder> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_id,
      subtotal, gst, pst, total, is_rush,
      discount_code, discount_amount,
      created_at, paid_at, receipt_token,
      customers ( email, name, company ),
      order_items ( product_name, qty, width_in, height_in, sides, line_total )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new Error("Wave payment effect order could not be loaded");
  }
  return data as WavePaymentOrder;
}

export async function performWavePaymentEffect(
  job: WavePaymentEffectJob,
  order: WavePaymentOrder,
): Promise<void> {
  const customer = singleCustomer(order);
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  if (job.effect_type === "receipt") {
    if (!customer?.email) throw new Error("Wave receipt customer email is missing");
    await sendPaymentReceipt({
      orderNumber: order.order_number,
      customerName: customer.name ?? customer.company ?? "Customer",
      customerEmail: customer.email,
      createdAt: order.created_at,
      items: items.map((item) => ({
        product_name: item.product_name,
        qty: Number(item.qty),
        width_in: item.width_in === null ? null : Number(item.width_in),
        height_in: item.height_in === null ? null : Number(item.height_in),
        sides: Number(item.sides),
        line_total: Number(item.line_total),
      })),
      subtotal: Number(order.subtotal),
      gst: Number(order.gst),
      pst: Number(order.pst ?? 0),
      total: Number(order.total),
      isRush: Boolean(order.is_rush),
      discountCode: order.discount_code,
      discountAmount:
        order.discount_amount === null ? null : Number(order.discount_amount),
      paymentMethod: "wave",
      oid: order.id,
      receiptToken: order.receipt_token,
      idempotencyKey: `wave-receipt/${order.id}`,
    });
    return;
  }

  if (job.effect_type === "ga4_purchase") {
    const delivered = await sendMeasurementProtocolEvent({
      event_name: "purchase",
      client_id: deriveClientIdFromCustomer(order.customer_id ?? order.id),
      user_id: order.customer_id ?? undefined,
      params: {
        transaction_id: order.order_number,
        value: Number(order.total),
        currency: "CAD",
        tax: Number(order.gst ?? 0) + Number(order.pst ?? 0),
        payment_type: "wave",
        items: items.map((item) => ({
          item_id: (item.product_name ?? "").slice(0, 100),
          item_name: item.product_name ?? "Unknown",
          price:
            Number(item.qty) > 0
              ? Number(item.line_total) / Number(item.qty)
              : Number(item.line_total),
          quantity: Number(item.qty ?? 1),
        })),
      },
    });
    if (!delivered) throw new Error("GA4 Measurement Protocol did not accept Wave purchase");
    return;
  }

  if (!customer?.email) throw new Error("Wave Brevo customer email is missing");
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not configured");
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: customer.email,
      attributes: { LAST_PAYMENT_DATE: order.paid_at.slice(0, 10) },
      updateEnabled: true,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Brevo contact update failed with HTTP ${response.status}`);
  }
}

export async function processWavePaymentEffects(options: {
  supabase?: ServiceClient;
  orderId?: string | null;
  maxJobs?: number;
} = {}): Promise<WavePaymentEffectRun> {
  const supabase = options.supabase ?? createServiceClient();
  const maxJobs = Math.min(Math.max(options.maxJobs ?? 3, 1), 10);
  const result: WavePaymentEffectRun = {
    claimed: 0,
    sent: 0,
    retried: 0,
    dead: 0,
  };

  for (let index = 0; index < maxJobs; index += 1) {
    const { data, error } = await supabase.rpc("claim_wave_payment_effects", {
      p_limit: 1,
      p_order_id: options.orderId ?? null,
    });
    if (error) throw new Error("Wave payment effect claim failed");

    const job = (Array.isArray(data) ? data[0] : data) as
      | WavePaymentEffectJob
      | null;
    if (!job?.id) break;
    result.claimed += 1;

    try {
      const order = await loadOrder(supabase, job.order_id);
      await performWavePaymentEffect(job, order);
    } catch (effectError) {
      const { data: retryStatus, error: retryError } = await supabase.rpc(
        "retry_wave_payment_effect",
        {
          p_effect_id: job.id,
          p_error: safeError(effectError),
          p_max_attempts: MAX_ATTEMPTS,
        },
      );
      if (retryError) throw new Error("Wave payment effect retry acknowledgement failed");
      if (retryStatus === "dead") result.dead += 1;
      else result.retried += 1;
      continue;
    }

    const { data: completed, error: completionError } = await supabase.rpc(
      "complete_wave_payment_effect",
      { p_effect_id: job.id },
    );
    if (completionError || completed !== true) {
      throw new Error("Wave payment effect completion acknowledgement failed");
    }
    result.sent += 1;
  }

  return result;
}
