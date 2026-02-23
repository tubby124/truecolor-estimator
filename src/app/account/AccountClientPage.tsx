"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { addToCart } from "@/lib/cart/cart";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app";

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

  // Tab + password state
  const [activeTab, setActiveTab] = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwResetSent, setPwResetSent] = useState(false);

  // Password reset state (for ?reset=1)
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  // Read ?reset=1 from URL on client side (avoids Suspense requirement)
  const isReset =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("reset") === "1";

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

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) return;
    setPwError("");
    setPwLoading(true);
    try {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
      const supabase = createClient(SUPABASE_URL, anonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.session) setSession(data.session as SessionData);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setPwError("Enter your email above first.");
      return;
    }
    setPwError("");
    setPwLoading(true);
    try {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
      const supabase = createClient(SUPABASE_URL, anonKey);
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${SITE_URL}/account/callback` }
      );
      if (error) throw error;
      setPwResetSent(true);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSetNewPassword() {
    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetError("");
    setResetLoading(true);
    try {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
      const supabase = createClient(SUPABASE_URL, anonKey);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetDone(true);
      // Clear ?reset=1 from URL and refresh session
      window.history.replaceState({}, "", "/account");
      const { data } = await supabase.auth.getSession();
      if (data.session) setSession(data.session as SessionData);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setResetLoading(false);
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
            Sign in to view your order history and reorder with one click.
          </p>

          {/* Password reset block — shown when ?reset=1 is in URL */}
          {isReset && (
            <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
              <h2 className="font-bold text-[#1c1712] mb-4">Set your new password</h2>
              {resetDone ? (
                <p className="text-[#1c1712] font-semibold">Password updated! Redirecting&hellip;</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="newpw">
                      New password (min 8 characters)
                    </label>
                    <input
                      id="newpw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="Enter new password"
                    />
                  </div>
                  <button
                    onClick={handleSetNewPassword}
                    disabled={resetLoading}
                    className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
                  >
                    {resetLoading ? "Saving\u2026" : "Save password \u2192"}
                  </button>
                  {resetError && (
                    <p className="text-red-500 text-xs">{resetError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sign-in form */}
          <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
            <h2 className="font-bold text-[#1c1712] mb-4">Sign in to your account</h2>

            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
              <button
                onClick={() => setActiveTab("magic")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  activeTab === "magic"
                    ? "bg-[#1c1712] text-white"
                    : "bg-white text-gray-500 hover:text-[#1c1712]"
                }`}
              >
                Email link
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  activeTab === "password"
                    ? "bg-[#1c1712] text-white"
                    : "bg-white text-gray-500 hover:text-[#1c1712]"
                }`}
              >
                Password
              </button>
            </div>

            {/* Magic link tab */}
            {activeTab === "magic" && (
              <>
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
              </>
            )}

            {/* Password tab */}
            {activeTab === "password" && (
              <div className="space-y-3">
                {pwResetSent ? (
                  <div className="text-center py-4">
                    <p className="font-semibold text-[#1c1712]">Reset link sent!</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Check your inbox for a password reset link.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="pw-email">
                        Email address
                      </label>
                      <input
                        id="pw-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="pw-password">
                        Password
                      </label>
                      <input
                        id="pw-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePasswordSignIn()}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                        placeholder="Your password"
                      />
                    </div>
                    <button
                      onClick={handlePasswordSignIn}
                      disabled={pwLoading}
                      className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
                    >
                      {pwLoading ? "Signing in\u2026" : "Sign in \u2192"}
                    </button>
                    {pwError && (
                      <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                        {pwError}
                      </p>
                    )}
                    <button
                      onClick={handleForgotPassword}
                      type="button"
                      className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors w-full text-center"
                    >
                      Forgot password?
                    </button>
                  </>
                )}
              </div>
            )}
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
