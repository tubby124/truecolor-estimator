import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/smtp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, product_name, product_slug } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    !EMAIL_RE.test(email.trim())
  ) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  if (typeof product_name !== "string" || !product_name.trim()) {
    return NextResponse.json({ error: "product_name is required." }, { status: 400 });
  }

  const staffEmail =
    process.env.STAFF_EMAIL ?? "albert@true-color.ca";

  const safeEmail = email.trim();
  const safeName = String(product_name).trim();
  const safeSlug = typeof product_slug === "string" ? product_slug.trim() : "";

  await sendEmail({
    to: staffEmail,
    subject: `Notify Me signup: ${safeName}`,
    html: `<p><strong>${safeEmail}</strong> wants to be notified when <strong>${safeName}</strong> is available.</p>${safeSlug ? `<p>Product slug: <code>${safeSlug}</code></p>` : ""}`,
    text: `${safeEmail} wants to be notified when ${safeName} is available.${safeSlug ? ` Product slug: ${safeSlug}` : ""}`,
  });

  return NextResponse.json({ success: true });
}
