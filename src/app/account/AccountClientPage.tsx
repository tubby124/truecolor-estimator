"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { addToCart } from "@/lib/cart/cart";

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

const STAFF_EMAIL = "info@true-color.ca";

export function AccountClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  // Sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwResetSent, setPwResetSent] = useState(false);

  // Sign-up mode (inside the sign-in form)
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpDone, setSignUpDone] = useState(false);

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
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === STAFF_EMAIL) {
        router.replace("/staff/orders");
        return;
      }
      if (session) setSession(session as SessionData);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (session.user?.email?.toLowerCase() === STAFF_EMAIL) {
          router.replace("/staff/orders");
          return;
        }
        setSession(session as SessionData);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
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
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setOrders([]);
  }

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) return;
    setPwError("");
    setPwLoading(true);
    try {
      const supabase = createClient();
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

  async function handleSignUp() {
    if (!email.trim() || !password) return;
    if (password !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwError("");
    setPwLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/account/callback`,
        },
      });
      if (error) throw error;
      // If email confirmation is disabled, session is returned immediately
      if (data.session) {
        setSession(data.session as SessionData);
      } else {
        // Fallback if email confirmation is somehow still on
        setSignUpDone(true);
      }
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setPwError("Enter your email address above first.");
      return;
    }
    setPwError("");
    setPwLoading(true);
    try {
      const supabase = createClient();
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
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetDone(true);
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

  // ── Password reset form — takes priority over everything else ─────────────
  // Shown when ?reset=1 is in the URL (user clicked a password reset link).
  // The user arrives with a valid recovery session so session may or may not be set.
  if (isReset) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Set your new password</h1>
          <p className="text-gray-500 mb-10">Choose a new password for your account.</p>
          <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md">
            {resetDone ? (
              <div className="text-center py-4">
                <p className="font-semibold text-[#1c1712] text-lg">Password updated!</p>
                <p className="text-sm text-gray-500 mt-2">You&apos;re now signed in.</p>
                <a
                  href="/account"
                  className="mt-6 inline-block bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors text-sm"
                >
                  Go to my orders &rarr;
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="newpw">
                    New password <span className="text-gray-400">(min 8 characters)</span>
                  </label>
                  <input
                    id="newpw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetNewPassword()}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder="Enter new password"
                    autoFocus
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
                  <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                    {resetError}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── Not logged in — show sign-in / sign-up form ───────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Your orders</h1>
          <p className="text-gray-500 mb-10">
            Sign in to view your order history and reorder with one click.
          </p>

          <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
            <h2 className="font-bold text-[#1c1712] mb-5">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </h2>

            {pwResetSent ? (
              <div className="text-center py-4">
                <p className="font-semibold text-[#1c1712]">Reset link sent!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Check your inbox for a password reset email.
                </p>
                <button
                  onClick={() => setPwResetSent(false)}
                  className="mt-4 text-sm text-[#16C2F3] font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : signUpDone ? (
              <div className="text-center py-4">
                <p className="font-semibold text-[#1c1712]">Check your inbox!</p>
                <p className="text-sm text-gray-500 mt-2">
                  We sent a confirmation link to{" "}
                  <span className="font-mono">{email}</span>.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Click the link, then come back here and sign in with your password.
                </p>
                <button
                  onClick={() => { setSignUpDone(false); setIsSignUp(false); }}
                  className="mt-4 text-sm text-[#16C2F3] font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="space-y-3">
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
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="pw-password">
                    Password{" "}
                    {isSignUp && <span className="text-gray-400">(min 8 characters)</span>}
                  </label>
                  <input
                    id="pw-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isSignUp && handlePasswordSignIn()}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder={isSignUp ? "Choose a password" : "Your password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
                {isSignUp && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="pw-confirm">
                      Confirm password
                    </label>
                    <input
                      id="pw-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <button
                  onClick={isSignUp ? handleSignUp : handlePasswordSignIn}
                  disabled={pwLoading}
                  className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
                >
                  {pwLoading
                    ? isSignUp ? "Creating account\u2026" : "Signing in\u2026"
                    : isSignUp ? "Create account \u2192" : "Sign in \u2192"}
                </button>
                {pwError && (
                  <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                    {pwError}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  {!isSignUp && (
                    <button
                      onClick={handleForgotPassword}
                      type="button"
                      className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setPwError("");
                      setConfirmPassword("");
                    }}
                    type="button"
                    className="text-xs text-[#16C2F3] font-semibold hover:underline ml-auto"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
                  </button>
                </div>
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

  // ── Logged in — show order dashboard ─────────────────────────────────────
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
