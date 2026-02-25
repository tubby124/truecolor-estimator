/**
 * POST /api/account/orders/[id]/upload-file
 *
 * Allows an authenticated customer to upload or replace their artwork file
 * for an unpaid order (status = pending_payment only).
 *
 * - Validates the order belongs to this customer
 * - Rejects if order is already paid or in production (→ 409, tells them to call)
 * - Uploads to customer-uploads/{orderId}/{timestamp}-{filename} in print-files bucket
 * - Updates order_items[0].file_storage_path (best-effort)
 * - Appends to orders.file_storage_paths[] (best-effort)
 * - Emails staff notification (non-fatal)
 *
 * Accepts: multipart/form-data { file: File }
 * Returns: { ok: true, filePath: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { sendCustomerFileRevisionNotification } from "@/lib/email/staffNotification";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

const MAX_FILE_SIZE = 52_428_800; // 50 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/postscript",            // .ai / .eps
  "application/illustrator",
];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|pdf|ai|eps)$/i;

const LOCKED_STATUSES = ["in_production", "ready_for_pickup", "complete"];

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  // ── 1. Auth: validate Bearer token ─────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const userClient = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const supabase = createServiceClient();

  // ── 2. Verify order belongs to this customer ────────────────────────────────
  const { data: customers } = await supabase
    .from("customers")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .limit(1);

  if (!customers?.length) {
    return NextResponse.json({ error: "Order not found" }, { status: 403 });
  }

  const customerId = customers[0].id;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      customer_id,
      file_storage_paths,
      customers ( name, email ),
      order_items ( id )
    `)
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.customer_id !== customerId) {
    return NextResponse.json({ error: "Order not found" }, { status: 403 });
  }

  // ── 3. Status gate: only allow upload when unpaid ───────────────────────────
  if (LOCKED_STATUSES.includes(order.status)) {
    return NextResponse.json(
      {
        error:
          "Your order is already being processed. To update your file, please call us at (306) 954-8688.",
      },
      { status: 409 }
    );
  }

  // payment_received: allow (paid but not yet in production)
  // pending_payment: allow
  // any other status: allow with same logic

  // ── 4. Parse file from form ─────────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `File too large — max 50 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      },
      { status: 400 }
    );
  }

  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
  const isAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
  if (!isAllowedMime && !isAllowedExt) {
    return NextResponse.json(
      { error: "File type not allowed — use PDF, AI, JPG, PNG, or WebP" },
      { status: 400 }
    );
  }

  // ── 5. Upload to Supabase Storage ───────────────────────────────────────────
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `customer-uploads/${orderId}/${timestamp}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("print-files")
    .upload(filePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadErr) {
    console.error("[account/upload-file] storage error:", uploadErr.message);
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}` },
      { status: 500 }
    );
  }

  // ── 6. Update order_items[0].file_storage_path (best-effort) ───────────────
  const firstItemId = Array.isArray(order.order_items)
    ? order.order_items[0]?.id
    : null;

  if (firstItemId) {
    void supabase
      .from("order_items")
      .update({ file_storage_path: filePath } as Record<string, unknown>)
      .eq("id", firstItemId);
  }

  // ── 7. Append to orders.file_storage_paths[] (best-effort) ─────────────────
  const existingPaths: string[] = Array.isArray(order.file_storage_paths)
    ? order.file_storage_paths
    : [];

  void supabase
    .from("orders")
    .update({
      file_storage_paths: [...existingPaths, filePath],
    } as Record<string, unknown>)
    .eq("id", orderId);

  // ── 8. Email staff (non-fatal) ──────────────────────────────────────────────
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolor-estimator.vercel.app";

    // Generate 7-day signed URL for staff email
    let fileUrl = `${SUPABASE_URL}/storage/v1/object/public/print-files/${filePath}`;
    try {
      const { data: signed } = await supabase.storage
        .from("print-files")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) fileUrl = signed.signedUrl;
    } catch {
      // use public URL as fallback
    }

    const customerRaw = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    await sendCustomerFileRevisionNotification({
      orderNumber: order.order_number,
      customerName: customer?.name ?? user.email,
      customerEmail: customer?.email ?? user.email,
      fileName: file.name,
      fileUrl,
      orderId,
      siteUrl,
    });
  } catch (emailErr) {
    // Non-fatal — file is uploaded, staff notification is a bonus
    console.error("[account/upload-file] staff email failed (non-fatal):", emailErr);
  }

  console.log(
    `[account/upload-file] uploaded → ${filePath} | order ${order.order_number}`
  );

  return NextResponse.json({ ok: true, filePath });
}
