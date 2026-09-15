/**
 * Staff access to the official Wave paid invoice.
 *
 * GET returns the provider's paid customer document for opening/printing.
 * POST asks Wave to email that document, with Wave's own PDF attachment.
 * Neither path substitutes the branded True Color receipt for a provider
 * document, and both fail closed unless Wave confirms the invoice is paid.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { getWavePaidInvoiceDocument, sendWaveInvoice } from "@/lib/wave/invoice";

interface Params {
  params: Promise<{ id: string }>;
}

const PAID_STATUSES = new Set([
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
]);

async function loadPaidWaveOrder(orderId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, wave_invoice_id, customers ( name, email )")
    .eq("id", orderId)
    .single();
  if (error || !data) throw new Error("ORDER_NOT_FOUND");
  if (!PAID_STATUSES.has(data.status ?? "") || !data.wave_invoice_id) {
    throw new Error("WAVE_DOCUMENT_NOT_READY");
  }
  const customerRaw = Array.isArray(data.customers) ? data.customers[0] : data.customers;
  const customer = customerRaw as { name: string | null; email: string | null } | null;
  if (!customer?.email?.trim()) throw new Error("CUSTOMER_EMAIL_MISSING");
  const document = await getWavePaidInvoiceDocument(data.wave_invoice_id);
  return { order: data, customer, document };
}

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (code === "CUSTOMER_EMAIL_MISSING") return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });
  if (code === "WAVE_DOCUMENT_NOT_READY") return NextResponse.json({ error: "A Wave paid invoice is not available for this order" }, { status: 409 });
  return NextResponse.json({ error: "Wave could not confirm the paid invoice. No document was opened or emailed." }, { status: 503 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;
  try {
    const { id } = await params;
    const { order, document } = await loadPaidWaveOrder(id);
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.wave_document_opened",
      entity_type: "order",
      entity_id: id,
      detail: { order_number: order.order_number, wave_invoice_number: document.invoiceNumber },
    });
    return NextResponse.json({ ok: true, documentUrl: document.viewUrl, invoiceNumber: document.invoiceNumber });
  } catch (error) {
    console.error("[staff/orders/wave-document] open failed:", error instanceof Error ? error.message : error);
    return errorResponse(error);
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;
  try {
    const { id } = await params;
    const { order, customer, document } = await loadPaidWaveOrder(id);
    await sendWaveInvoice(order.wave_invoice_id!, customer.email!, {
      subject: `Paid invoice — Order ${order.order_number}`,
      message: "Your paid Wave invoice is attached for your records. Questions about your print order? Reply to this email or call (306) 954-8688.",
    });
    await recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.notification_outcome",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        status: "wave_paid_invoice",
        outcome: "accepted",
        channel: "wave",
        wave_invoice_number: document.invoiceNumber,
      },
    });
    return NextResponse.json({ ok: true, accepted: true, email: customer.email, invoiceNumber: document.invoiceNumber });
  } catch (error) {
    console.error("[staff/orders/wave-document] email failed:", error instanceof Error ? error.message : error);
    return errorResponse(error);
  }
}
