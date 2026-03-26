"use client";

/**
 * StaffOrdersActions
 *
 * Client component that renders the staff orders page header action buttons:
 * ← Website | Request Payment | Social Studio | Make a Quote
 *
 * Also owns the "Request Payment" modal — a form for staff to create a manual
 * payment request, generate a payment link, and email it to the customer.
 * Supports multi-item orders (up to 5 line items).
 */

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { PRODUCT_OPTIONS } from "@/lib/constants/products";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerLookup {
  status: "idle" | "loading" | "found" | "new";
  name?: string;
  company?: string | null;
  phone?: string | null;
  orderCount?: number;
}

interface PastOrderItem {
  id: string;
  product_name: string;
  qty: number;
  line_total: number;
  category: string;
}

interface PastOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  subtotal: number;
  total: number;
  is_rush: boolean;
  order_items: PastOrderItem[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchProduct(productName: string): string {
  const lower = productName.toLowerCase();
  return PRODUCT_OPTIONS.find((opt) => lower.includes(opt.toLowerCase())) ?? "Other";
}

function extractDetails(productName: string): string {
  const idx = productName.indexOf(" \u2014 ");
  return idx >= 0 ? productName.slice(idx + 3).trim() : "";
}

interface OrderItem {
  id: string;
  product: string;
  qty: string;
  details: string;
  amount: string;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  phone: string;
  items: OrderItem[];
  payment_method: "clover" | "wave";
  notes: string;
}

function makeItem(): OrderItem {
  return { id: crypto.randomUUID(), product: "", qty: "1", details: "", amount: "" };
}

const EMPTY_FORM: FormState = {
  name: "", email: "", company: "", phone: "",
  items: [makeItem()],
  payment_method: "clover", notes: "",
};

const MAX_ITEMS = 5;

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";

// ─── Component ──────────────────────────────────────────────────────────────────

export function StaffOrdersActions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; email: string } | null>(null);
  const [customerLookup, setCustomerLookup] = useState<CustomerLookup>({ status: "idle" });
  const [pastOrdersOpen, setPastOrdersOpen] = useState(false);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [pastOrdersLoading, setPastOrdersLoading] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const handleEmailBlur = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setCustomerLookup({ status: "idle" });
      return;
    }
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    lookupTimerRef.current = setTimeout(async () => {
      setCustomerLookup({ status: "loading" });
      try {
        const res = await fetch(`/api/staff/customer-lookup?email=${encodeURIComponent(trimmed)}`);
        if (!res.ok) { setCustomerLookup({ status: "idle" }); return; }
        const data = await res.json() as { exists: boolean; name?: string; company?: string | null; phone?: string | null; orderCount?: number };
        if (data.exists) {
          setCustomerLookup({ status: "found", name: data.name, company: data.company, phone: data.phone, orderCount: data.orderCount ?? 0 });
          // Autofill empty fields
          setForm((prev) => ({
            ...prev,
            name: prev.name.trim() ? prev.name : (data.name ?? prev.name),
            company: prev.company.trim() ? prev.company : (data.company ?? prev.company),
            phone: prev.phone.trim() ? prev.phone : (data.phone ?? prev.phone),
          }));
        } else {
          setCustomerLookup({ status: "new" });
        }
      } catch {
        setCustomerLookup({ status: "idle" });
      }
    }, 400);
  }, []);

  const fetchPastOrders = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setPastOrdersLoading(true);
    try {
      const res = await fetch(`/api/staff/customer-orders?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json() as { orders: PastOrder[] };
      setPastOrders(data.orders);
      setPastOrdersOpen(true);
    } catch {
      // silent
    } finally {
      setPastOrdersLoading(false);
    }
  }, []);

  // ── Derived totals ──
  const itemSubtotals = form.items.map((it) => {
    const amt = parseFloat(it.amount);
    return !isNaN(amt) && amt > 0 ? amt : 0;
  });
  const subtotal = Math.round(itemSubtotals.reduce((s, a) => s + a, 0) * 100) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const pst = Math.round(subtotal * 0.06 * 100) / 100;
  const total = Math.round((subtotal + gst + pst) * 100) / 100;
  const hasValidAmount = subtotal > 0;
  const allItemsValid = form.items.every((it) => {
    const amt = parseFloat(it.amount);
    return it.product.trim() !== "" && !isNaN(amt) && amt > 0;
  });

  function openModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setCustomerLookup({ status: "idle" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setPastOrdersOpen(false);
    setPastOrders([]);
    setTimeout(() => { setSuccess(null); setError(null); }, 300);
  }

  function set(field: keyof Omit<FormState, "items">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  function setItem(id: string, field: keyof OrderItem, value: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => it.id === id ? { ...it, [field]: value } : it),
    }));
    if (error) setError(null);
  }

  function addItem() {
    if (form.items.length >= MAX_ITEMS) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, makeItem()] }));
  }

  function removeItem(id: string) {
    if (form.items.length <= 1) return;
    setForm((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
  }

  function handleReorder(order: PastOrder) {
    if (!order.order_items || order.order_items.length === 0) return;
    const reorderItems: OrderItem[] = order.order_items.slice(0, MAX_ITEMS).map((oi) => ({
      id: crypto.randomUUID(),
      product: matchProduct(oi.product_name),
      qty: String(oi.qty),
      details: extractDetails(oi.product_name),
      amount: String(oi.line_total),
    }));
    setForm((prev) => ({ ...prev, items: reorderItems }));
    setPastOrdersOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!form.name.trim()) { setError("Customer name is required"); return; }
    if (!form.email.trim()) { setError("Customer email is required"); return; }
    if (!allItemsValid) { setError("Each item needs a product and amount greater than $0"); return; }

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
          items: form.items.map((it) => ({
            product: it.product.trim(),
            qty: parseInt(it.qty) || 1,
            details: it.details.trim() || undefined,
            amount: parseFloat(it.amount),
          })),
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

        <Link
          href="/staff/quotes"
          className="inline-flex items-center gap-1.5 bg-[#16C2F3] hover:bg-[#0fa8d6] text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="View incoming quote requests"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <span>Quotes</span>
        </Link>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Send a manual payment request to a customer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span>Request Payment</span>
        </button>

        <Link
          href="/staff/coupons"
          className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Manage discount codes"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span>Coupons</span>
        </Link>

        <Link
          href="/staff/social"
          className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Open Social Studio"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span>Social Studio</span>
        </Link>

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
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />

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
                        onClick={() => { setForm({ ...EMPTY_FORM, items: [makeItem()] }); setSuccess(null); setError(null); }}
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
                      <div className="space-y-3">
                        {/* Email — first so lookup fires immediately */}
                        <div>
                          <label htmlFor="pr-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="pr-email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => { set("email", e.target.value); setCustomerLookup({ status: "idle" }); }}
                            onBlur={(e) => void handleEmailBlur(e.target.value)}
                            placeholder="john@company.com"
                            required
                            className={inputClass}
                          />
                          {/* Customer lookup badge */}
                          {customerLookup.status === "loading" && (
                            <p className="mt-1.5 text-[11px] text-gray-400 font-medium">Looking up customer...</p>
                          )}
                          {customerLookup.status === "found" && (
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Returning customer
                                {customerLookup.name && <span className="text-emerald-600 font-normal">· {customerLookup.name}</span>}
                                {customerLookup.company && <span className="text-emerald-600 font-normal">· {customerLookup.company}</span>}
                                <span className="text-emerald-500 font-normal">· {customerLookup.orderCount} order{customerLookup.orderCount !== 1 ? "s" : ""}</span>
                              </span>
                              {(customerLookup.orderCount ?? 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => void fetchPastOrders(form.email)}
                                  disabled={pastOrdersLoading}
                                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors disabled:opacity-50"
                                >
                                  {pastOrdersLoading ? "Loading..." : "View past orders"}
                                </button>
                              )}
                            </div>
                          )}
                          {customerLookup.status === "new" && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                              New customer — account will be created automatically
                            </div>
                          )}
                        </div>
                        {/* Name | Company row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="pr-name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="pr-name"
                              type="text"
                              autoComplete="name"
                              value={form.name}
                              onChange={(e) => set("name", e.target.value)}
                              placeholder="John Smith"
                              required
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="pr-company" className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                            <input
                              id="pr-company"
                              type="text"
                              autoComplete="organization"
                              value={form.company}
                              onChange={(e) => set("company", e.target.value)}
                              placeholder="Acme Corp (optional)"
                              className={inputClass}
                            />
                          </div>
                        </div>
                        {/* Phone */}
                        <div>
                          <label htmlFor="pr-phone" className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                          <input
                            id="pr-phone"
                            type="tel"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="(306) 555-1234 (optional)"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── ORDER ITEMS ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Items</p>
                        <span className="text-[10px] font-semibold text-gray-300 tabular-nums">{form.items.length} / {MAX_ITEMS}</span>
                      </div>

                      <div className="space-y-3">
                        <AnimatePresence initial={false}>
                          {form.items.map((item, idx) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.15 }}
                              className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2.5"
                            >
                              {/* Item header */}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Item {idx + 1}
                                  {item.product && <span className="text-gray-300 font-normal ml-1.5 normal-case tracking-normal">{item.product}</span>}
                                </span>
                                {form.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 font-semibold transition-colors min-h-[28px] px-1.5"
                                    aria-label={`Remove item ${idx + 1}`}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              {/* Product + Qty row */}
                              <div className="grid grid-cols-[1fr_80px] gap-2">
                                <div>
                                  <label htmlFor={`pr-product-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                    Product <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    id={`pr-product-${item.id}`}
                                    value={item.product}
                                    onChange={(e) => setItem(item.id, "product", e.target.value)}
                                    className={`${inputClass} ${!item.product ? "text-gray-400" : ""}`}
                                  >
                                    <option value="">Select product...</option>
                                    {PRODUCT_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                  {item.product && !item.details.trim() && (
                                    <p className="mt-1 text-[9px] text-amber-500 font-semibold">Add size &amp; specs below for production</p>
                                  )}
                                </div>
                                <div>
                                  <label htmlFor={`pr-qty-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                    Qty
                                  </label>
                                  <input
                                    id={`pr-qty-${item.id}`}
                                    type="number"
                                    min="1"
                                    max="99999"
                                    value={item.qty}
                                    onChange={(e) => setItem(item.id, "qty", e.target.value)}
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              {/* Details + Amount row */}
                              <div className="grid grid-cols-[1fr_110px] gap-2">
                                <div>
                                  <label htmlFor={`pr-details-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                    Size &amp; Details
                                  </label>
                                  <input
                                    id={`pr-details-${item.id}`}
                                    type="text"
                                    value={item.details}
                                    onChange={(e) => setItem(item.id, "details", e.target.value)}
                                    placeholder="e.g. 24×36in, double-sided, H-stakes"
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`pr-amount-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                    Amount <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                                    <input
                                      id={`pr-amount-${item.id}`}
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      max="99999"
                                      value={item.amount}
                                      onChange={(e) => setItem(item.id, "amount", e.target.value)}
                                      placeholder="0.00"
                                      className={`${inputClass} pl-7`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Add Item button */}
                        {form.items.length < MAX_ITEMS && (
                          <button
                            type="button"
                            onClick={addItem}
                            className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            + Add Item
                          </button>
                        )}
                      </div>

                      {/* Totals row */}
                      <div className="grid grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-1">Subtotal</p>
                          <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
                            {hasValidAmount ? `$${subtotal.toFixed(2)}` : "—"}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-1">GST (5%)</p>
                          <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
                            {hasValidAmount ? `$${gst.toFixed(2)}` : "—"}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-1">PST (6%)</p>
                          <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
                            {hasValidAmount ? `$${pst.toFixed(2)}` : "—"}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-1">Total</p>
                          <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-700 tabular-nums">
                            {hasValidAmount ? `$${total.toFixed(2)}` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── PAYMENT METHOD ── */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Payment Method</p>
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
                                {method === "clover" ? "Pay by Card" : "Send Invoice"}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-tight">
                                {method === "clover"
                                  ? "Customer gets a link to pay by credit or debit card"
                                  : "Customer gets an invoice email — pay online or e-transfer"}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="pr-notes" className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                      <input
                        id="pr-notes"
                        type="text"
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Any notes for the customer or staff..."
                        maxLength={500}
                        className={inputClass}
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium" role="alert">
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
                        disabled={loading || !hasValidAmount || !allItemsValid}
                        aria-busy={loading}
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

      {/* ── Past Orders Modal ── */}
      <AnimatePresence>
        {pastOrdersOpen && (
          <>
            <motion.div
              key="past-orders-backdrop"
              className="fixed inset-0 bg-black/50 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPastOrdersOpen(false)}
            />
            <motion.div
              key="past-orders-modal"
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                  <div>
                    <h2 className="text-lg font-bold text-[#1c1712]">Past Orders</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {customerLookup.name ?? form.email} — {pastOrders.length} order{pastOrders.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPastOrdersOpen(false)}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close past orders"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Orders list */}
                <div className="px-6 py-4 space-y-4">
                  {pastOrders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No past orders found</p>
                  ) : (
                    pastOrders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                        {/* Order header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1c1712] font-mono">{order.order_number}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                            {order.is_rush && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Rush</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {new Date(order.created_at).toLocaleDateString("en-CA")}
                          </span>
                        </div>

                        {/* Items */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.qty > 1 ? `${item.qty}x ` : ""}{item.product_name}
                                </span>
                                <span className="text-gray-500 tabular-nums font-medium ml-2">
                                  ${item.line_total.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm font-bold text-[#1c1712] tabular-nums">
                            Total: ${order.total.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                            Reorder
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
