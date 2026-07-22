/**
 * GET /api/cron/payment-followup
 *
 * TC-9: Finds checkout sessions >2h old with no completed order → sends "you left something behind" email.
 * TC-10: Finds pending_payment orders >2h old with no follow-up sent → sends "complete your order" email.
 *
 * Run every hour via Railway cron:
 *   Schedule: 0 * * * *
 *   Command:  curl -s -H "Authorization: Bearer $CRON_SECRET" https://truecolorprinting.ca/api/cron/payment-followup
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { encodePaymentToken } from "@/lib/payment/token";
import { escHtml } from "@/lib/email/components/escHtml";
import { recordCronRun } from "@/lib/cron/heartbeat";
import type { PaymentAttemptStatus } from "@/lib/payments/attempts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
const FROM = "True Color Display Printing <hello@outreach.true-color.ca>";

interface LatestAttemptLite {
  order_id: string | null;
  status: PaymentAttemptStatus;
  failure_label: string | null;
  customer_message: string | null;
}

function recoveryCopy(
  orderNumber: string,
  paymentMethod: string | null,
  latestAttempt: LatestAttemptLite | null,
) {
  if (latestAttempt?.status === "card_declined") {
    const reason = latestAttempt.failure_label ?? "Payment did not complete";
    return {
      subject: `Card payment did not complete — ${orderNumber}`,
      headline: "Your card payment did not complete",
      body: `${reason}. You can try the card payment again, or send an e-Transfer instead.`,
      cta: "Try card again",
      foot: "If you prefer e-Transfer, send it to info@true-color.ca and include your order number in the message.",
    };
  }
  if (latestAttempt?.status === "abandoned" || latestAttempt?.status === "checkout_opened") {
    return {
      subject: `Finish payment for ${orderNumber}`,
      headline: "Your checkout did not finish",
      body: "Your order is saved, but payment has not been confirmed yet. Your card was not charged by the unfinished attempt.",
      cta: "Resume card payment",
      foot: "You can also pay by e-Transfer to info@true-color.ca. Please include your order number in the message.",
    };
  }
  if (paymentMethod === "etransfer") {
    return {
      subject: `e-Transfer reminder — ${orderNumber}`,
      headline: "Your order is waiting for e-Transfer",
      body: "Your order is saved. Send an e-Transfer when you are ready and we will confirm receipt before production.",
      cta: "Switch to card payment",
      foot: "Send e-Transfer to info@true-color.ca and include your order number in the message.",
    };
  }
  return {
    subject: `Your True Color order ${orderNumber} is waiting`,
    headline: "Your order is waiting",
    body: "Your order is saved and waiting for payment.",
    cta: "Complete payment",
    foot: "Paying by card? Click the button above — it only takes 30 seconds. Prefer e-Transfer? Send it to info@true-color.ca.",
  };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  let tc9Sent = 0;
  let tc10Sent = 0;

  // ── TC-10: pending_payment orders ───────────────────────────────────────────

  try {
    const { data: staleOrders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, total, payment_method, created_at,
        order_items ( product_name, qty ),
        customers ( name, email )
      `)
      .eq("status", "pending_payment")
      .lt("created_at", cutoff)
      .is("followup_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("[payment-followup] TC-10 query failed:", error.message);
    } else {
      const orderIds = (staleOrders ?? []).map((o) => o.id).filter(Boolean);
      const latestAttemptByOrder = new Map<string, LatestAttemptLite>();
      if (orderIds.length > 0) {
        const { data: attempts, error: attemptsErr } = await supabase
          .from("payment_attempts")
          .select("order_id, status, failure_label, customer_message, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });
        if (attemptsErr) {
          console.error("[payment-followup] payment_attempts query failed:", attemptsErr.message);
        } else {
          for (const attempt of attempts ?? []) {
            const orderId = (attempt as LatestAttemptLite).order_id;
            if (orderId && !latestAttemptByOrder.has(orderId)) {
              latestAttemptByOrder.set(orderId, attempt as LatestAttemptLite);
            }
          }
        }
      }

      for (const order of staleOrders ?? []) {
        const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
        const customer = customerRaw as { name: string; email: string } | null;
        if (!customer?.email) continue;
        const latestAttempt = latestAttemptByOrder.get(order.id) ?? null;

        // Ambiguous Clover matches may be real captured money. Do not ask the
        // customer to retry and risk a double payment; route it to staff only.
        if (latestAttempt?.status === "ambiguous") {
          await supabase
            .from("orders")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", order.id);
          console.warn(`[payment-followup] skipped customer retry for ambiguous Clover match | ${order.order_number}`);
          continue;
        }

        const items = Array.isArray(order.order_items) ? order.order_items : [];
        const productList = (items as { product_name: string; qty: number }[])
          .map((i) => `${i.qty}× ${i.product_name}`)
          .join(", ") || "your print order";

        // Regenerate a fresh /pay/{token} URL (token is self-contained — no stored state needed)
        const redirectUrl = `${SITE_URL}/order-confirmed?oid=${order.id}`;
        let payUrl: string;
        try {
          const token = encodePaymentToken(
            Number(order.total),
            `True Color Order ${order.order_number}`,
            customer.email,
            redirectUrl,
            { orderId: order.id },
          );
          payUrl = `${SITE_URL}/pay/${token}`;
        } catch {
          // PAYMENT_TOKEN_SECRET not set — skip this order
          console.warn("[payment-followup] encodePaymentToken failed — PAYMENT_TOKEN_SECRET missing?");
          continue;
        }

        const firstName = customer.name.split(" ")[0] || customer.name;
        const total = Number(order.total).toFixed(2);
        const copy = recoveryCopy(order.order_number, order.payment_method, latestAttempt);

        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:24px 32px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#16C2F3;letter-spacing:.08em;text-transform:uppercase;">True Color Display Printing</p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1712;">${escHtml(copy.headline)}, ${escHtml(firstName)}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Order <strong>${escHtml(order.order_number)}</strong> · $${escHtml(total)} CAD</p>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${escHtml(copy.body)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>What you ordered:</strong></p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;">${escHtml(productList)}</p>
      <a href="${escHtml(payUrl)}" style="display:inline-block;background:#16C2F3;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">${escHtml(copy.cta)} →</a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
        ${escHtml(copy.foot)}
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0ebe4;font-size:11px;color:#9ca3af;">
      Questions? Reply to this email or call us. · True Color Display Printing · Saskatoon, SK
    </div>
  </div>
</body></html>`;

        const text = `Hi ${firstName},\n\n${copy.headline}.\n\n${copy.body}\n\nOrder ${order.order_number}: ${productList} ($${total} CAD)\n\n${copy.cta}:\n${payUrl}\n\n${copy.foot}\n\nTrue Color Display Printing`;

        try {
          await sendEmail({
            from: FROM,
            to: customer.email,
            subject: copy.subject,
            html,
            text,
          });

          await supabase
            .from("orders")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", order.id);

          tc10Sent++;
          console.log(`[payment-followup] TC-10 sent → ${customer.email} | ${order.order_number}`);
        } catch (emailErr) {
          console.error(`[payment-followup] TC-10 email failed for ${order.order_number}:`, emailErr);
        }
      }
    }
  } catch (err) {
    console.error("[payment-followup] TC-10 block failed:", err);
  }

  // ── TC-9: abandoned checkout sessions ───────────────────────────────────────

  try {
    const { data: sessions, error } = await supabase
      .from("checkout_sessions")
      .select("id, email, name, created_at")
      .lt("created_at", cutoff)
      .is("followup_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("[payment-followup] TC-9 query failed:", error.message);
    } else {
      for (const session of sessions ?? []) {
        // Skip if they actually placed an order after the session was captured
        const { count: orderCount } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customers.email", session.email)
          .gt("created_at", session.created_at);

        // Alternative: join through customers table
        const { data: matchingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("email", session.email.toLowerCase())
          .maybeSingle();

        if (matchingCustomer) {
          const { count: existingOrders } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", matchingCustomer.id)
            .gt("created_at", session.created_at);

          if ((existingOrders ?? 0) > 0) {
            // They ordered — mark session as handled without emailing
            await supabase
              .from("checkout_sessions")
              .update({ followup_sent_at: new Date().toISOString() })
              .eq("id", session.id);
            continue;
          }
        }

        void orderCount; // unused branch above — customer check below is authoritative

        const firstName = session.name?.split(" ")[0] || "there";

        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:24px 32px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#16C2F3;letter-spacing:.08em;text-transform:uppercase;">True Color Display Printing</p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1c1712;">You left something behind, ${escHtml(firstName)}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        Looks like you started an order with us but didn't finish. No worries — come back whenever you're ready. It only takes 2 minutes to place a print order.
      </p>
      <a href="${SITE_URL}/checkout" style="display:inline-block;background:#16C2F3;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Return to checkout →</a>
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
        Need a quote first? <a href="${SITE_URL}" style="color:#16C2F3;text-decoration:none;">Use our instant price calculator →</a>
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0ebe4;font-size:11px;color:#9ca3af;">
      True Color Display Printing · Saskatoon, SK · <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(session.email)}" style="color:#9ca3af;">Unsubscribe</a>
    </div>
  </div>
</body></html>`;

        const text = `Hi ${firstName},\n\nYou started an order at True Color Display Printing but didn't finish. Come back whenever you're ready — it takes 2 minutes.\n\n${SITE_URL}/checkout\n\nNeed a quote first? ${SITE_URL}\n\nTrue Color Display Printing · Saskatoon, SK`;

        try {
          await sendEmail({
            from: FROM,
            to: session.email,
            subject: "You left something at True Color Printing",
            html,
            text,
          });

          await supabase
            .from("checkout_sessions")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", session.id);

          tc9Sent++;
          console.log(`[payment-followup] TC-9 sent → ${session.email}`);
        } catch (emailErr) {
          console.error(`[payment-followup] TC-9 email failed for ${session.email}:`, emailErr);
        }
      }
    }
  } catch (err) {
    console.error("[payment-followup] TC-9 block failed:", err);
  }

  await recordCronRun("payment-followup", true, `tc9=${tc9Sent} tc10=${tc10Sent}`);
  return NextResponse.json({ ok: true, tc9: tc9Sent, tc10: tc10Sent });
}
