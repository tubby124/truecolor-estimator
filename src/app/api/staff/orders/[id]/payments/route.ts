import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { summarizeOrderPayments } from "@/lib/payments/order-ledger";
import { buildStaffLedgerPayment, mapOrderPaymentRow } from "@/lib/payments/staff-payment-ledger";

interface Params {
  params: Promise<{ id: string }>;
}

const PAYMENT_SELECT = `
  id,
  order_id,
  amount,
  currency,
  method,
  status,
  payer_name,
  payer_company,
  payer_email,
  external_reference,
  wave_invoice_payment_id,
  wave_recorded_at,
  recorded_by,
  recorded_at,
  notes,
  metadata
`;

async function loadOrderAndPayments(supabase: ReturnType<typeof createServiceClient>, orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) return { order: null, paymentRows: [] as Record<string, unknown>[] };

  const { data: paymentRows, error: paymentError } = await supabase
    .from("order_payments")
    .select(PAYMENT_SELECT)
    .eq("order_id", orderId)
    .order("recorded_at", { ascending: true });

  if (paymentError) throw new Error(paymentError.message);

  return {
    order: order as { id: string; order_number: string; total: number | string; status: string },
    paymentRows: (paymentRows ?? []) as Record<string, unknown>[],
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const supabase = createServiceClient();
    const { order, paymentRows } = await loadOrderAndPayments(supabase, id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payments = paymentRows.map(mapOrderPaymentRow);
    const summary = summarizeOrderPayments(Number(order.total ?? 0), payments);

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: Number(order.total ?? 0),
      },
      payments,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load payment ledger";
    console.error("[staff/orders/payments:GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServiceClient();
    const { order, paymentRows } = await loadOrderAndPayments(supabase, id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const existingPayments = paymentRows.map(mapOrderPaymentRow);
    const built = buildStaffLedgerPayment({
      orderId: id,
      orderTotal: Number(order.total ?? 0),
      existingPayments,
      body,
      recordedBy: staffCheck.email,
    });

    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("order_payments")
      .insert(built.insert)
      .select(PAYMENT_SELECT)
      .single();

    if (insertError) {
      console.error("[staff/orders/payments:POST] insert", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.payment_ledger_recorded",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        amount: built.insert.amount,
        method: built.insert.method,
        payer_name: built.insert.payer_name,
        payer_company: built.insert.payer_company,
        payer_email: built.insert.payer_email,
        derived_status: built.nextSummary.status,
        balance_due: built.nextSummary.balanceDue,
      },
    });

    return NextResponse.json({
      ok: true,
      payment: inserted ? mapOrderPaymentRow(inserted as Record<string, unknown>) : null,
      summary: built.nextSummary,
      warning: built.warning,
      sideEffects: {
        orderStatusUpdated: false,
        waveRecorded: false,
        receiptSent: false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record payment ledger row";
    console.error("[staff/orders/payments:POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
