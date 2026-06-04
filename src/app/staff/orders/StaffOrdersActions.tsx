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

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  FlyerPicker,
  useFlyerCatalog,
  type FlyerSelection,
} from "@/components/staff/FlyerPicker";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import {
  PRODUCT_OPTIONS,
  MATERIAL_CHIPS,
  SIDES_CHIPS,
  PROCESS_CHIPS,
  FEE_PRESETS,
} from "@/lib/constants/products";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";
import {
  applyPickedCustomer,
  classifyCustomerLookup,
  normalizeContactForSubmit,
  type SavedCustomerData,
} from "@/lib/staff/customer-identity";

// FlyerSku + the FlyerPicker now live in src/components/staff/FlyerPicker.tsx —
// the single flyer selector shared by this modal and the /staff estimator.

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerLookup {
  status: "idle" | "loading" | "found" | "new" | "offer";
  name?: string;
  company?: string | null;
  phone?: string | null;
  orderCount?: number;
  // When status === "offer": saved values that diverge from what staff typed.
  // The form keeps the typed values; banner offers an explicit "Use saved" override.
  saved?: SavedCustomerData;
  conflicts?: Array<"name" | "company" | "phone">;
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

/**
 * Parse a stored product_name string back into structured spec fields, so
 * "Reorder" from a past customer's order fills the new Material/Sides/Size/Process
 * chips correctly.
 *
 * Input shape (from formatItemLabel in the manual-order route):
 *   "{qty}x {title} ({product}) — {material}, {sides}, {size}, {process}, {details}"
 *   or
 *   "{qty}x {product} — {material}, {sides}, {size}, {process}"
 *
 * Best-effort heuristic — maps each comma-separated chunk to whichever spec
 * field it most plausibly belongs to (material/sides/size/process). Anything
 * we can't classify falls through to `details`. Old orders that predate the
 * spec-field upgrade will degrade gracefully — fields stay empty, the email
 * falls back to the legacy 1-line render.
 */
function parseProductNameToSpec(productName: string): {
  title: string;
  product: string;
  material: string;
  sides: string;
  size: string;
  process: string;
  details: string;
} {
  const result = { title: "", product: "", material: "", sides: "", size: "", process: "", details: "" };
  if (!productName) return result;

  // Split off the spec portion (after " — ")
  const dashIdx = productName.indexOf(" \u2014 ");
  const namePart = dashIdx >= 0 ? productName.slice(0, dashIdx).trim() : productName.trim();
  const specPart = dashIdx >= 0 ? productName.slice(dashIdx + 3).trim() : "";

  // namePart shape: "Nx Title (Product)" OR "Nx Product"
  // Strip qty prefix
  const qtyStripped = namePart.replace(/^\d+x\s+/i, "").trim();

  // Look for trailing parenthesized product category: "Title (Product)"
  const parenMatch = qtyStripped.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    result.title = parenMatch[1].trim();
    result.product = parenMatch[2].trim();
  } else {
    result.product = qtyStripped;
  }

  if (!specPart) return result;

  // Classify each spec chunk by checking against the chip libraries
  const chunks = specPart.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  const sidesValues = new Set(SIDES_CHIPS.map((c) => c.value.toLowerCase()));
  const processWords = ["lamination", "die cut", "die-cut", "grommet", "h-stake", "pre-mask", "premask", "running number"];
  const unclassified: string[] = [];

  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();

    if (!result.material && MATERIAL_CHIPS.some((m) => m.toLowerCase() === lower || lower.includes(m.toLowerCase()))) {
      // matches a known material chip
      const matched = MATERIAL_CHIPS.find((m) => m.toLowerCase() === lower || lower.includes(m.toLowerCase()));
      result.material = matched ?? chunk;
      continue;
    }
    if (!result.sides && sidesValues.has(lower)) {
      result.sides = chunk;
      continue;
    }
    if (!result.size && /\d.*(?:["']|in\b|cm\b|ft\b|x\s*\d)/i.test(chunk)) {
      // looks like dimensions: contains a digit + (" or in/cm/ft or x N)
      result.size = chunk;
      continue;
    }
    if (!result.process && processWords.some((w) => lower.includes(w))) {
      result.process = chunk;
      continue;
    }
    unclassified.push(chunk);
  }

  // Anything we couldn't classify becomes free-text details
  if (unclassified.length > 0) result.details = unclassified.join(", ");
  return result;
}

/**
 * OrderItem represents one row in the quote. Two flavours:
 *   - kind="product" — printed item (Coroplast Sign, sticker, etc.) with spec block
 *   - kind="fee"     — service line (Installation, Delivery, Design, Rush, Custom)
 *
 * Structured spec fields (material/sides/process/size) feed the Albert-format
 * email render. They're all optional — staff can leave them blank and just type
 * everything into `details` if they want.
 */
interface OrderItem {
  id: string;
  kind: "product" | "fee";
  title: string;       // optional project title shown on invoice (e.g. "The Power of Branding")
  product: string;     // for kind="product": category. for kind="fee": fee name (e.g. "Installation Fee")
  // ── Spec block fields (kind="product" only) ──
  material: string;    // "4mm Coroplast"
  sides: string;       // "One side full colour printing"
  size: string;        // "24 x 36 in"
  process: string;     // "Gloss lamination / die cut" — multiple values join with " / "
  // ── Common fields ──
  qty: string;
  details: string;     // free-text extras (notes, special instructions)
  unitPrice: string;   // when present, amount auto-fills to qty * unitPrice
  amount: string;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  phone: string;
  items: OrderItem[];
  payment_method: "clover";
  quote_only: boolean; // true = no payment link / Wave draft only
  notes: string;
}

function makeItem(): OrderItem {
  return {
    id: crypto.randomUUID(),
    kind: "product",
    title: "",
    product: "",
    material: "",
    sides: "",
    size: "",
    process: "",
    qty: "1",
    details: "",
    unitPrice: "",
    amount: "",
  };
}

function makeFee(preset: { label: string; defaultAmount: number }): OrderItem {
  return {
    id: crypto.randomUUID(),
    kind: "fee",
    title: "",
    product: preset.label,
    material: "",
    sides: "",
    size: "",
    process: "",
    qty: "1",
    details: "",
    unitPrice: "",
    amount: preset.defaultAmount > 0 ? preset.defaultAmount.toFixed(2) : "",
  };
}

/** Toggle a value into a " / " separated list (for Process chips). */
function toggleInList(current: string, value: string): string {
  const parts = current.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  const idx = parts.indexOf(value);
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(value);
  return parts.join(" / ");
}

// Default is quote_only=true. Safer for staff: customer reviews the price first,
// nobody gets surprise-billed. Staff flips to "Send Invoice Now" when they're sure.
const EMPTY_FORM: FormState = {
  name: "", email: "", company: "", phone: "",
  items: [makeItem()],
  payment_method: "clover", quote_only: true, notes: "",
};

const MAX_ITEMS = 10;

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";

// ─── Component ──────────────────────────────────────────────────────────────────

export function StaffOrdersActions({ newQuoteCount = 0 }: { newQuoteCount?: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; email: string; quoteOnly: boolean } | null>(null);
  const searchParams = useSearchParams();
  // Tracks which ?manual value we've already auto-opened on so we don't reset
  // the form every time useSearchParams returns a new reference (Next.js 16
  // re-renders can give a fresh ReadonlyURLSearchParams object even when the
  // URL hasn't changed — without this guard, typing in the form triggers
  // re-renders that wipe everything the user entered).
  const lastConsumedManualRef = useRef<string | null>(null);

  // Auto-open the modal when arriving from another staff page with:
  //   ?manual=1     → invoice mode (immediate payment link)
  //   ?manual=quote → quote-only mode (no payment link until customer approves)
  useEffect(() => {
    const manual = searchParams?.get("manual") ?? null;
    const isManualOpen = manual === "1" || manual === "quote";
    if (isManualOpen && lastConsumedManualRef.current !== manual) {
      lastConsumedManualRef.current = manual;
      setForm({ ...EMPTY_FORM, quote_only: manual !== "1" });
      setError(null);
      setSuccess(null);
      setCustomerLookup({ status: "idle" });
      setModalOpen(true);
    } else if (!isManualOpen) {
      lastConsumedManualRef.current = null;
    }
  }, [searchParams]);

  // Engine-priced flyer catalog — shared hook, fetched once and cached across
  // the estimator + this modal so staff flyer prices always match the website.
  const flyerSkus = useFlyerCatalog();

  const [customerLookup, setCustomerLookup] = useState<CustomerLookup>({ status: "idle" });
  // formRef tracks the latest form without busting useCallback identity. The lookup
  // debounce reads formRef.current inside its setTimeout so we never rebuild the
  // callback on every keystroke (which would defeat the debounce).
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);
  const [pastOrdersOpen, setPastOrdersOpen] = useState(false);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [pastOrdersLoading, setPastOrdersLoading] = useState(false);
  const [feePickerOpen, setFeePickerOpen] = useState(false);
  // Per-item combobox state — which row has its product dropdown open
  const [productOpenId, setProductOpenId] = useState<string | null>(null);
  // Customer search (browse all customers) state
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    Array<{ id: string; email: string; name: string; company: string | null; phone: string | null; order_count: number }>
  >([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

        // Classify against the LATEST form (read via ref, not the closure's stale value).
        // Branches: ignore_stale_email · no_match · autofill (blanks only) · offer (typed values diverge).
        const action = classifyCustomerLookup(formRef.current, trimmed, data);
        switch (action.kind) {
          case "ignore_stale_email":
            return;
          case "no_match":
            setCustomerLookup({ status: "new" });
            return;
          case "autofill":
            setForm(action.form);
            setCustomerLookup({
              status: "found",
              name: action.saved.name,
              company: action.saved.company,
              phone: action.saved.phone,
              orderCount: data.orderCount ?? 0,
            });
            return;
          case "offer":
            // Never overwrite typed values — show a banner with the saved values
            // and let staff explicitly accept or keep what they typed.
            setCustomerLookup({
              status: "offer",
              name: action.saved.name,
              company: action.saved.company,
              phone: action.saved.phone,
              orderCount: data.orderCount ?? 0,
              saved: action.saved,
              conflicts: action.conflicts,
            });
            return;
        }
      } catch {
        setCustomerLookup({ status: "idle" });
      }
    }, 400);
  }, []);

  // Accept the offer banner — explicit overwrite (user clicked "Use saved").
  const acceptCustomerOffer = useCallback((saved: SavedCustomerData, orderCount: number) => {
    setForm((prev) => applyPickedCustomer(prev, {
      email: prev.email,
      name: saved.name,
      company: saved.company,
      phone: saved.phone,
    }));
    setCustomerLookup({
      status: "found",
      name: saved.name,
      company: saved.company,
      phone: saved.phone,
      orderCount,
    });
  }, []);

  // Dismiss the offer banner — keep what staff typed.
  const dismissCustomerOffer = useCallback((saved: SavedCustomerData, orderCount: number) => {
    setCustomerLookup({
      status: "found",
      name: saved.name,
      company: saved.company,
      phone: saved.phone,
      orderCount,
    });
  }, []);

  const runCustomerSearch = useCallback((q: string) => {
    if (customerSearchTimerRef.current) clearTimeout(customerSearchTimerRef.current);
    customerSearchTimerRef.current = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const res = await fetch(`/api/staff/customer-search?q=${encodeURIComponent(q)}`);
        if (!res.ok) { setCustomerSearchResults([]); return; }
        const data = await res.json() as { customers: typeof customerSearchResults };
        setCustomerSearchResults(data.customers);
      } catch {
        setCustomerSearchResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 200);
  }, [customerSearchResults]);

  const openCustomerSearch = useCallback(() => {
    setCustomerSearchOpen(true);
    setCustomerSearchQuery("");
    runCustomerSearch("");
  }, [runCustomerSearch]);

  const pickCustomer = useCallback((c: { email: string; name: string; company: string | null; phone: string | null }) => {
    // Explicit overwrite — staff just clicked a customer in the search dropdown,
    // so destroying typed values is intentional.
    setForm((prev) => applyPickedCustomer(prev, c));
    setCustomerLookup({ status: "found", name: c.name, company: c.company, phone: c.phone, orderCount: 0 });
    setCustomerSearchOpen(false);
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
  // PST exempts kind="fee" items (design/rush/installation) to match API + Wave invoice line item flags.
  // Modal preview ↔ manual-order API ↔ Wave invoice must agree — see payment-tax.md.
  const itemSubtotals = form.items.map((it) => {
    const amt = parseFloat(it.amount);
    return !isNaN(amt) && amt > 0 ? amt : 0;
  });
  const subtotal = Math.round(itemSubtotals.reduce((s, a) => s + a, 0) * 100) / 100;
  const pstableSubtotal = Math.round(
    form.items.reduce((s, it, i) => s + (it.kind === "fee" ? 0 : itemSubtotals[i]), 0) * 100
  ) / 100;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const pst = Math.round(pstableSubtotal * 0.06 * 100) / 100;
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
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        const next: OrderItem = { ...it, [field]: value };

        // Auto-calc amount when staff types a unitPrice OR changes qty (and unitPrice is set).
        // Typing amount directly overrides — we leave unitPrice alone.
        if (field === "unitPrice" || field === "qty") {
          const unit = parseFloat(field === "unitPrice" ? value : next.unitPrice);
          const qty = parseInt(field === "qty" ? value : next.qty);
          if (!isNaN(unit) && unit > 0 && !isNaN(qty) && qty > 0) {
            next.amount = (Math.round(unit * qty * 100) / 100).toFixed(2);
          }
        }
        return next;
      }),
    }));
    if (error) setError(null);
  }

  // Batch-update several fields of one item at once (avoids the per-field
  // unitPrice auto-calc fighting us when we set unitPrice + amount together).
  function patchItem(id: string, patch: Partial<OrderItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
    if (error) setError(null);
  }

  // Cascading flyer selector: Size → Paper → Sides → Qty. Each pick clears the
  // levels below it, then if the four together resolve to exactly one SKU we
  // patch the engine price + specs in. This is the ONLY source of flyer prices
  // on the staff side, so they always equal the website quote.
  function sidesToValue(sides: 1 | 2 | undefined): string {
    return sides === 2 ? SIDES_CHIPS[1].value : sides === 1 ? SIDES_CHIPS[0].value : "";
  }
  function valueToSides(value: string): 1 | 2 | undefined {
    if (value === SIDES_CHIPS[1].value) return 2;
    if (value === SIDES_CHIPS[0].value) return 1;
    return undefined;
  }
  function addItem() {
    if (form.items.length >= MAX_ITEMS) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, makeItem()] }));
  }

  function addFee(preset: { label: string; defaultAmount: number }) {
    if (form.items.length >= MAX_ITEMS) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, makeFee(preset)] }));
    setFeePickerOpen(false);
  }

  function removeItem(id: string) {
    if (form.items.length <= 1) return;
    setForm((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
  }

  function handleReorder(order: PastOrder) {
    if (!order.order_items || order.order_items.length === 0) return;
    const reorderItems: OrderItem[] = order.order_items.slice(0, MAX_ITEMS).map((oi) => {
      const spec = parseProductNameToSpec(oi.product_name);
      // If parser couldn't pull a product out (legacy data, weird names), fall
      // back to the loose matcher so the combobox still gets a category.
      const product = spec.product || matchProduct(oi.product_name);
      const unit = oi.qty > 0 ? Math.round((oi.line_total / oi.qty) * 100) / 100 : 0;
      return {
        id: crypto.randomUUID(),
        kind: "product" as const,
        title: spec.title,
        product,
        material: spec.material,
        sides: spec.sides,
        size: spec.size,
        process: spec.process,
        qty: String(oi.qty),
        details: spec.details,
        unitPrice: unit > 0 ? unit.toFixed(2) : "",
        amount: String(oi.line_total),
      };
    });
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
          contact: normalizeContactForSubmit(form),
          items: form.items.map((it) => ({
            kind: it.kind,
            title: it.title.trim() || undefined,
            product: it.product.trim(),
            material: it.material.trim() || undefined,
            sides: it.sides.trim() || undefined,
            size: it.size.trim() || undefined,
            process: it.process.trim() || undefined,
            qty: parseInt(it.qty) || 1,
            details: it.details.trim() || undefined,
            unitPrice: it.unitPrice.trim() ? parseFloat(it.unitPrice) : undefined,
            amount: parseFloat(it.amount),
          })),
          payment_method: form.payment_method,
          quote_only: form.quote_only,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json() as { orderId?: string; orderNumber?: string; paymentUrl?: string | null; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess({ orderNumber: data.orderNumber!, email: form.email.trim(), quoteOnly: form.quote_only });
      showToast(
        form.quote_only
          ? `Quote sent to ${form.email.trim()}`
          : `Payment request sent to ${form.email.trim()}`,
        "success"
      );
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
          href="/staff/customers"
          className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="View customers"
        >
          Customers
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
          {newQuoteCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
              {newQuoteCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Create a manual order or custom quote for a customer"
          data-testid="manual-order-trigger"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span>+ New Quote</span>
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
          href="/staff/lifecycle"
          className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
          aria-label="Open order lifecycle dashboard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Lifecycle</span>
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
          <span>Estimator</span>
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
                data-testid="manual-order-modal"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-[#1c1712]" data-testid="modal-title">
                      {form.quote_only ? "Custom Quote" : "Manual Order"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {form.quote_only
                        ? "Emails the customer a quote — no payment link until you approve it"
                        : "Creates an order and emails the customer a payment link"}
                    </p>
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
                    <h3 className="text-xl font-bold text-[#1c1712] mb-2">
                      {success.quoteOnly ? "Quote sent!" : "Payment request sent!"}
                    </h3>
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

                    {/* ── MODE PICKER — big two-card chooser. Default: Quote. ── */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Step 1 · Pick what to send</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* QUOTE CARD */}
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, quote_only: true }))}
                          aria-pressed={form.quote_only}
                          data-testid="mode-quote"
                          className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                            form.quote_only
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              form.quote_only ? "border-emerald-500" : "border-gray-300"
                            }`}>
                              {form.quote_only && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800 leading-tight">📝 Send Quote</p>
                              <p className="text-[11px] text-gray-500 leading-snug mt-1">
                                Customer reviews the price. No payment link yet. <strong className="text-emerald-700">Safest — use this first.</strong>
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* INVOICE CARD */}
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, quote_only: false }))}
                          aria-pressed={!form.quote_only}
                          data-testid="mode-invoice"
                          className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                            !form.quote_only
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              !form.quote_only ? "border-emerald-500" : "border-gray-300"
                            }`}>
                              {!form.quote_only && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800 leading-tight">💳 Send Invoice</p>
                              <p className="text-[11px] text-gray-500 leading-snug mt-1">
                                Customer pays now. Sends a Clover Pay Now link (or e-Transfer fallback). <strong className="text-gray-700">Use after price is agreed.</strong>
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ── CUSTOMER ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 · Who is it for?</p>
                        <button
                          type="button"
                          onClick={openCustomerSearch}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
                        >
                          Browse past customers →
                        </button>
                      </div>
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
                            autoFocus
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
                          {customerLookup.status === "offer" && customerLookup.saved && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                              <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-semibold text-amber-900">
                                    Saved customer matched — different from what you typed
                                  </p>
                                  <div className="mt-1 text-[11px] text-amber-800 space-y-0.5">
                                    {customerLookup.saved.name && <p>· Name: <span className="font-medium">{customerLookup.saved.name}</span></p>}
                                    {customerLookup.saved.company && <p>· Company: <span className="font-medium">{customerLookup.saved.company}</span></p>}
                                    {customerLookup.saved.phone && <p>· Phone: <span className="font-medium">{customerLookup.saved.phone}</span></p>}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => acceptCustomerOffer(customerLookup.saved!, customerLookup.orderCount ?? 0)}
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                                    >
                                      Use saved data
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dismissCustomerOffer(customerLookup.saved!, customerLookup.orderCount ?? 0)}
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 transition-colors"
                                    >
                                      Keep what I typed
                                    </button>
                                  </div>
                                </div>
                              </div>
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
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 3 · Line items</p>
                        <span className="text-[10px] font-semibold text-gray-300 tabular-nums">{form.items.length} / {MAX_ITEMS}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3 leading-snug">
                        Type any product, any size, any price. Use <strong>Unit Price</strong> when each piece has a per-piece rate (250 cards × $0.18) — the total fills in. Use <strong>Line Total</strong> when you already know the all-in price ($45 flat).
                      </p>

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
                                  {item.kind === "fee" ? "Fee" : `Item ${idx + 1}`}
                                  {item.title && <span className="text-gray-500 font-semibold ml-1.5 normal-case tracking-normal">{item.title}</span>}
                                  {!item.title && item.product && <span className="text-gray-300 font-normal ml-1.5 normal-case tracking-normal">{item.product}</span>}
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

                              {item.kind === "fee" ? (
                                // ── FEE LINE (simpler: just name + amount + notes) ──
                                <>
                                  <div>
                                    <label htmlFor={`pr-fee-name-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                      Fee name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      id={`pr-fee-name-${item.id}`}
                                      type="text"
                                      value={item.product}
                                      onChange={(e) => setItem(item.id, "product", e.target.value)}
                                      placeholder='e.g. "Installation Fee"'
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`pr-fee-amount-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                      Amount <span className="text-red-500">*</span> <span className="text-gray-300 font-normal">(editable per job)</span>
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                                      <input
                                        id={`pr-fee-amount-${item.id}`}
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
                                  <div>
                                    <label htmlFor={`pr-fee-notes-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                      Notes <span className="text-gray-300 font-normal">(optional)</span>
                                    </label>
                                    <input
                                      id={`pr-fee-notes-${item.id}`}
                                      type="text"
                                      value={item.details}
                                      onChange={(e) => setItem(item.id, "details", e.target.value)}
                                      placeholder='e.g. "Onsite install, 2 hrs, 2 staff"'
                                      className={inputClass}
                                    />
                                  </div>
                                </>
                              ) : (
                                // ── PRODUCT LINE (with Albert-format spec block) ──
                                <>
                                  {/* Title (optional, shows as invoice line headline) */}
                                  <div>
                                    <label htmlFor={`pr-title-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                      Line Title <span className="text-gray-300 font-normal">(optional — shows on the invoice)</span>
                                    </label>
                                    <input
                                      id={`pr-title-${item.id}`}
                                      type="text"
                                      value={item.title}
                                      onChange={(e) => setItem(item.id, "title", e.target.value)}
                                      placeholder='e.g. "The Power of Branding"'
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* Product combobox (typeahead + free-text) + Qty */}
                                  <div className="grid grid-cols-[1fr_80px] gap-2">
                                    <div className="relative">
                                      <label htmlFor={`pr-product-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                        Product <span className="text-red-500">*</span> <span className="text-gray-300 font-normal">(type anything or pick)</span>
                                      </label>
                                      <input
                                        id={`pr-product-${item.id}`}
                                        type="text"
                                        value={item.product}
                                        onChange={(e) => setItem(item.id, "product", e.target.value)}
                                        onFocus={() => setProductOpenId(item.id)}
                                        onBlur={() => setTimeout(() => setProductOpenId((cur) => (cur === item.id ? null : cur)), 150)}
                                        placeholder="Coroplast Signs"
                                        autoComplete="off"
                                        className={inputClass}
                                      />
                                      {productOpenId === item.id && (
                                        <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                          {PRODUCT_OPTIONS
                                            .filter((opt) => !item.product.trim() || opt.toLowerCase().includes(item.product.toLowerCase()))
                                            .map((opt) => (
                                              <button
                                                key={opt}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => { setItem(item.id, "product", opt); setProductOpenId(null); }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                              >
                                                {opt}
                                              </button>
                                            ))}
                                          {PRODUCT_OPTIONS.every((opt) => !opt.toLowerCase().includes(item.product.toLowerCase())) && item.product.trim() && (
                                            <p className="px-3 py-2 text-xs text-gray-400 italic">No match — &ldquo;{item.product}&rdquo; will be used as-is</p>
                                          )}
                                        </div>
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

                                  {/* FLYER engine picker — shared <FlyerPicker>,
                                      same component + engine the /staff estimator uses. */}
                                  {/flyer/i.test(item.product) && (() => {
                                    const selection: FlyerSelection = {
                                      sizeKey: flyerSkus.find((s) => s.sizeLabel === item.size)?.sizeKey,
                                      paperLabel: item.material || undefined,
                                      sides: valueToSides(item.sides),
                                      qty: parseInt(item.qty) || undefined,
                                    };
                                    return (
                                      <FlyerPicker
                                        catalog={flyerSkus}
                                        selection={selection}
                                        onChange={(next, resolved) => {
                                          const patch: Partial<OrderItem> = {
                                            size: next.sizeKey
                                              ? flyerSkus.find((s) => s.sizeKey === next.sizeKey)?.sizeLabel ?? ""
                                              : "",
                                            material: next.paperLabel ?? "",
                                            sides: sidesToValue(next.sides),
                                            qty: next.qty !== undefined ? String(next.qty) : "",
                                          };
                                          if (resolved) {
                                            patch.unitPrice = resolved.unitPrice.toFixed(2);
                                            patch.amount = resolved.price.toFixed(2);
                                          }
                                          patchItem(item.id, patch);
                                        }}
                                      />
                                    );
                                  })()}

                                  {/* MATERIAL chips */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label htmlFor={`pr-mat-${item.id}`} className="block text-[10px] font-semibold text-gray-500">
                                        Material <span className="text-gray-300 font-normal">(click a chip or type)</span>
                                      </label>
                                      {item.material && (
                                        <button type="button" onClick={() => setItem(item.id, "material", "")} className="text-[10px] text-gray-400 hover:text-red-500 font-semibold">Clear</button>
                                      )}
                                    </div>
                                    <input
                                      id={`pr-mat-${item.id}`}
                                      type="text"
                                      value={item.material}
                                      onChange={(e) => setItem(item.id, "material", e.target.value)}
                                      placeholder="4mm Coroplast"
                                      className={`${inputClass} mb-1.5`}
                                    />
                                    <div className="flex flex-wrap gap-1">
                                      {MATERIAL_CHIPS.map((chip) => (
                                        <button
                                          key={chip}
                                          type="button"
                                          onClick={() => setItem(item.id, "material", item.material === chip ? "" : chip)}
                                          className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                                            item.material === chip
                                              ? "bg-emerald-500 border-emerald-500 text-white"
                                              : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                                          }`}
                                        >
                                          {chip}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* SIDES + SIZE row */}
                                  <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                                        Sides
                                      </label>
                                      <div className="flex gap-1">
                                        {SIDES_CHIPS.map((chip) => (
                                          <button
                                            key={chip.label}
                                            type="button"
                                            onClick={() => setItem(item.id, "sides", item.sides === chip.value ? "" : chip.value)}
                                            className={`px-2.5 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                                              item.sides === chip.value
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                                            }`}
                                          >
                                            {chip.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label htmlFor={`pr-size-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                        Size
                                      </label>
                                      <input
                                        id={`pr-size-${item.id}`}
                                        type="text"
                                        value={item.size}
                                        onChange={(e) => setItem(item.id, "size", e.target.value)}
                                        placeholder='24" x 36"'
                                        className={inputClass}
                                      />
                                    </div>
                                  </div>

                                  {/* PROCESS chips (multi-select) */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label htmlFor={`pr-proc-${item.id}`} className="block text-[10px] font-semibold text-gray-500">
                                        Process <span className="text-gray-300 font-normal">(pick any combo)</span>
                                      </label>
                                      {item.process && (
                                        <button type="button" onClick={() => setItem(item.id, "process", "")} className="text-[10px] text-gray-400 hover:text-red-500 font-semibold">Clear</button>
                                      )}
                                    </div>
                                    <input
                                      id={`pr-proc-${item.id}`}
                                      type="text"
                                      value={item.process}
                                      onChange={(e) => setItem(item.id, "process", e.target.value)}
                                      placeholder="Gloss lamination / die cut"
                                      className={`${inputClass} mb-1.5`}
                                    />
                                    <div className="flex flex-wrap gap-1">
                                      {PROCESS_CHIPS.map((chip) => {
                                        const active = item.process.split(/\s*\/\s*/).map((s) => s.trim()).includes(chip);
                                        return (
                                          <button
                                            key={chip}
                                            type="button"
                                            onClick={() => setItem(item.id, "process", toggleInList(item.process, chip))}
                                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                                              active
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                                            }`}
                                          >
                                            {chip}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Notes (free text — extras the chips don't cover) */}
                                  <div>
                                    <label htmlFor={`pr-details-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                      Extra notes <span className="text-gray-300 font-normal">(optional)</span>
                                    </label>
                                    <input
                                      id={`pr-details-${item.id}`}
                                      type="text"
                                      value={item.details}
                                      onChange={(e) => setItem(item.id, "details", e.target.value)}
                                      placeholder='e.g. "Included: measurement & install"'
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* Unit price + Amount row */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label htmlFor={`pr-unit-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                        Unit Price <span className="text-gray-300 font-normal">(per piece)</span>
                                      </label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                                        <input
                                          id={`pr-unit-${item.id}`}
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="99999"
                                          value={item.unitPrice}
                                          onChange={(e) => setItem(item.id, "unitPrice", e.target.value)}
                                          placeholder="0.00"
                                          className={`${inputClass} pl-7`}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label htmlFor={`pr-amount-${item.id}`} className="block text-[10px] font-semibold text-gray-500 mb-1">
                                        Line Total <span className="text-red-500">*</span>
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
                                </>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Add Item / Add Fee buttons */}
                        {form.items.length < MAX_ITEMS && (
                          <div className="grid grid-cols-2 gap-2 relative">
                            <button
                              type="button"
                              onClick={addItem}
                              className="py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                              + Add Item
                            </button>
                            <button
                              type="button"
                              onClick={() => setFeePickerOpen((v) => !v)}
                              className="py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                              + Add Fee
                            </button>
                            {feePickerOpen && (
                              <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-2">Pick a fee (amount editable)</p>
                                <div className="space-y-0.5">
                                  {FEE_PRESETS.map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => addFee(preset)}
                                      className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors"
                                    >
                                      <span>{preset.label}</span>
                                      <span className="text-xs text-gray-400 tabular-nums">{preset.defaultAmount > 0 ? `$${preset.defaultAmount}` : "—"}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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

                    {/* ── PAYMENT METHOD (info only — Clover Pay Now is the only path) ── */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Step 4 · How it&apos;s billed
                      </p>
                      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">Clover Pay Now</p>
                        <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                          {form.quote_only
                            ? "Customer gets a quote email with a Clover Pay Now button (e-Transfer to info@true-color.ca shown as fallback). They can pay to confirm or reply with changes. Your books are updated automatically when payment is confirmed."
                            : "Customer gets a branded invoice email with a Clover Pay Now button (e-Transfer to info@true-color.ca shown as fallback). Your books are updated automatically the moment Clover confirms payment."}
                        </p>
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
                            {form.quote_only ? "Send Quote" : "Send Invoice"}
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

      {/* ── Customer Search Modal ── */}
      <AnimatePresence>
        {customerSearchOpen && (
          <>
            <motion.div
              key="cust-search-backdrop"
              className="fixed inset-0 bg-black/50 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomerSearchOpen(false)}
            />
            <motion.div
              key="cust-search-modal"
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-[#1c1712]">Pick a customer</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Search name, email, or company</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerSearchOpen(false)}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close customer search"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-6 pt-4">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => { setCustomerSearchQuery(e.target.value); runCustomerSearch(e.target.value); }}
                    placeholder="Type a name, email, or company..."
                    autoFocus
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                  {customerSearchLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
                  ) : customerSearchResults.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No customers found. Use the email field to add a new customer.</p>
                  ) : (
                    customerSearchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCustomer(c)}
                        className="w-full text-left rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{c.name || c.email}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {c.email}{c.company ? ` · ${c.company}` : ""}{c.phone ? ` · ${c.phone}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap tabular-nums">
                            {c.order_count} {c.order_count === 1 ? "order" : "orders"}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
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
