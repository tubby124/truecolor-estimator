"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCart, clearCart, type CartItem } from "@/lib/cart/cart";
import type { CreateOrderRequest } from "@/app/api/orders/route";
import { createClient } from "@/lib/supabase/client";
import { sanitizeError } from "@/lib/errors/sanitize";
import { Skeleton } from "@/components/ui/Skeleton";

const DEFAULT_GST_RATE = 0.05;
const RUSH_FEE = 40;

// ── Sign dimension preview ──────────────────────────────────────────────────
// Renders a proportional rectangle with dimension labels — shown in order summary
// for items that have width_in / height_in configured.
function SignPreview({ widthIn, heightIn }: { widthIn: number; heightIn: number }) {
  const MAXPX = 64;
  const wFt = parseFloat((widthIn / 12).toFixed(2));
  const hFt = parseFloat((heightIn / 12).toFixed(2));
  const aspect = wFt / hFt;

  let rW: number, rH: number;
  if (aspect >= 1) {
    rW = MAXPX;
    rH = Math.max(10, Math.round(MAXPX / aspect));
  } else {
    rH = MAXPX;
    rW = Math.max(10, Math.round(MAXPX * aspect));
  }

  const PAD_LEFT = 26;
  const PAD_BOT = 16;
  const svgW = rW + PAD_LEFT + 4;
  const svgH = rH + PAD_BOT + 6;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {/* Sign rectangle */}
      <rect
        x={PAD_LEFT}
        y={3}
        width={rW}
        height={rH}
        fill="white"
        stroke="#d1d5db"
        strokeWidth="1"
        rx="2"
      />
      {/* Subtle content lines */}
      {rH >= 22 &&
        [0.32, 0.52, 0.70].map((frac, i) => (
          <line
            key={i}
            x1={PAD_LEFT + 5}
            y1={3 + rH * frac}
            x2={PAD_LEFT + rW - 5}
            y2={3 + rH * frac}
            stroke="#e5e7eb"
            strokeWidth="0.75"
          />
        ))}
      {/* Width label (bottom) */}
      <text
        x={PAD_LEFT + rW / 2}
        y={3 + rH + PAD_BOT - 1}
        textAnchor="middle"
        fontSize="8"
        fill="#9ca3af"
      >
        {wFt} ft
      </text>
      {/* Height label (left, rotated) */}
      <text
        textAnchor="middle"
        fontSize="8"
        fill="#9ca3af"
        transform={`translate(11, ${3 + rH / 2}) rotate(-90)`}
      >
        {hFt} ft
      </text>
    </svg>
  );
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Contact form — restored from sessionStorage on mount
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Logged-in state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [savedCompanies, setSavedCompanies] = useState<string[]>([]);
  const [showCompanyInput, setShowCompanyInput] = useState(false);

  // Account creation (only shown when NOT logged in)
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Notes + artwork (multi-file)
  const [notes, setNotes] = useState("");
  const [artworkFiles, setArtworkFiles] = useState<File[]>([]);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Rush + payment state
  const [isRush, setIsRush] = useState(false);
  const [payMethod, setPayMethod] = useState<"clover_card" | "etransfer">("clover_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore form fields from sessionStorage (survives navigation)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("tc_checkout_form");
      if (saved) {
        const f = JSON.parse(saved) as Record<string, string>;
        if (f.name) setName(f.name);
        if (f.email) setEmail(f.email);
        if (f.company) setCompany(f.company);
        if (f.phone) setPhone(f.phone);
        if (f.address) setAddress(f.address);
        if (f.notes) setNotes(f.notes);
      }
    } catch { /* ignore */ }
  }, []);

  // Save form fields to sessionStorage on change
  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(
        "tc_checkout_form",
        JSON.stringify({ name, email, company, phone, address, notes })
      );
    } catch { /* quota exceeded — ignore */ }
  }, [name, email, company, phone, address, notes, mounted]);

  useEffect(() => {
    setItems(getCart());
    setMounted(true);

    // Check if user is already logged in — pre-fill their saved profile
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return;
      setIsLoggedIn(true);
      setAccessToken(session.access_token);
      try {
        const res = await fetch("/api/account/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const p = (await res.json()) as {
          name?: string;
          email?: string;
          company?: string;
          companies?: string[];
          phone?: string;
          address?: string;
        };
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
        if (p.phone) setPhone(p.phone);
        if (p.address) setAddress(p.address);
        if (p.company) setCompany(p.company);
        const companies = p.companies ?? [];
        // Ensure the last-used company is always in the selector list
        const allCompanies =
          p.company && !companies.includes(p.company)
            ? [p.company, ...companies]
            : companies;
        setSavedCompanies(allCompanies);
      } catch {
        // Non-fatal — continue without pre-fill
      }
    });
  }, []);

  if (!mounted)
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">
          <Skeleton className="h-9 w-48 mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );

  const subtotal = items.reduce((s, i) => s + i.sell_price, 0);
  const rush = isRush ? RUSH_FEE : 0;
  const gstRate = items[0]?.gst_rate ?? DEFAULT_GST_RATE;
  const gst = Math.round((subtotal + rush) * gstRate * 100) / 100;
  const total = subtotal + rush + gst;

  async function handleSubmit() {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (createAccount) {
      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }
    setLoading(true);
    try {
      // Upload artwork files one-by-one via server-side API (bypasses storage RLS)
      const filePaths: string[] = [];
      if (artworkFiles.length > 0) {
        for (let i = 0; i < artworkFiles.length; i++) {
          setUploadProgress(`Uploading file ${i + 1} of ${artworkFiles.length}…`);
          try {
            const form = new FormData();
            form.append("file", artworkFiles[i]);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
            if (uploadRes.ok) {
              const { path } = (await uploadRes.json()) as { path: string };
              filePaths.push(path);
            } else {
              const { error: uploadErr } = (await uploadRes.json()) as { error?: string };
              console.warn("[checkout] upload failed:", uploadErr);
            }
          } catch (uploadErr) {
            console.warn("[checkout] file upload exception:", uploadErr);
          }
        }
        setUploadProgress("");
      }

      const body: CreateOrderRequest = {
        items,
        contact: {
          name,
          email,
          company: company || undefined,
          phone: phone || undefined,
          address: address || undefined,
        },
        is_rush: isRush,
        payment_method: payMethod,
        notes: notes.trim() || undefined,
        file_storage_paths: filePaths.length > 0 ? filePaths : undefined,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        orderId?: string;
        orderNumber?: string;
        checkoutUrl?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create order");

      // If logged in, save the used company to their profile (non-fatal)
      if (isLoggedIn && accessToken && company.trim()) {
        void fetch("/api/account/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ company: company.trim() }),
        }).catch(() => {});
      }

      // Create Supabase account if requested (client-side, non-fatal)
      if (createAccount) {
        try {
          const supabase = createClient();
          const { error: signUpErr } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                name: name.trim(),
                company: company.trim() || undefined,
              },
            },
          });
          if (signUpErr) {
            console.warn("[checkout] account signup (non-fatal):", signUpErr.message);
          }
        } catch (signUpEx) {
          console.warn("[checkout] account signup exception (non-fatal):", signUpEx);
        }
      }

      clearCart();
      try { sessionStorage.removeItem("tc_checkout_form"); } catch { /* ignore */ }
      if (payMethod === "clover_card" && data.checkoutUrl) {
        // Card: redirect to Clover hosted checkout (it bounces back to /order-confirmed?oid=...)
        window.location.href = data.checkoutUrl;
      } else {
        // eTransfer: skip Clover — go straight to confirmation with eTransfer instructions
        window.location.href = `/order-confirmed?oid=${data.orderId ?? ""}`;
      }
    } catch (err) {
      setUploadProgress("");
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-400 text-lg mb-6">Your cart is empty.</p>
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get a Price →
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Company field: dropdown picker for 2+ saved companies, plain input otherwise
  const companyField =
    isLoggedIn && savedCompanies.length >= 2 ? (
      <div className="space-y-2">
        <select
          value={showCompanyInput ? "__other__" : company || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__other__") {
              setShowCompanyInput(true);
              setCompany("");
            } else {
              setShowCompanyInput(false);
              setCompany(val);
            }
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
        >
          <option value="">No company</option>
          {savedCompanies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__other__">+ Other company…</option>
        </select>
        {showCompanyInput && (
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
            placeholder="Enter company name"
            autoFocus
          />
        )}
      </div>
    ) : (
      <input
        id="company"
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
        placeholder="ABC Realty"
      />
    );

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left — Contact + Notes + Artwork + Payment ── */}
          <div className="space-y-8">

            {/* Contact */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-4">Your info</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="name">
                      Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                      onBlur={() => {
                        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          setEmailError("Please enter a valid email address.");
                        } else {
                          setEmailError("");
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] ${emailError ? "border-red-300" : "border-gray-200"}`}
                      placeholder="jane@example.com"
                      required
                    />
                    {emailError && (
                      <p className="text-sm text-red-600 mt-1">{emailError}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="company">
                      Company{isLoggedIn && savedCompanies.length >= 2 ? " (saved)" : " (optional)"}
                    </label>
                    {companyField}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="phone">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="(306) 555-0100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="address">
                    Address (optional — used for invoicing)
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder="123 Main St, Saskatoon, SK S7K 0A1"
                  />
                </div>
              </div>
            </section>

            {/* Account section: logged-in banner OR create-account checkbox */}
            {isLoggedIn ? (
              <section className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1c1712]">{email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your info is pre-filled. Edit any field to update.
                  </p>
                </div>
                <Link
                  href="/account"
                  className="text-xs text-[#16C2F3] font-semibold hover:underline shrink-0"
                >
                  My orders →
                </Link>
              </section>
            ) : (
              <section className="border border-gray-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#16C2F3] shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                      Save my info &amp; create a free account
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sign in anytime to track orders, reorder, and pay later.
                    </p>
                  </div>
                </label>

                {createAccount && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="password">
                        Password *
                      </label>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[26px] text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="confirmPassword">
                        Confirm password *
                      </label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] ${
                          confirmPassword && password !== confirmPassword
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Repeat password"
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">Passwords don&apos;t match.</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Already have an account?{" "}
                      <Link href="/account" className="text-[#16C2F3] hover:underline">
                        Sign in at /account
                      </Link>
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Order notes */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-3">Notes for your order</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. 2 signs with logo on left, 1 with logo right. Or: picking up Tuesday AM."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] resize-none"
              />
            </section>

            {/* Artwork files — multi-file */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-3">Attach your artwork</h2>
              {/* Hidden file input — triggered by clicking the drop zone */}
              <input
                ref={artworkInputRef}
                type="file"
                multiple
                accept=".pdf,.ai,.eps,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const MAX = 50 * 1024 * 1024;
                  const files = Array.from(e.target.files ?? []);
                  const valid = files.filter((f) => f.size <= MAX);
                  const oversized = files.filter((f) => f.size > MAX);
                  if (oversized.length > 0) setError(`File too large: ${oversized.map((f) => f.name).join(", ")} — max 50 MB each.`);
                  if (valid.length > 0) setArtworkFiles((prev) => [...prev, ...valid]);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#16C2F3] transition-colors cursor-pointer"
                onClick={() => artworkInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-blue-400", "bg-blue-50"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-blue-400", "bg-blue-50"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
                  const MAX = 50 * 1024 * 1024;
                  const dropped = Array.from(e.dataTransfer.files);
                  const valid = dropped.filter((f) => f.size <= MAX);
                  const oversized = dropped.filter((f) => f.size > MAX);
                  if (oversized.length > 0) setError(`File too large: ${oversized.map((f) => f.name).join(", ")} — max 50 MB each.`);
                  if (valid.length > 0) setArtworkFiles((prev) => [...prev, ...valid]);
                }}
              >
                {artworkFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    {artworkFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <p className="font-medium text-[#1c1712] text-sm truncate max-w-[200px]">📎 {f.name}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setArtworkFiles((prev) => prev.filter((_, idx) => idx !== i)); }}
                            className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold leading-none"
                            aria-label={`Remove ${f.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-[#16C2F3] mt-2">Click or drop to add more files</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Drop your files here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, AI, EPS, JPG, PNG — up to 50 MB each · Select multiple files at once</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                No file yet? Bring it on USB or email us after — our designer starts at $35.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                For the best results, you can also email high-quality artwork directly to{" "}
                <a href="mailto:info@true-color.ca" className="text-[#16C2F3] hover:underline">
                  info@true-color.ca
                </a>
              </p>
            </section>

            {/* Rush toggle */}
            <section>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isRush}
                  onChange={(e) => setIsRush(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#16C2F3]"
                />
                <div>
                  <p className="font-semibold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                    Rush my order — +$40
                  </p>
                  <p className="text-sm text-gray-500">
                    Ready the same day if ordered before 10 AM. Call to confirm.
                  </p>
                </div>
              </label>
            </section>

            {/* Payment method */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-4">Payment</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#16C2F3] transition-colors has-[:checked]:border-[#16C2F3] has-[:checked]:bg-[#f0fbff]">
                  <input
                    type="radio"
                    name="pay"
                    value="clover_card"
                    checked={payMethod === "clover_card"}
                    onChange={() => setPayMethod("clover_card")}
                    className="accent-[#16C2F3]"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#1c1712]">Pay by card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, Amex — secure Clover checkout</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#16C2F3] transition-colors has-[:checked]:border-[#16C2F3] has-[:checked]:bg-[#f0fbff]">
                  <input
                    type="radio"
                    name="pay"
                    value="etransfer"
                    checked={payMethod === "etransfer"}
                    onChange={() => setPayMethod("etransfer")}
                    className="accent-[#16C2F3]"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#1c1712]">Interac e-Transfer</p>
                    <p className="text-xs text-gray-500">Send to info@true-color.ca — auto-deposit enabled</p>
                  </div>
                </label>
              </div>

              {payMethod === "etransfer" && (
                <div className="mt-4 bg-[#f4efe9] rounded-xl p-5 text-sm space-y-2">
                  <p className="font-bold text-[#1c1712]">Send e-Transfer to:</p>
                  <p className="text-gray-700">
                    <span className="font-mono">info@true-color.ca</span>
                  </p>
                  <p className="text-gray-700">
                    Amount: <span className="font-bold">${total.toFixed(2)}</span>
                  </p>
                  <p className="text-gray-700">Reference: your name + order details</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Auto-deposit is enabled — no security question needed. We&apos;ll confirm by email within 1 business day.
                  </p>
                </div>
              )}
            </section>

            {/* Upload progress */}
            {uploadProgress && (
              <p className="text-sm text-[#16C2F3] font-medium animate-pulse">{uploadProgress}</p>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-red-600 font-semibold text-sm mb-0.5">Something went wrong</p>
                <p className="text-red-500 text-sm">{error}</p>
                <p className="text-red-400 text-xs mt-2">
                  Need help? Call{" "}
                  <a href="tel:+13069548688" className="underline font-medium">(306) 954-8688</a>
                  {" "}or email{" "}
                  <a href="mailto:info@true-color.ca" className="underline font-medium">info@true-color.ca</a>
                </p>
              </div>
            )}

            {/* Clover redirect note */}
            {payMethod === "clover_card" && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <span aria-hidden="true">🔒</span>
                You&apos;ll be redirected to Clover&apos;s secure checkout to complete payment.
              </p>
            )}

            {/* Submit */}
            {payMethod === "clover_card" ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors"
              >
                {loading
                  ? uploadProgress || "Creating order…"
                  : `Pay $${total.toFixed(2)} →`}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors"
              >
                {loading
                  ? uploadProgress || "Submitting order…"
                  : `Submit order — pay $${total.toFixed(2)} by e-Transfer`}
              </button>
            )}
            {payMethod === "etransfer" && !loading && (
              <div className="text-center py-0 border border-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  After submitting, send your e-Transfer, then{" "}
                  <a href="mailto:info@true-color.ca" className="text-[#16C2F3] underline">
                    email us
                  </a>{" "}
                  your order details.
                </p>
                <p className="text-xs text-gray-400 mt-1">We&apos;ll confirm and start production within 1 business day.</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Need help? Call{" "}
              <a href="tel:+13069548688" className="underline">
                (306) 954-8688
              </a>
            </p>
          </div>

          {/* ── Right — Order Summary ── */}
          <div>
            <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1c1712] mb-5">Order summary</h2>

              <div className="space-y-5 mb-5">
                {items.map((item) => {
                  const wIn = item.config.width_in;
                  const hIn = item.config.height_in;
                  const hasDims = wIn != null && hIn != null && wIn > 0 && hIn > 0;
                  return (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1c1712]">{item.product_name}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.label}</p>

                        {/* Proportional sign preview — shown for items with dimensions */}
                        {hasDims && (
                          <div className="mt-2 bg-white rounded-lg border border-gray-100 p-2 inline-block">
                            <SignPreview widthIn={wIn!} heightIn={hIn!} />
                          </div>
                        )}

                        {/* Addon sub-rows from engine line_items */}
                        {item.line_items && item.line_items.length > 1 && (
                          <div className="mt-1.5 space-y-0.5">
                            {item.line_items.slice(1).map((li, i) => (
                              <p key={i} className="text-xs text-gray-400 pl-2 border-l-2 border-gray-200">
                                {li.description}: ${li.line_total.toFixed(2)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#1c1712] shrink-0">
                        ${item.sell_price.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {isRush && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Rush fee</span>
                    <span>${RUSH_FEE.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (5%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#1c1712] text-base pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)} CAD</span>
                </div>
              </div>

              <div className="mt-5 text-xs text-gray-400 space-y-1">
                <p>📍 Pickup: 216 33rd St W, Saskatoon</p>
                <p>📞 Questions: (306) 954-8688</p>
              </div>

              <Link
                href="/cart"
                className="block text-center text-xs text-gray-400 hover:text-[#16C2F3] mt-4 transition-colors"
              >
                ← Edit cart
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
