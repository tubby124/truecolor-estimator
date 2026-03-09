"use client";

/**
 * StaffOrdersActions
 *
 * Client component that renders the staff orders page header action buttons:
 * ← Website | Request Payment | Social Studio | Make a Quote
 *
 * Also owns the "Request Payment" modal — a form for staff to create a manual
 * payment request, generate a payment link, and email it to the customer.
 */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useToast, ToastContainer } from "@/components/ui/Toast";

interface FormState {
  // Customer
  name: string;
  email: string;
  company: string;
  phone: string;
  // Order
  description: string;
  amount: string;
  payment_method: "clover" | "wave";
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "", email: "", company: "", phone: "",
  description: "", amount: "", payment_method: "clover", notes: "",
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function StaffOrdersActions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; email: string } | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const gst = form.amount ? Math.round(parseFloat(form.amount) * 0.05 * 100) / 100 : 0;
  const pst = form.amount ? Math.round(parseFloat(form.amount) * 0.06 * 100) / 100 : 0;
  const total = form.amount ? Math.round((parseFloat(form.amount) + gst + pst) * 100) / 100 : 0;
  const amountValid = form.amount !== "" && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0;

  function openModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    // Small delay so animation completes before resetting
    setTimeout(() => { setSuccess(null); setError(null); }, 300);
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Basic client-side validation
    if (!form.name.trim()) { setError("Customer name is required"); return; }
    if (!form.email.trim()) { setError("Customer email is required"); return; }
    if (!form.description.trim()) { setError("Order description is required"); return; }
    if (!amountValid) { setError("Enter a valid amount greater than $0"); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/manual-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: form.name.trim(),
            email: form.email.trim(),
            company: form.company.trim() || undefined,
            phone: form.phone.trim() || undefined,
          },
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          payment_method: form.payment_method,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json() as { orderId?: string; orderNumber?: string; paymentUrl?: string | null; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess({ orderNumber: data.orderNumber!, email: form.email.trim() });
      showToast(`Payment request sent to ${form.email.trim()}`, "success");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Header buttons ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/"
          className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
          aria-label="Back to website"
        >
          ← Website
        </Link>

        {/* Request Payment */}
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Send a manual payment request to a customer"
        >
          {/* Credit card icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span>Request Payment</span>
        </button>

        {/* Coupons */}
        <Link
          href="/staff/coupons"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Manage discount codes"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span>Coupons</span>
        </Link>

        {/* Social Studio */}
        <Link
          href="/staff/social"
          className="inline-flex items-center gap-1.5 bg-[#0f1117] hover:bg-black text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Open Social Studio"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span>Social Studio</span>
        </Link>

        {/* Make a Quote */}
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Open staff estimator to create a new quote"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Make a Quote</span>
        </Link>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />

            {/* Panel */}
            <motion.div
              key="modal"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-[#1c1712]">Send Payment Request</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Creates an order and emails the customer a payment link</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Success state */}
                {success ? (
                  <div className="px-6 py-10 text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1c1712] mb-2">Payment request sent!</h3>
                    <p className="text-sm text-gray-500 mb-1">
                      Email sent to <span className="font-semibold text-gray-700">{success.email}</span>
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                      Order <span className="font-mono font-bold text-gray-600">{success.orderNumber}</span> created — now visible in the orders list below.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => { setForm(EMPTY_FORM); setSuccess(null); setError(null); }}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Send Another
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-5 py-2.5 rounded-lg bg-[#1c1712] text-white text-sm font-semibold hover:bg-black transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-5">

                    {/* ── CUSTOMER ── */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            placeholder="John Smith"
                            required
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="john@company.com"
                            required
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                          <input
                            type="text"
                            value={form.company}
                            onChange={(e) => set("company", e.target.value)}
                            placeholder="Acme Corp (optional)"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="(306) 555-1234 (optional)"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── ORDER ── */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="e.g. 500 Postcards 5×7 two-sided"
                            required
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>

                        {/* Amount + GST + PST + Total row */}
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                              Amount (pre-tax) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="99999"
                                value={form.amount}
                                onChange={(e) => set("amount", e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST (5%)</label>
                            <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
                              {amountValid ? `$${gst.toFixed(2)}` : "—"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">PST (6%)</label>
                            <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
                              {amountValid ? `$${pst.toFixed(2)}` : "—"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total</label>
                            <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-700 tabular-nums">
                              {amountValid ? `$${total.toFixed(2)}` : "—"}
                            </div>
                          </div>
                        </div>

                        {/* Payment method */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-2">Payment Method</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["clover", "wave"] as const).map((method) => (
                              <label
                                key={method}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  form.payment_method === method
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="payment_method"
                                  value={method}
                                  checked={form.payment_method === method}
                                  onChange={() => set("payment_method", method)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  form.payment_method === method ? "border-emerald-500" : "border-gray-300"
                                }`}>
                                  {form.payment_method === method && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {method === "clover" ? "Clover Card" : "Wave Invoice"}
                                  </p>
                                  <p className="text-[10px] text-gray-400 leading-tight">
                                    {method === "clover" ? "Customer pays by card online" : "Wave hosted invoice + PDF"}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                          <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Any notes for the customer or staff..."
                            maxLength={500}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                        {error}
                      </div>
                    )}

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !amountValid}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                      >
                        {loading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          <>
                            Send Request
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast container (handles success/error toast notifications) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
