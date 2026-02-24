/**
 * POST /api/quote-request
 * Sends a quote request email to info@true-color.ca
 * and a confirmation to the customer.
 *
 * Accepts: multipart/form-data (switched from JSON to avoid 4.5 MB Vercel body limit
 * that was triggered when files were base64-encoded in JSON).
 */
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const name = ((form.get("name") as string) ?? "").trim();
    const email = ((form.get("email") as string) ?? "").trim();
    const phone = ((form.get("phone") as string) ?? "").trim() || undefined;
    const product = ((form.get("product") as string) ?? "").trim() || undefined;
    const description = ((form.get("description") as string) ?? "").trim();
    const isCustom = form.get("isCustom") === "true";
    const file = form.get("file") as File | null;

    if (!name || !email || !description) {
      return NextResponse.json({ error: "Name, email, and description are required" }, { status: 400 });
    }

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large — max 4 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = isCustom
      ? `Custom Quote Request — ${name}`
      : `Quote Request — ${product ?? "General"} — ${name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1c1712; padding: 20px 30px;">
          <h1 style="color: #16C2F3; font-size: 20px; margin: 0;">New ${isCustom ? "Custom " : ""}Quote Request</h1>
        </div>
        <div style="padding: 24px 30px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #1c1712; width: 120px;">From</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #1c1712;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #16C2F3;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #1c1712;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ""}
            ${product ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #1c1712;">Product</td><td style="padding: 8px 0;">${product}</td></tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f4efe9; border-radius: 8px;">
            <p style="font-weight: bold; color: #1c1712; margin: 0 0 8px;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap; color: #333;">${description}</p>
          </div>
          ${file ? `<p style="margin-top: 12px; font-size: 14px; color: #666;">FILE_PLACEHOLDER</p>` : ""}
        </div>
        <div style="background: #f4efe9; padding: 16px 30px; font-size: 12px; color: #888;">
          Reply directly to this email to respond to ${name}.
        </div>
      </div>
    `;

    // Upload artwork file to Supabase Storage (non-fatal)
    let fileSection = file ? `File: <strong>${file.name}</strong>` : "";
    if (file && file.size > 0) {
      try {
        const supabase = createServiceClient();
        const uuid = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `quote-requests/${uuid}/${safeName}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("print-files")
          .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

        if (uploadError) {
          console.error("[quote-request] storage upload failed:", uploadError.message);
        } else {
          const { data: signed } = await supabase.storage
            .from("print-files")
            .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
          if (signed?.signedUrl) {
            fileSection = `<a href="${signed.signedUrl}" style="color: #16C2F3; font-weight: bold;">Download: ${file.name}</a>`;
          }
        }
      } catch (storageErr) {
        console.error("[quote-request] storage error:", storageErr);
      }
    }

    const htmlWithFile = html.replace("FILE_PLACEHOLDER", fileSection);

    // Send to staff
    await transporter.sendMail({
      from: `"True Color Website" <${process.env.SMTP_USER}>`,
      to: process.env.STAFF_EMAIL ?? "info@true-color.ca",
      replyTo: email,
      subject,
      html: htmlWithFile,
    });

    // Send confirmation to customer
    await transporter.sendMail({
      from: `"True Color Display Printing" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Got your quote request — True Color Display Printing",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1c1712; padding: 20px 30px;">
            <p style="color: #16C2F3; font-size: 18px; font-weight: bold; margin: 0;">True Color Display Printing</p>
          </div>
          <div style="padding: 24px 30px; background: #fff;">
            <p style="font-size: 16px; color: #1c1712;">Hi ${name},</p>
            <p style="color: #444;">Got it! We received your quote request and will reply within 1 business day.</p>
            <p style="color: #444;">In the meantime, you can call us at <a href="tel:+13069548688" style="color: #16C2F3;">(306) 954-8688</a> or visit us at 216 33rd St W, Saskatoon.</p>
            <p style="color: #444;">— The True Color Team</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send";
    console.error("[quote-request]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
