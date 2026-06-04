import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { approveWaveInvoice, recordWavePayment } from "@/lib/wave/invoice";
import { mapOrderPaymentRow } from "@/lib/payments/staff-payment-ledger";
import { buildWaveLedgerPaymentPlan } from "@/lib/payments/wave-ledger-payment";

interface Params {
  params: Promise<{ id: string; paymentId: string }>;
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

export async function POST(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id, paymentId } = await params;
    const supabase = createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, status, wave_invoice_id, wave_invoice_approved_at")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      console.error("[staff/orders/payments/record-wave] order", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: paymentRow, error: paymentError } = await supabase
      .from("order_payments")
      .select(PAYMENT_SELECT)
      .eq("id", paymentId)
      .eq("order_id", id)
      .maybeSingle();

    if (paymentError) {
      console.error("[staff/orders/payments/record-wave] payment", paymentError);
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }
    if (!paymentRow) {
      return NextResponse.json({ error: "Payment row not found" }, { status: 404 });
    }

    const payment = mapOrderPaymentRow(paymentRow as Record<string, unknown>);
    const plan = buildWaveLedgerPaymentPlan({
      orderId: id,
      orderNumber: String((order as { order_number?: string }).order_number ?? id),
      waveInvoiceId: (order as { wave_invoice_id?: string | null }).wave_invoice_id,
      waveInvoiceApprovedAt: (order as { wave_invoice_approved_at?: string | null }).wave_invoice_approved_at,
      payment,
    });

    if (!plan.ok) {
      return NextResponse.json({ error: plan.error }, { status: 400 });
    }

    let approvedAt: string | null = (order as { wave_invoice_approved_at?: string | null }).wave_invoice_approved_at ?? null;
    if (plan.approveInvoiceFirst) {
      await approveWaveInvoice(plan.recordPayment.invoiceId);
      approvedAt = new Date().toISOString();
      const { error: approveSaveError } = await supabase
        .from("orders")
        .update({ wave_invoice_approved_at: approvedAt })
        .eq("id", id);
      if (approveSaveError) {
        console.error("[staff/orders/payments/record-wave] approve save", approveSaveError);
        return NextResponse.json({ error: approveSaveError.message }, { status: 500 });
      }
    }

    const wavePaymentId = await recordWavePayment(
      plan.recordPayment.invoiceId,
      plan.recordPayment.amount,
      plan.recordPayment.method,
      plan.recordPayment.note,
      undefined,
      plan.recordPayment.externalId,
    );

    const recordedAt = new Date().toISOString();
    const { data: updatedPayment, error: updateError } = await supabase
      .from("order_payments")
      .update({
        wave_invoice_payment_id: wavePaymentId,
        wave_recorded_at: recordedAt,
      })
      .eq("id", paymentId)
      .eq("order_id", id)
      .select(PAYMENT_SELECT)
      .single();

    if (updateError) {
      console.error("[staff/orders/payments/record-wave] update", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.payment_wave_recorded",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: (order as { order_number?: string }).order_number ?? null,
        payment_id: paymentId,
        amount: plan.recordPayment.amount,
        method: plan.recordPayment.method,
        wave_invoice_id: plan.recordPayment.invoiceId,
        wave_invoice_payment_id: wavePaymentId,
        approved_invoice_first: plan.approveInvoiceFirst,
      },
    });

    return NextResponse.json({
      ok: true,
      payment: updatedPayment ? mapOrderPaymentRow(updatedPayment as Record<string, unknown>) : null,
      wave: {
        invoiceId: plan.recordPayment.invoiceId,
        invoiceApprovedAt: approvedAt,
        invoicePaymentId: wavePaymentId,
        recordedAt,
      },
      sideEffects: {
        waveRecorded: true,
        orderStatusUpdated: false,
        receiptSent: false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record ledger payment in Wave";
    console.error("[staff/orders/payments/record-wave]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
