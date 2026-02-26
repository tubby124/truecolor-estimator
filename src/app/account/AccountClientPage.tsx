"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { addToCart } from "@/lib/cart/cart";
import type { LineItem } from "@/lib/cart/cart";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_STEPS,
} from "@/lib/data/order-constants";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app";

const SUPABASE_STORAGE_URL = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"
}/storage/v1/object/public/print-files`;

const STAFF_EMAIL = "info@true-color.ca";

// ─── Addon config ─────────────────────────────────────────────────────────────

const ADDON_LABELS: Record<string, string> = {
  GROMMET: "Grommet",
  GROMMETS: "Grommets",
  H_STAKE: "H-Stake",
  H_STAKES: "H-Stakes",
  LAMINATE: "Laminate",
  MOUNTING: "Mounting",
  STAKE: "Stake",
};

const ADDON_COLORS: Record<string, string> = {
  GROMMET: "bg-indigo-100 text-indigo-700",
  GROMMETS: "bg-indigo-100 text-indigo-700",
  H_STAKE: "bg-amber-100 text-amber-700",
  H_STAKES: "bg-amber-100 text-amber-700",
  STAKE: "bg-amber-100 text-amber-700",
  LAMINATE: "bg-teal-100 text-teal-700",
  MOUNTING: "bg-orange-100 text-orange-700",
};

// ─── Types ────────────────────────────────────────────────────────────────────

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
  addons: string[] | null;
  line_items_json: LineItem[] | null;
  file_storage_path: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  gst: number;
  total: number;
  notes: string | null;
  created_at: string;
  is_rush: boolean;
  payment_method: string;
  pay_url: string | null;
  proof_storage_path: string | null;
  proof_sent_at: string | null;
  file_storage_paths: string[] | null;
  order_items: OrderItem[];
}

interface SessionData {
  access_token: string;
  user: { id: string; email?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAddons(
  addons: string[] | null
): { label: string; count: number; colorClass: string }[] {
  if (!addons?.length) return [];
  const counts: Record<string, number> = {};
  for (const a of addons) counts[a] = (counts[a] ?? 0) + 1;
  return Object.entries(counts).map(([key, count]) => ({
    label: ADDON_LABELS[key] ?? key,
    count,
    colorClass: ADDON_COLORS[key] ?? "bg-gray-100 text-gray-600",
  }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── StatusStepper ────────────────────────────────────────────────────────────

function StatusStepper({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center mt-2.5 w-full max-w-xs">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-[#16C2F3]"
                    : active
                    ? "border-2 border-[#16C2F3] bg-white"
                    : "border-2 border-gray-200 bg-white"
                }`}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-[9px] mt-0.5 whitespace-nowrap leading-tight ${
                  active
                    ? "text-[#16C2F3] font-bold"
                    : done
                    ? "text-gray-400"
                    : "text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-0.5 mb-3.5 ${
                  idx < currentIdx ? "bg-[#16C2F3]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState<Set<string>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwResetSent, setPwResetSent] = useState(false);

  // Sign-up mode
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpDone, setSignUpDone] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const isReset =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("reset") === "1";

  // ── Fetch orders ────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (tok: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/account/orders", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data: { orders?: Order[] } = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error("[account] fetchOrders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Auth + initial load ─────────────────────────────────────────────────────

  useEffect(() => {
    // Pre-fill from email nudge link — /account?signup=1&email=jane@example.com
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("signup") === "1") {
        setIsSignUp(true);
        const preEmail = params.get("email");
        if (preEmail) setEmail(decodeURIComponent(preEmail));
      }
    }

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

  // ── Load orders on session ──────────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;
    fetchOrders(session.access_token);
  }, [session, fetchOrders]);

  // ── Supabase Realtime: live order sync ─────────────────────────────────────
  // Listens to changes on the orders table (enabled via supabase_realtime publication).
  // When staff updates status, uploads proof, etc. — customer sees it instantly.

  useEffect(() => {
    if (!session) return;

    const supabase = createClient();
    const channel = supabase
      .channel("customer-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders(session.access_token);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, fetchOrders]);

  // ── Action handlers ─────────────────────────────────────────────────────────

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
      if (data.session) {
        if (data.session.user?.email?.toLowerCase() === STAFF_EMAIL) {
          router.replace("/staff/orders");
          return;
        }
        setSession(data.session as SessionData);
      }
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
        options: { emailRedirectTo: `${SITE_URL}/account/callback` },
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session as SessionData);
      } else {
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
        label: `${
          item.width_in && item.height_in
            ? `${item.width_in}\u00d7${item.height_in}" \u2014 `
            : ""
        }${item.sides === 2 ? "Double-sided" : "Single-sided"} \u00d7 ${item.qty}`,
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
        gst_rate: 0.05,
        qty: item.qty,
      });
    });
    setReorderedId(order.id);
    setTimeout(() => router.push("/cart"), 800);
  }

  async function handleFileUpload(orderId: string, file: File) {
    setUploadingFile(orderId);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/account/orders/${orderId}/upload-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: form,
      });
      const data: { ok?: boolean; filePath?: string; error?: string } =
        await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadDone((prev) => new Set([...prev, orderId]));
      await fetchOrders(session!.access_token);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingFile(null);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
        </main>
      </div>
    );
  }

  // ── Password reset ───────────────────────────────────────────────────────────

  if (isReset) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-[#1c1712] mb-2">
            Set your new password
          </h1>
          <p className="text-gray-500 mb-10">Choose a new password for your account.</p>
          <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md">
            {resetDone ? (
              <div className="text-center py-4">
                <p className="font-semibold text-[#1c1712] text-lg">
                  Password updated!
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You&apos;re now signed in.
                </p>
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
                  <label
                    className="block text-xs text-gray-500 mb-1"
                    htmlFor="newpw"
                  >
                    New password{" "}
                    <span className="text-gray-400">(min 8 characters)</span>
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

  // ── Not logged in ────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Your orders</h1>
          <p className="text-gray-500 mb-10">
            Sign in to track your orders, download proofs, and reorder with one click.
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
                <button
                  onClick={() => {
                    setSignUpDone(false);
                    setIsSignUp(false);
                  }}
                  className="mt-4 text-sm text-[#16C2F3] font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label
                    className="block text-xs text-gray-500 mb-1"
                    htmlFor="pw-email"
                  >
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
                  <label
                    className="block text-xs text-gray-500 mb-1"
                    htmlFor="pw-password"
                  >
                    Password{" "}
                    {isSignUp && (
                      <span className="text-gray-400">(min 8 characters)</span>
                    )}
                  </label>
                  <input
                    id="pw-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !isSignUp && handlePasswordSignIn()
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder={isSignUp ? "Choose a password" : "Your password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
                {isSignUp && (
                  <div>
                    <label
                      className="block text-xs text-gray-500 mb-1"
                      htmlFor="pw-confirm"
                    >
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
                    ? isSignUp
                      ? "Creating account\u2026"
                      : "Signing in\u2026"
                    : isSignUp
                    ? "Create account \u2192"
                    : "Sign in \u2192"}
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
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "New here? Create account"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help block */}
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="font-bold text-[#1c1712] mb-3">
              Need help with your order?
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                📞{" "}
                <a
                  href="tel:+13069548688"
                  className="text-[#16C2F3] font-semibold hover:underline"
                >
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
              <Link
                href="/quote"
                className="text-sm text-[#16C2F3] font-semibold hover:underline"
              >
                Place a new order &rarr;
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── Logged in — order dashboard ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1c1712]">Your orders</h1>
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors mt-1"
          >
            Sign out
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap mb-8 text-sm">
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get a price &rarr;
          </Link>
          <a
            href="tel:+13069548688"
            className="border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            📞 (306) 954-8688
          </a>
          <a
            href="mailto:info@true-color.ca"
            className="border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            ✉ Email us
          </a>
        </div>

        {/* Orders list */}
        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
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
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const rushFee =
                order.is_rush
                  ? Math.round(
                      (Number(order.total) -
                        Number(order.subtotal) -
                        Number(order.gst)) *
                        100
                    ) / 100
                  : 0;

              return (
                <div
                  key={order.id}
                  className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
                    order.is_rush ? "border-orange-300" : "border-gray-200"
                  }`}
                >
                  {/* ── Card header ── */}
                  <div
                    className={`p-5 cursor-pointer transition-colors ${
                      order.is_rush
                        ? "bg-orange-50 hover:bg-orange-100/50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: order info + stepper */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1c1712] text-base">
                            {order.order_number}
                          </span>
                          {order.is_rush && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              RUSH
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              STATUS_COLORS[order.status] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          {/* Proof badge — visible without expanding */}
                          {order.proof_storage_path && (
                            <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full animate-pulse">
                              Proof ready — review now
                            </span>
                          )}
                          {order.status === "ready_for_pickup" && (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              Ready to collect!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(order.created_at)} &middot;{" "}
                          {order.order_items.length} item
                          {order.order_items.length !== 1 ? "s" : ""} &middot; $
                          {Number(order.total).toFixed(2)} CAD
                        </p>
                        <StatusStepper status={order.status} />
                      </div>

                      {/* Right: action buttons */}
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.pay_url &&
                          order.status === "pending_payment" &&
                          order.payment_method === "clover_card" && (
                            <a
                              href={order.pay_url}
                              className="text-sm font-bold px-4 py-2 rounded-lg bg-[#16C2F3] text-white hover:bg-[#0fb0dd] transition-colors whitespace-nowrap"
                            >
                              Pay by card &rarr;
                            </a>
                          )}
                        {order.status !== "pending_payment" && (
                          <button
                            onClick={() => handleReorder(order)}
                            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                              reorderedId === order.id
                                ? "bg-[#8CC63E] text-white"
                                : "bg-[#f4efe9] text-[#1c1712] hover:bg-[#16C2F3] hover:text-white"
                            }`}
                          >
                            {reorderedId === order.id
                              ? "\u2713 Going to cart\u2026"
                              : "Reorder"}
                          </button>
                        )}
                        <span className="text-gray-400 text-sm select-none">
                          {isExpanded ? "\u25b2" : "\u25bc"}
                        </span>
                      </div>
                    </div>

                    {/* eTransfer instructions — visible without expanding */}
                    {order.payment_method === "etransfer" &&
                      order.status === "pending_payment" && (
                        <div
                          className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-bold text-amber-800 mb-1.5">
                            Pay by e-Transfer
                          </p>
                          <p className="text-sm text-amber-900 leading-relaxed">
                            Send{" "}
                            <span className="font-bold">
                              ${Number(order.total).toFixed(2)} CAD
                            </span>{" "}
                            to{" "}
                            <span className="font-bold font-mono bg-amber-100 px-1 rounded">
                              info@true-color.ca
                            </span>
                          </p>
                          <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                            Use{" "}
                            <span className="font-mono font-bold bg-amber-100 px-1 rounded">
                              {order.order_number}
                            </span>{" "}
                            as the message/reference. We&apos;ll start your
                            order once we confirm payment.
                          </p>
                        </div>
                      )}

                    {/* Ready for pickup — inline address */}
                    {order.status === "ready_for_pickup" && (
                      <div
                        className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-xs font-bold text-green-800 mb-1.5">
                          Your order is ready for pickup!
                        </p>
                        <p className="text-sm text-green-900">
                          📍 216 33rd St W, Saskatoon SK
                        </p>
                        <p className="text-sm text-green-900 mt-0.5">
                          📞{" "}
                          <a
                            href="tel:+13069548688"
                            className="font-semibold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            (306) 954-8688
                          </a>{" "}
                          &middot; Mon&ndash;Fri 9 AM&ndash;5 PM
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Expanded section ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-5">

                      {/* Item cards */}
                      <div className="space-y-3">
                        {order.order_items.map((item) => {
                          const addonChips = parseAddons(item.addons);
                          const sizeLabel =
                            item.width_in && item.height_in
                              ? `${item.width_in}\u00d7${item.height_in}" (${(
                                  item.width_in / 12
                                ).toFixed(1)}\u00d7${(
                                  item.height_in / 12
                                ).toFixed(1)} ft)`
                              : null;

                          return (
                            <div
                              key={item.id}
                              className="bg-white border border-gray-200 rounded-xl p-4"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[#1c1712]">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    {sizeLabel && (
                                      <>{sizeLabel} &middot; </>
                                    )}
                                    {item.sides === 2
                                      ? "Double-sided"
                                      : "Single-sided"}{" "}
                                    &middot; Qty {item.qty}
                                    {item.design_status &&
                                      item.design_status !== "PRINT_READY" && (
                                        <>
                                          {" "}
                                          &middot;{" "}
                                          <span className="text-gray-400 capitalize">
                                            {item.design_status
                                              .replace(/_/g, " ")
                                              .toLowerCase()}
                                          </span>
                                        </>
                                      )}
                                  </p>
                                  {/* Addon chips */}
                                  {addonChips.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {addonChips.map((a) => (
                                        <span
                                          key={a.label}
                                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.colorClass}`}
                                        >
                                          {a.count > 1
                                            ? `\u00d7${a.count} `
                                            : ""}
                                          {a.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="font-bold text-[#1c1712] tabular-nums shrink-0 text-sm">
                                  ${item.line_total.toFixed(2)}
                                </p>
                              </div>

                              {/* Artwork file */}
                              {item.file_storage_path && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-400 mb-1">
                                    Your uploaded file:
                                  </p>
                                  <a
                                    href={`${SUPABASE_STORAGE_URL}/${item.file_storage_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#16C2F3] font-semibold hover:underline"
                                  >
                                    📎 View artwork &rarr;
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals */}
                      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span className="font-medium tabular-nums">
                            ${Number(order.subtotal).toFixed(2)}
                          </span>
                        </div>
                        {order.is_rush && rushFee > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Rush fee</span>
                            <span className="font-medium tabular-nums">
                              +${rushFee.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                          <span>GST (5%)</span>
                          <span className="font-medium tabular-nums">
                            ${Number(order.gst).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-100 pt-1.5">
                          <span className="font-semibold text-[#1c1712]">
                            Total
                          </span>
                          <span className="font-bold text-[#1c1712] tabular-nums">
                            ${Number(order.total).toFixed(2)} CAD
                          </span>
                        </div>
                      </div>

                      {/* Customer notes */}
                      {order.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Your notes
                          </p>
                          <p className="text-sm text-gray-700 italic">
                            &ldquo;{order.notes}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Proof section */}
                      {order.proof_storage_path && (
                        <div className="border border-violet-200 bg-violet-50 rounded-xl p-4">
                          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">
                            Proof from True Color
                            {order.proof_sent_at && (
                              <span className="ml-2 font-normal normal-case text-violet-400">
                                &mdash; sent{" "}
                                {new Date(
                                  order.proof_sent_at
                                ).toLocaleDateString("en-CA", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </p>
                          {/\.(jpg|jpeg|png|webp)$/i.test(
                            order.proof_storage_path
                          ) ? (
                            <div>
                              <img
                                src={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                                alt="Print proof"
                                className="w-full rounded-lg border border-violet-200 mb-3"
                                style={{
                                  maxHeight: "420px",
                                  objectFit: "contain",
                                  background: "#fff",
                                }}
                              />
                              <div className="flex gap-4 flex-wrap">
                                <a
                                  href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-violet-600 font-semibold hover:underline"
                                >
                                  View full size &rarr;
                                </a>
                                <a
                                  href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                                  download
                                  className="text-xs text-violet-600 font-semibold hover:underline"
                                >
                                  &darr; Download proof
                                </a>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
                            >
                              📄 Download proof PDF &rarr;
                            </a>
                          )}
                          <div className="mt-3 bg-white border border-violet-100 rounded-lg px-3 py-2.5">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Looks good? We&apos;ll proceed to print. Have
                              changes?{" "}
                              <a
                                href="tel:+13069548688"
                                className="text-[#16C2F3] font-semibold hover:underline"
                              >
                                (306) 954-8688
                              </a>{" "}
                              or{" "}
                              <a
                                href="mailto:info@true-color.ca"
                                className="text-[#16C2F3] font-semibold hover:underline"
                              >
                                info@true-color.ca
                              </a>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Artwork upload — unpaid orders */}
                      {order.status === "pending_payment" &&
                        order.order_items.some(
                          (i) => i.design_status !== "FULL_DESIGN"
                        ) && (
                          <div className="border border-gray-200 rounded-xl p-4 bg-white">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                              Your artwork file
                            </p>
                            {uploadDone.has(order.id) ? (
                              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-semibold">
                                ✓ File uploaded &mdash; our team has been
                                notified.
                              </p>
                            ) : (
                              <>
                                <p className="text-xs text-gray-500 mb-3">
                                  Upload your design file (PDF, AI, JPG, PNG, or
                                  WebP &mdash; max 50 MB).
                                  {order.order_items.some(
                                    (i) => i.file_storage_path
                                  ) &&
                                    " Uploading a new file will replace the current one."}
                                </p>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,.pdf,.ai,.eps"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleFileUpload(order.id, file);
                                  }}
                                  disabled={uploadingFile === order.id}
                                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f4efe9] file:text-[#1c1712] hover:file:bg-[#16C2F3] hover:file:text-white transition-colors"
                                />
                                {uploadingFile === order.id && (
                                  <p className="text-xs text-gray-400 mt-2 animate-pulse">
                                    Uploading\u2026
                                  </p>
                                )}
                                {uploadError && uploadingFile === null && (
                                  <p className="text-xs text-red-500 mt-2 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                                    {uploadError}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}

                      {/* Paid + processing — call-us for file changes */}
                      {["payment_received", "in_production"].includes(
                        order.status
                      ) &&
                        order.order_items.some(
                          (i) => i.design_status !== "FULL_DESIGN"
                        ) && (
                          <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                              Need to update your file?
                            </p>
                            <p className="text-sm text-gray-600">
                              Your order is being processed. For file changes,
                              call us:{" "}
                              <a
                                href="tel:+13069548688"
                                className="text-[#16C2F3] font-semibold hover:underline"
                              >
                                (306) 954-8688
                              </a>
                            </p>
                          </div>
                        )}

                      {/* Bottom actions */}
                      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
                        {order.status !== "pending_payment" && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#f4efe9] text-[#1c1712] hover:bg-[#16C2F3] hover:text-white transition-colors"
                          >
                            Order same items again &rarr;
                          </button>
                        )}
                        <a
                          href={`mailto:info@true-color.ca?subject=Re: Order ${order.order_number}`}
                          className="text-sm text-gray-400 hover:text-[#16C2F3] transition-colors"
                        >
                          ✉ Message us about this order
                        </a>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
