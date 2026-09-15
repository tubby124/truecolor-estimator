import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { buildPaymentRequestEmail, type PaymentRequestItem } from "@/lib/email/paymentRequest";
import { getCanonicalTaxRates } from "@/lib/pricing/canonical-rates";
import { scaleManualPricing } from "@/lib/payment/manual-pricing";
import { parsePstExemption } from "@/lib/payment/pst-exemption";
import type { OrderItemInput } from "../route";

/**
 * Render-only staff preview. It deliberately does not allocate an order,
 * payment token, Wave invoice, account, audit event, or outbound email.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json() as {
      contact?: { name?: string; email?: string; company?: string };
      items?: OrderItemInput[];
      overrideTotal?: number;
      pstExemption?: unknown;
      notes?: string;
      customMessage?: string;
    };
    if (!body.contact?.name?.trim() || !body.contact.email?.trim()) {
      return NextResponse.json({ error: "Customer name and email are required for a preview." }, { status: 400 });
    }
    if (!body.items?.length || body.items.some((item) => !item.product?.trim() || !Number.isFinite(item.amount) || item.amount <= 0 || !Number.isSafeInteger(item.qty) || item.qty <= 0)) {
      return NextResponse.json({ error: "Add a valid product, quantity, and amount before previewing." }, { status: 400 });
    }
    const pstExemption = parsePstExemption(body.pstExemption);
    const normalized = body.items.map((item) => ({
      ...item,
      kind: item.kind ?? "product" as const,
      taxClass: item.taxClass ?? "printed_good" as const,
      proofUrl: item.proofPath?.trim()
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"}/storage/v1/object/public/print-files/${item.proofPath.replace(/^\/+/, "")}`
        : undefined,
    }));
    const scaled = scaleManualPricing(normalized, getCanonicalTaxRates(), body.overrideTotal, pstExemption.enabled);
    const rendered = buildPaymentRequestEmail({
      orderNumber: "Preview only",
      contact: { name: body.contact.name.trim(), email: body.contact.email.trim(), company: body.contact.company?.trim() || null },
      items: scaled.items.map((item): PaymentRequestItem => ({
        kind: item.kind,
        product: item.title?.trim() || item.product,
        qty: item.qty,
        details: item.details,
        material: item.material,
        sides: item.sides,
        size: item.size,
        process: item.process,
        unitPrice: item.unitPrice,
        amount: item.amount,
        proofUrl: item.proofUrl,
      })),
      subtotal: scaled.breakdown.subtotalCents / 100,
      gst: scaled.breakdown.gstCents / 100,
      pst: scaled.breakdown.pstCents / 100,
      total: scaled.breakdown.totalCents / 100,
      paymentUrl: "#preview-payment-link",
      paymentMethod: "wave",
      quoteOnly: true,
      notes: body.notes?.trim() || null,
      customMessage: body.customMessage?.trim() || undefined,
    });
    return NextResponse.json({ ...rendered, totalCents: scaled.breakdown.totalCents });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not render email preview." }, { status: 400 });
  }
}
