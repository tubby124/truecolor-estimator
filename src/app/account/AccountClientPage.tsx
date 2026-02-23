"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { addToCart } from "@/lib/cart/cart";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  payment_received: "Payment received",
  in_production: "In production",
  ready_for_pickup: "Ready for pickup",
  complete: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  payment_received: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-green-100 text-green-800",
  complete: "bg-gray-100 text-gray-600",
};

interface OrderItem {
  id: string;
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  design_status: string;
  line_total: number;
  category: string;
  material_code: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  is_rush: boolean;
  payment_method: string;
  order_items: OrderItem[];
}

interface SessionData {
  access_token: string;
  user: { email?: string };
}

export function AccountClientPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  // Magic link form state
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState("");

  useEffect(() => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session as SessionData);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    setOrdersLoading(true);
    fetch("/api/account/orders", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data: { orders?: Order[] }) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  }, [session]);

  async function handleSignOut() {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);
    await supabase.auth.signOut();
    setSession(null);
    setOrders([]);
  }

  async function handleMagicLink() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setMlError("");
    setMlLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send link");
      setSent(true);
    } catch (err) {
      setMlError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setMlLoading(false);
    }
  }

  function handleReorder(order: Order) {
    order.order_items.forEach((item) => {
      addToCart({
        product_name: item.product_name,
        product_slug: item.category.toLowerCase().replace(/_/g, "-"),
        category: item.category,
        label: `${item.width_in && item.height_in ? `${item.width_in}\u00d7${item.height_in}" \u2014 ` : ""}${item.sides === 2 ? "Double-sided" : "Single-sided"} \u00d7 ${item.qty}`,
        config: {
          category: item.category,
          material_code: item.material_code ?? undefined,
          width_in: item.width_in ?? undefined,
          height_in: item.height_in ?? undefined,
          sides: item.sides,
          qty: item.qty,
          design_status: item.design_status,
        },
        sell_price: item.line_total,
        qty: item.qty,
      });
    });
    setReorderedId(order.id);
    setTimeout(() => setReorderedId(null), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Your orders</h1>
          <p className="text-gray-500 mb-10">
            Enter your email to receive a login link &mdash; no password needed.
          </p>

          {/* Magic link form */}
          <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
            <h2 className="font-bold text-[#1c1712] mb-4">Access your account</h2>
            {sent ? (
              <div className="text-center py-4">
                <p className="font-semibold text-[#1c1712]">Check your inbox</p>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a login link to{" "}
                  <span className="font-mono">{email}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  onClick={handleMagicLink}
                  disabled={mlLoading}
                  className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
                >
                  {mlLoading ? "Sending\u2026" : "Send login link \u2192"}
                </button>
                {mlError && (
                  <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                    {mlError}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              We&apos;ll email you a one-click login link. No password required.
            </p>
          </div>

          {/* Help block */}
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="font-bold text-[#1c1712] mb-3">Need help with your order?</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                📞{" "}
                <a href="tel:+13069548688" className="text-[#16C2F3] font-semibold hover:underline">
                  (306) 954-8688
                </a>{" "}
                &mdash; Mon&ndash;Fri 9 AM&ndash;5 PM
              </p>
              <p>
                📧{" "}
                <a
                  href="mailto:info@true-color.ca"
                  className="text-[#16C2F3] font-semibold hover:underline"
                >
                  info@true-color.ca
                </a>
              </p>
              <p>📍 216 33rd St W, Saskatoon SK</p>
            </div>
            <div className="mt-5">
              <Link href="/quote" className="text-sm text-[#16C2F3] font-semibold hover:underline">
                Place a new order &rarr;
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Logged in — show dashboard
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1c1712]">Your orders</h1>
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-6">No orders yet.</p>
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
            >
              Get a price &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-xl overflow-hidden ${
                  order.is_rush ? "border-orange-300" : "border-gray-100"
                }`}
              >
                {/* Order header row */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1c1712]">{order.order_number}</span>
                      {order.is_rush && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                          RUSH
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" \u00b7 "}
                      {order.order_items.length} item
                      {order.order_items.length !== 1 ? "s" : ""}
                      {" \u00b7 "}
                      ${Number(order.total).toFixed(2)} CAD
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(order);
                      }}
                      className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                        reorderedId === order.id
                          ? "bg-[#8CC63E] text-white"
                          : "bg-[#f4efe9] text-[#1c1712] hover:bg-[#16C2F3] hover:text-white"
                      }`}
                    >
                      {reorderedId === order.id ? "\u2713 Added to cart" : "Reorder"}
                    </button>
                    <span className="text-gray-400 text-sm">
                      {expandedOrder === order.id ? "\u25b2" : "\u25bc"}
                    </span>
                  </div>
                </div>

                {/* Expanded line items */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start gap-4 text-sm"
                        >
                          <div>
                            <p className="font-medium text-[#1c1712]">{item.product_name}</p>
                            <p className="text-xs text-gray-400">
                              {item.width_in && item.height_in
                                ? `${item.width_in}\u00d7${item.height_in}" \u00b7 `
                                : ""}
                              {item.sides === 2 ? "Double-sided \u00b7 " : "Single-sided \u00b7 "}
                              qty {item.qty}
                              {item.design_status !== "PRINT_READY"
                                ? ` \u00b7 ${item.design_status}`
                                : ""}
                            </p>
                          </div>
                          <p className="font-semibold text-[#1c1712] shrink-0">
                            ${item.line_total.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
