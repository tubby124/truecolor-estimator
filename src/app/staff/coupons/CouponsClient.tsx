"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  discount_amount: number;
  description: string | null;
  is_active: boolean;
  requires_account: boolean;
  per_account_limit: number;
  max_uses: number | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  redemption_count: number;
}

interface Redemption {
  id: string;
  amount_saved: number;
  redeemed_at: string;
  customers: { name: string; email: string } | null;
  orders: { order_number: string } | null;
}

export function CouponsClient() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "custom",
    discount_amount: "",
    description: "",
    per_account_limit: "1",
    max_uses: "",
    expires_at: "",
  });

  // Redemption log expansion
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, Redemption[]>>({});
  const [redemptionLoading, setRedemptionLoading] = useState<string | null>(null);

  // Welcome code setup
  const [welcomeSetupLoading, setWelcomeSetupLoading] = useState(false);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    void loadCodes();
  }, []);

  async function loadCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/staff/coupons");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { codes: DiscountCode[] };
      setCodes(data.codes);
    } catch {
      setError("Could not load discount codes.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, newActive: boolean) {
    const res = await fetch(`/api/staff/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: newActive } : c)));
    }
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!form.code.trim() || !form.discount_amount) {
      setCreateError("Code and amount are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/staff/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          discount_amount: parseFloat(form.discount_amount),
          description: form.description.trim() || undefined,
          per_account_limit: parseInt(form.per_account_limit) || 1,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = (await res.json()) as { code?: DiscountCode; error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create code.");
      } else if (data.code) {
        setCodes((prev) => [data.code!, ...prev]);
        setShowCreate(false);
        setForm({ code: "", type: "custom", discount_amount: "", description: "", per_account_limit: "1", max_uses: "", expires_at: "" });
      }
    } catch {
      setCreateError("Could not create code.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function loadRedemptions(codeId: string) {
    if (redemptions[codeId]) {
      setExpandedId(expandedId === codeId ? null : codeId);
      return;
    }
    setRedemptionLoading(codeId);
    try {
      const res = await fetch(`/api/staff/coupons/${codeId}/redemptions`);
      const data = (await res.json()) as { redemptions: Redemption[] };
      setRedemptions((prev) => ({ ...prev, [codeId]: data.redemptions }));
      setExpandedId(codeId);
    } catch {
      // Non-fatal
    } finally {
      setRedemptionLoading(null);
    }
  }

  async function createWelcomeCode() {
    setWelcomeSetupLoading(true);
    try {
      const res = await fetch("/api/staff/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "WELCOME10",
          type: "custom",
          discount_amount: 10,
          description: "$10 off first order — new customer welcome discount",
          per_account_limit: 1,
          max_uses: null,
          expires_at: null,
        }),
      });
      const data = (await res.json()) as { code?: DiscountCode; error?: string };
      if (data.code) {
        setCodes((prev) => [data.code!, ...prev]);
      }
    } catch {
      // Non-fatal
    } finally {
      setWelcomeSetupLoading(false);
    }
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    });
  }

  const reviewCode = codes.find((c) => c.code === "REVIEW10");
  const welcomeCode = codes.find((c) => c.code === "WELCOME10");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/staff/orders" className="text-sm text-gray-400 hover:text-[#16C2F3] transition-colors">
              ← Orders
            </Link>
            <span className="text-gray-200">|</span>
            <h1 className="text-lg font-bold text-[#1c1712]">Discount Codes</h1>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + New Code
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Review Code Hero */}
        {reviewCode && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold font-mono text-amber-900 tracking-widest">{reviewCode.code}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {reviewCode.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-amber-800 font-medium">
                  ${Number(reviewCode.discount_amount).toFixed(2)} off — {reviewCode.description ?? "Google Review Reward"}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Used {reviewCode.redemption_count} time{reviewCode.redemption_count !== 1 ? "s" : ""} total · 1 use per account
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Share this code verbally or in reply emails when a customer shows you their Google review.
                </p>
              </div>
              <button
                onClick={() => copyCode(reviewCode.code)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                {copiedCode === reviewCode.code ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        )}

        {/* Welcome Code Hero */}
        {welcomeCode ? (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold font-mono text-sky-900 tracking-widest">{welcomeCode.code}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${welcomeCode.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {welcomeCode.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-sky-800 font-medium">
                  ${Number(welcomeCode.discount_amount).toFixed(2)} off — {welcomeCode.description ?? "New customer welcome discount"}
                </p>
                <p className="text-xs text-sky-600 mt-1">
                  Used {welcomeCode.redemption_count} time{welcomeCode.redemption_count !== 1 ? "s" : ""} total · 1 use per account
                </p>
                <p className="text-xs text-sky-600 mt-2">
                  Auto-applied at checkout for first-time customers. Shown in all signup confirmation emails.
                </p>
              </div>
              <button
                onClick={() => copyCode(welcomeCode.code)}
                className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                {copiedCode === welcomeCode.code ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 border-dashed rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold font-mono text-sky-900/40 tracking-widest">WELCOME10</span>
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">Not set up</span>
                </div>
                <p className="text-sm text-sky-800 font-medium">$10 off first order — new customer welcome code</p>
                <p className="text-xs text-sky-600 mt-1">Auto-applied at checkout. Sent in all signup confirmation emails.</p>
              </div>
              <button
                onClick={() => void createWelcomeCode()}
                disabled={welcomeSetupLoading}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                {welcomeSetupLoading ? "Creating…" : "Set Up WELCOME10"}
              </button>
            </div>
          </div>
        )}

        {/* Create Code Form */}
        {showCreate && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-[#1c1712] mb-4">Create New Code</h2>
            <form onSubmit={(e) => void createCode(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VIP20"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="review">Review</option>
                    <option value="vip">VIP</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount Amount ($) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.discount_amount}
                    onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))}
                    placeholder="10.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="VIP client discount — $20 off"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uses per account</label>
                  <input
                    type="number"
                    min="1"
                    value={form.per_account_limit}
                    onChange={(e) => setForm((f) => ({ ...f, per_account_limit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max total uses (blank = unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expires (optional)</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                  {createLoading ? "Creating…" : "Create Code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(""); }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Code List Table */}
        {loading ? (
          <div className="text-sm text-gray-400 py-6 text-center">Loading codes…</div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#1c1712]">All Codes</h2>
            {codes.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No codes yet.</p>
            ) : (
              codes.map((c) => (
                <div key={c.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white flex-wrap">
                    {/* Code info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-[#1c1712] tracking-wider text-sm">{c.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.type === "review" ? "bg-amber-100 text-amber-700" :
                            c.type === "vip" ? "bg-purple-100 text-purple-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {c.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"
                          }`}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ${Number(c.discount_amount).toFixed(2)} off
                          {c.description ? ` · ${c.description}` : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.redemption_count} used
                          {c.max_uses ? ` / ${c.max_uses} max` : " / unlimited"}
                          {" · "}{c.per_account_limit === 1 ? "1 use per account" : `${c.per_account_limit} uses/account`}
                          {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString("en-CA")}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {copiedCode === c.code ? "✓ Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => void toggleActive(c.id, !c.is_active)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          c.is_active
                            ? "bg-red-50 hover:bg-red-100 text-red-600"
                            : "bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => void loadRedemptions(c.id)}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {redemptionLoading === c.id ? "…" : expandedId === c.id ? "Hide log" : `${c.redemption_count > 0 ? `Log (${c.redemption_count})` : "Log"}`}
                      </button>
                    </div>
                  </div>

                  {/* Redemption log */}
                  {expandedId === c.id && redemptions[c.id] && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                      {redemptions[c.id].length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No redemptions yet.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Redemption history</p>
                          {redemptions[c.id].map((r) => (
                            <div key={r.id} className="flex items-center justify-between text-xs text-gray-600 py-1.5 border-b border-gray-100 last:border-0">
                              <div>
                                <span className="font-medium">{r.customers?.name ?? "Unknown"}</span>
                                <span className="text-gray-400"> · {r.customers?.email ?? ""}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 ml-4">
                                <span className="text-gray-400">{r.orders?.order_number ?? ""}</span>
                                <span className="text-green-600 font-medium">−${Number(r.amount_saved).toFixed(2)}</span>
                                <span className="text-gray-400">{new Date(r.redeemed_at).toLocaleDateString("en-CA")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
