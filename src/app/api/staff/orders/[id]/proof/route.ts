/**
 * POST /api/staff/orders/[id]/proof
 *
 * Staff uploads one or more proof images/PDFs for a customer order.
 * - Accepts: multipart/form-data with `files` (multiple) or legacy `file` (single)
 * - Stores each file at proofs/{orderId}/proof_{timestamp}_{index}.{ext}
 * - Appends new paths to proof_storage_paths[] on the orders table
 * - Updates proof_storage_path (legacy, always = last uploaded path)
 * - Updates proof_sent_at
 * - Emails the customer with all newly uploaded proofs in a single email
 *
 * Returns: { ok: true, latestProofPath: string, allProofPaths: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendProofEmail } from "@/lib/email/proofSent";

const MAX_FILE_SIZE = 52_428_800; // 50 MB per file

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
    const message = (form.get("message") as string | null)?.trim() ?? undefined;

    // Accept either `files` (new multi-file) or legacy `file` (single)
    const filesRaw = form.getAll("files") as File[];
    const legacyFile = form.get("file") as File | null;
    const files: File[] = filesRaw.length > 0 ? filesRaw : legacyFile ? [legacyFile] : [];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      if (file.size === 0) {
        return NextResponse.json({ error: `File "${file.name}" is empty` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" too large — max 50 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
          { status: 400 }
        );
      }
      const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
      const isAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
      if (!isAllowedMime && !isAllowedExt) {
        return NextResponse.json(
          { error: `File "${file.name}" type not allowed — use JPG, PNG, WebP, or PDF` },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();

    // ── 2. Verify order exists and get customer info ───────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        `
        order_number,
        proof_storage_paths,
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

    // ── 3. Upload each proof to Supabase Storage ───────────────────────────────
    const timestamp = Date.now();
    const newPaths: string[] = [];
    const newProofMeta: Array<{ path: string; isImage: boolean }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      // Use timestamp + index to guarantee unique paths even in rapid succession
      const proofPath = `proofs/${orderId}/proof_${timestamp}_${i}.${ext}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadErr } = await supabase.storage
        .from("print-files")
        .upload(proofPath, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadErr) {
        console.error("[staff/proof] Supabase storage error:", uploadErr.message);
        return NextResponse.json({ error: `Upload failed for "${file.name}": ${uploadErr.message}` }, { status: 500 });
      }

      newPaths.push(proofPath);
      newProofMeta.push({ path: proofPath, isImage: /\.(jpg|jpeg|png|webp)$/i.test(file.name) });
    }

    const latestProofPath = newPaths[newPaths.length - 1];

    // ── 4. Append new paths to proof_storage_paths array + update legacy field ─
    const existingPaths = (order.proof_storage_paths as string[] | null) ?? [];
    const allProofPaths = [...existingPaths, ...newPaths];

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        proof_storage_paths: allProofPaths,
        proof_storage_path: latestProofPath, // legacy backwards-compat field
        proof_sent_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", orderId);

    if (updateErr) {
      console.error("[staff/proof] DB update error:", updateErr.message);
    }

    // ── 5. Generate signed URLs for each new proof ────────────────────────────
    const proofUrls: string[] = [];
    const proofIsImages: boolean[] = [];

    for (const meta of newProofMeta) {
      let proofUrl = `${SUPABASE_STORAGE_PUBLIC}/${meta.path}`;
      try {
        const { data: signed } = await supabase.storage
          .from("print-files")
          .createSignedUrl(meta.path, 60 * 60 * 24 * 7); // 7 days
        if (signed?.signedUrl) proofUrl = signed.signedUrl;
      } catch (signErr) {
        console.warn("[staff/proof] signed URL failed (using public URL):", signErr);
      }
      proofUrls.push(proofUrl);
      proofIsImages.push(meta.isImage);
    }

    // ── 6. Send proof email to customer with all new proofs (non-fatal) ────────
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
        proofUrls,
        proofIsImages,
        message,
        items,
      });
    } catch (emailErr) {
      console.error("[staff/proof] email send failed (non-fatal):", emailErr);
    }

    console.log(
      `[staff/proof] uploaded ${newPaths.length} proof(s) → order ${order.order_number} | total: ${allProofPaths.length}`
    );

    return NextResponse.json({ ok: true, latestProofPath, allProofPaths });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Proof upload failed";
    console.error("[staff/proof]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
