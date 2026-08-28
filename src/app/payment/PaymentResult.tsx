import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { encodePaymentToken } from "@/lib/payment/token";
import type { LatestPaymentAttempt } from "@/lib/payments/attempts";

type PaymentResultKind = "success" | "failed" | "cancelled";

interface PaymentResultProps {
  kind: PaymentResultKind;
  searchParams: { oid?: string; orderId?: string; checkoutSessionId?: string; sessionId?: string };
}

interface PaymentOrder {
  id: string;
  order_number: string;
  total: number | string;
  status: string;
  payment_method: string;
  customers?: { email: string | null; name: string | null } | Array<{ email: string | null; name: string | null }> | null;
}

const COPY: Record<PaymentResultKind, { title: string; body: string; tone: string }> = {
  success: {
    title: "Payment is being verified",
    body: "Thanks. We are checking the secure Clover confirmation now. If the payment was captured, your order will update automatically and you will receive a receipt.",
    tone: "bg-blue-50 border-blue-200 text-blue-900",
  },
  failed: {
    title: "Payment did not complete",
    body: "Your card was not charged by this attempt. You can try again with the same link, use a different card, or pay by e-Transfer.",
    tone: "bg-orange-50 border-orange-200 text-orange-900",
  },
  cancelled: {
    title: "Checkout was cancelled",
    body: "Your card was not charged by this attempt. You can resume card payment, pay by e-Transfer, or contact us if you need help.",
    tone: "bg-amber-50 border-amber-200 text-amber-900",
  },
};

export async function PaymentResult({ kind, searchParams }: PaymentResultProps) {
  const supabase = createServiceClient();
  const explicitOrderId = searchParams.oid ?? searchParams.orderId ?? null;
  const checkoutSessionId = searchParams.checkoutSessionId ?? searchParams.sessionId ?? null;

  let orderId = explicitOrderId;
  let latestAttempt: LatestPaymentAttempt | null = null;

  if (!orderId && checkoutSessionId) {
    const { data: attempt } = await supabase
      .from("payment_attempts")
      .select("order_id, status, amount, failure_label, failure_detail, customer_message, clover_checkout_session_id, clover_payment_id, created_at")
      .eq("clover_checkout_session_id", checkoutSessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    orderId = (attempt as { order_id?: string | null } | null)?.order_id ?? null;
    if (attempt) {
      const { order_id: _orderId, ...safeAttempt } = attempt as LatestPaymentAttempt & { order_id: string | null };
      void _orderId;
      latestAttempt = safeAttempt;
    }
  }

  let order: PaymentOrder | null = null;
  if (orderId && /^[0-9a-f-]{36}$/i.test(orderId)) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, total, status, payment_method, customers(email, name)")
      .eq("id", orderId)
      .maybeSingle();
    order = data as PaymentOrder | null;

    if (!latestAttempt) {
      const { data: attempt } = await supabase
        .from("payment_attempts")
        .select("status, amount, failure_label, failure_detail, customer_message, clover_checkout_session_id, clover_payment_id, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      latestAttempt = (attempt as LatestPaymentAttempt | null) ?? null;
    }
  }

  const customerRaw = order?.customers;
  const customerEmail = Array.isArray(customerRaw) ? customerRaw[0]?.email : customerRaw?.email;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
  let retryUrl: string | null = null;
  if (order && order.status === "pending_payment") {
    try {
      retryUrl = `/pay/${encodePaymentToken(
        Number(order.total),
        `Order ${order.order_number}`,
        customerEmail ?? undefined,
        `${siteUrl}/order-confirmed?oid=${order.id}`,
        { orderId: order.id },
      )}`;
    } catch {
      retryUrl = null;
    }
  }

  const copy = COPY[kind];
  const attemptMessage = latestAttempt?.customer_message;

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <div className={`rounded-2xl border p-6 ${copy.tone}`}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">Clover checkout</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1712]">{copy.title}</h1>
          {order?.order_number && (
            <p className="mt-3 inline-flex rounded-lg bg-white/70 px-3 py-1 text-sm font-bold text-[#1c1712]">
              Order {order.order_number}
            </p>
          )}
          <p className="mt-4 text-base leading-relaxed">{attemptMessage ?? copy.body}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {order?.id && (
            <Link
              href={`/order-confirmed?oid=${order.id}`}
              className="rounded-lg bg-[#1c1712] px-5 py-3 text-sm font-bold text-white hover:bg-black transition-colors"
            >
              View order status
            </Link>
          )}
          {retryUrl && (
            <Link
              href={retryUrl}
              className="rounded-lg bg-[#16C2F3] px-5 py-3 text-sm font-bold text-white hover:bg-[#0fb0dd] transition-colors"
            >
              Try card again
            </Link>
          )}
          <a
            href={`mailto:info@true-color.ca?subject=${encodeURIComponent(order ? `Payment help for ${order.order_number}` : "Payment help")}`}
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            Contact True Color
          </a>
        </div>

        {order && order.status === "pending_payment" && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-bold">Pay by e-Transfer instead</p>
            <p className="mt-2 text-sm leading-relaxed">
              Send <span className="font-bold">${Number(order.total).toFixed(2)} CAD</span> to{" "}
              <span className="rounded bg-amber-100 px-1 font-mono font-bold">info@true-color.ca</span>. Include{" "}
              <span className="rounded bg-amber-100 px-1 font-mono font-bold">{order.order_number}</span> in the memo.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
