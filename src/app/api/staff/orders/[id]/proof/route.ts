/**
 * POST /api/staff/orders/[id]/proof
 *
 * Staff uploads a proof image or PDF for a customer order.
 * - Stores file at proofs/{orderId}/proof.{ext} in the "print-files" bucket (upsert)
 * - Saves proof_storage_path + proof_sent_at to the orders table
 * - Emails the customer with the proof (non-fatal if email fails)
 *
 * Accepts: multipart/form-data
 *   file    (required) — image (jpg/jpeg/png/webp) or PDF
 *   message (optional) — staff note to include in the email
 *
 * Returns: { ok: true, proofPath: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendProofEmail } from "@/lib/email/proofSent";

const MAX_FILE_SIZE = 52_428_800; // 50 MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|pdf)$/i;

const SUPABASE_STORAGE_PUBLIC = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"
}/storage/v1/object/public/print-files`;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id: orderId } = await params;

    // ── 1. Parse multipart form ────────────────────────────────────────────────
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const message = (form.get("message") as string | null)?.trim() ?? undefined;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large — max 50 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 }
      );
    }

    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        { error: "File type not allowed — use JPG, PNG, WebP, or PDF" },
        { status: 400 }
      );
    }

    const proofIsImage = /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

    const supabase = createServiceClient();

    // ── 2. Verify order exists and get customer info ───────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        `
        order_number,
        customers ( name, email ),
        order_items (
          product_name,
          qty,
          width_in,
          height_in,
          sides,
          material_code,
          line_total
        )
        `
      )
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerRaw = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!customer?.email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
    }

    // ── 3. Upload proof to Supabase Storage ───────────────────────────────────
    const proofPath = `proofs/${orderId}/proof.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("print-files")
      .upload(proofPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: true, // allow staff to re-upload a revised proof
      });

    if (uploadErr) {
      console.error("[staff/proof] Supabase storage error:", uploadErr.message);
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
    }

    // ── 4. Update order with proof path + timestamp ───────────────────────────
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        proof_storage_path: proofPath,
        proof_sent_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", orderId);

    if (updateErr) {
      console.error("[staff/proof] DB update error:", updateErr.message);
      // Non-fatal for the response — file was uploaded, DB update failed
      // Continue to send email anyway
    }

    // ── 5. Generate proof URL for email ───────────────────────────────────────
    // Try 7-day signed URL first; fall back to public URL
    let proofUrl = `${SUPABASE_STORAGE_PUBLIC}/${proofPath}`;
    try {
      const { data: signed } = await supabase.storage
        .from("print-files")
        .createSignedUrl(proofPath, 60 * 60 * 24 * 7); // 7 days
      if (signed?.signedUrl) {
        proofUrl = signed.signedUrl;
      }
    } catch (signErr) {
      console.warn("[staff/proof] signed URL failed (using public URL):", signErr);
    }

    // ── 6. Send proof email to customer (non-fatal) ───────────────────────────
    try {
      const items = (Array.isArray(order.order_items) ? order.order_items : []) as Array<{
        product_name: string;
        qty: number;
        width_in: number | null;
        height_in: number | null;
        sides: number;
        material_code: string | null;
        line_total: number;
      }>;

      await sendProofEmail({
        orderNumber: order.order_number,
        customerName: customer.name,
        customerEmail: customer.email,
        proofUrl,
        proofIsImage,
        message,
        items,
      });
    } catch (emailErr) {
      // Non-fatal — proof is uploaded and saved, email failure shouldn't block staff
      console.error("[staff/proof] email send failed (non-fatal):", emailErr);
    }

    console.log(`[staff/proof] uploaded → ${proofPath} | order ${order.order_number}`);

    return NextResponse.json({ ok: true, proofPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Proof upload failed";
    console.error("[staff/proof]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
