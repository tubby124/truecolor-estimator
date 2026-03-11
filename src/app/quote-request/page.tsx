"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PRODUCT_OPTIONS } from "@/lib/constants/products";

interface QuoteItem {
  id: string;
  product: string;
  qty: string;
  material: string;
  dimensions: string;
  sides: "1" | "2";
  notes: string;
  file: File | null;
}

function makeItem(defaultProduct = PRODUCT_OPTIONS[0]): QuoteItem {
  return {
    id: crypto.randomUUID(),
    product: defaultProduct,
    qty: "",
    material: "",
    dimensions: "",
    sides: "1",
    notes: "",
    file: null,
  };
}

// text-base = 16px minimum — prevents iOS from auto-zooming on input focus
const INPUT_CLS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#16C2F3] bg-white";
const LABEL_CLS = "block text-xs font-medium text-gray-500 mb-1";

function QuoteForm() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product") ?? "";
  const defaultProduct =
    (PRODUCT_OPTIONS.find(
      (p) => p.toLowerCase().replace(/[^a-z0-9]+/g, "-") === productParam
    ) ?? productParam) || PRODUCT_OPTIONS[0];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([makeItem(defaultProduct)]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const fileRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  function addItem() {
    if (items.length >= 5) return;
    setItems((prev) => [...prev, makeItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateItem(
    id: string,
    field: keyof Omit<QuoteItem, "id" | "file">,
    value: string
  ) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
    if (itemErrors[id]) {
      setItemErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function updateItemFile(id: string, file: File | null) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, file } : i))
    );
  }

  async function handleSubmit() {
    let hasErrors = false;

    if (!name.trim() || !email.trim()) {
      setContactError("Name and email are required.");
      hasErrors = true;
    } else {
      setContactError("");
    }

    const errors: Record<string, string> = {};
    for (const item of items) {
      if (!item.qty.trim()) {
        errors[item.id] = "Quantity is required.";
      } else if (!item.material.trim() && !item.notes.trim()) {
        errors[item.id] =
          "Please specify a material or add notes describing this item.";
      }
    }
    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      if (phone.trim()) fd.append("phone", phone.trim());
      fd.append(
        "items",
        JSON.stringify(
          items.map(({ product, qty, material, dimensions, sides, notes }) => ({
            product,
            qty,
            material,
            dimensions,
            sides,
            notes,
          }))
        )
      );
      items.forEach((item, i) => {
        if (item.file) fd.append(`file_${i}`, item.file);
      });

      const res = await fetch("/api/quote-request", {
        method: "POST",
        body: fd, // No Content-Type header — browser sets multipart boundary
      });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-[#8CC63E] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="white"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1c1712] mb-3">
            {items.length > 1
              ? `Your ${items.length}-item quote request was sent!`
              : "Quote request sent!"}
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            We&apos;ll reply to <strong>{email}</strong> within 1 business day.
            Check your inbox for a confirmation.
          </p>
          <a
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Browse products →
          </a>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Get a quote</h1>
        <p className="text-gray-500 mb-10">
          Tell us what you need and we&apos;ll reply within 1 business day.
        </p>

        <div className="space-y-8">
          {/* ── Contact info ── */}
          <section aria-label="Contact information">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Your contact info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qr-name" className={LABEL_CLS}>
                  Full name *
                </label>
                <input
                  id="qr-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (contactError) setContactError("");
                  }}
                  className={INPUT_CLS}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="qr-email" className={LABEL_CLS}>
                  Email *
                </label>
                <input
                  id="qr-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (contactError) setContactError("");
                  }}
                  className={INPUT_CLS}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="sm:col-span-2 sm:max-w-xs">
                <label htmlFor="qr-phone" className={LABEL_CLS}>
                  Phone (optional)
                </label>
                <input
                  id="qr-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="(306) 555-0100"
                  autoComplete="tel"
                />
              </div>
            </div>
            {contactError && (
              <p className="mt-3 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {contactError}
              </p>
            )}
          </section>

          {/* ── Items ── */}
          <section aria-label="Items to quote">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              What do you need printed?
            </p>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <ItemCard
                      item={item}
                      index={index}
                      total={items.length}
                      error={itemErrors[item.id]}
                      onUpdate={updateItem}
                      onUpdateFile={updateItemFile}
                      onRemove={removeItem}
                      fileRef={(el) => {
                        if (el) fileRefs.current.set(item.id, el);
                        else fileRefs.current.delete(item.id);
                      }}
                      onFileClick={() =>
                        fileRefs.current.get(item.id)?.click()
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add item / max notice */}
              {items.length < 5 ? (
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add another item
                </button>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  Maximum 5 items per request. For larger orders, call us at
                  (306) 954-8688.
                </p>
              )}
            </div>
          </section>

          {/* ── Trust bar ── */}
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
            <span>No commitment — we send your price, you decide.</span>
            <span className="flex items-center gap-1 shrink-0">
              <svg
                className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              5.0 · 27 reviews
            </span>
          </div>

          {/* ── Submit ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            {loading
              ? "Sending…"
              : items.length > 1
              ? `Send ${items.length}-Item Quote Request →`
              : "Send My Request →"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            We reply within 1 business day · (306) 954-8688 · 216 33rd St W,
            Saskatoon
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Item Card ─────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: QuoteItem;
  index: number;
  total: number;
  error?: string;
  onUpdate: (
    id: string,
    field: keyof Omit<QuoteItem, "id" | "file">,
    value: string
  ) => void;
  onUpdateFile: (id: string, file: File | null) => void;
  onRemove: (id: string) => void;
  fileRef: React.RefCallback<HTMLInputElement>;
  onFileClick: () => void;
}

function ItemCard({
  item,
  index,
  total,
  error,
  onUpdate,
  onUpdateFile,
  onRemove,
  fileRef,
  onFileClick,
}: ItemCardProps) {
  return (
    <div
      className={`border rounded-xl p-5 space-y-4 transition-colors ${
        error ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#1c1712]">
          Item {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove item ${index + 1}`}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Product + Qty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`product-${item.id}`} className={LABEL_CLS}>
            Product type
          </label>
          <select
            id={`product-${item.id}`}
            value={item.product}
            onChange={(e) => onUpdate(item.id, "product", e.target.value)}
            className={INPUT_CLS}
          >
            {PRODUCT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`qty-${item.id}`} className={LABEL_CLS}>
            Quantity *
          </label>
          <input
            id={`qty-${item.id}`}
            type="number"
            min="1"
            value={item.qty}
            onChange={(e) => onUpdate(item.id, "qty", e.target.value)}
            className={INPUT_CLS}
            placeholder="e.g. 100"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Material */}
      <div>
        <label htmlFor={`material-${item.id}`} className={LABEL_CLS}>
          Material / paper stock
        </label>
        <input
          id={`material-${item.id}`}
          type="text"
          value={item.material}
          onChange={(e) => onUpdate(item.id, "material", e.target.value)}
          className={INPUT_CLS}
          placeholder="e.g. 32lb premium paper, 100lb gloss, 4mm coroplast — or describe what you need"
        />
        <p className="text-xs text-gray-400 mt-1">
          Not in our catalog? No problem — we&apos;ll source it or suggest an
          alternative.
        </p>
      </div>

      {/* Dimensions + Sides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`dimensions-${item.id}`} className={LABEL_CLS}>
            Size / dimensions (optional)
          </label>
          <input
            id={`dimensions-${item.id}`}
            type="text"
            value={item.dimensions}
            onChange={(e) => onUpdate(item.id, "dimensions", e.target.value)}
            className={INPUT_CLS}
            placeholder='e.g. 8.5"×11", 24"×36"'
          />
        </div>
        <div>
          <p
            className={LABEL_CLS}
            id={`sides-label-${item.id}`}
          >
            Sides
          </p>
          <div
            className="flex rounded-lg overflow-hidden border border-gray-200"
            role="group"
            aria-labelledby={`sides-label-${item.id}`}
          >
            {(["1", "2"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onUpdate(item.id, "sides", side)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                  item.sides === side
                    ? "bg-[#1c1712] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={item.sides === side}
              >
                {side === "1" ? "Single" : "Double-sided"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={`notes-${item.id}`} className={LABEL_CLS}>
          Notes (optional)
        </label>
        <div className="relative">
          <textarea
            id={`notes-${item.id}`}
            value={item.notes}
            onChange={(e) => onUpdate(item.id, "notes", e.target.value)}
            rows={2}
            maxLength={500}
            className={`${INPUT_CLS} resize-none`}
            placeholder="Pickup timeline, special finish, anything else we should know…"
          />
          {item.notes.length > 200 && (
            <span className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none">
              {item.notes.length}/500
            </span>
          )}
        </div>
      </div>

      {/* File upload */}
      <div>
        <p className={LABEL_CLS}>Attach artwork or reference (optional)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.ai,.eps,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onUpdateFile(item.id, e.target.files?.[0] ?? null)}
          className="hidden"
          aria-label={`Upload file for item ${index + 1}`}
        />
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#16C2F3] transition-colors cursor-pointer min-h-[80px] flex flex-col items-center justify-center"
          onClick={onFileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onFileClick();
          }}
          aria-label={`Upload file for item ${index + 1}`}
        >
          {item.file ? (
            <>
              <p className="font-semibold text-sm text-[#1c1712]">
                {item.file.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {(item.file.size / 1024 / 1024).toFixed(1)} MB · Click to
                change
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-gray-400 mb-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Upload a reference image, logo, or file
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                PDF, AI, JPG, PNG — up to 4 MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function QuoteRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <QuoteForm />
    </Suspense>
  );
}
