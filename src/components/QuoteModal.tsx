"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const PRODUCT_OPTIONS = [
  "Coroplast Signs",
  "Vinyl Banners",
  "Vehicle Magnets",
  "Business Cards",
  "Flyers & Brochures",
  "Paper / Document Printing",
  "Aluminum Composite Signs",
  "Foamboard Displays",
  "Retractable Banners",
  "Window Decals / Vinyl",
  "Installation Service",
  "Graphic Design",
  "Other",
];

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

const INPUT_CLS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#16C2F3] bg-white";
const LABEL_CLS = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultProduct?: string;
}

export function QuoteModal({ open, onClose, defaultProduct }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>(() => [makeItem(defaultProduct)]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const fileRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape + body scroll lock
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setItems([makeItem(defaultProduct)]);
      setLoading(false);
      setSent(false);
      setContactError("");
      setItemErrors({});
      fileRefs.current.clear();
    }
  }, [open, defaultProduct]);

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
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, file } : i)));
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

      const res = await fetch("/api/quote-request", { method: "POST", body: fd });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Request a quote"
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#1c1712]">Request a Quote</h2>
            <p className="text-sm text-gray-500 mt-0.5">We reply within 1 business day</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {sent ? (
            /* ── Success ── */
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 bg-[#8CC63E] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1c1712] mb-2">
                {items.length > 1
                  ? `Your ${items.length}-item quote request was sent!`
                  : "Quote request sent!"}
              </h3>
              <p className="text-gray-500 mb-6">
                We&apos;ll reply to <strong>{email}</strong> within 1 business day.
              </p>
              <button
                onClick={onClose}
                className="bg-[#16C2F3] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div className="px-6 py-6 space-y-6">
              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qm-name" className={LABEL_CLS}>
                    Full name *
                  </label>
                  <input
                    id="qm-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (contactError) setContactError("");
                    }}
                    placeholder="Jane Smith"
                    className={INPUT_CLS}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="qm-email" className={LABEL_CLS}>
                    Email *
                  </label>
                  <input
                    id="qm-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (contactError) setContactError("");
                    }}
                    placeholder="jane@example.com"
                    className={INPUT_CLS}
                    autoComplete="email"
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-xs">
                  <label htmlFor="qm-phone" className={LABEL_CLS}>
                    Phone (optional)
                  </label>
                  <input
                    id="qm-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(306) 555-0100"
                    className={INPUT_CLS}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {contactError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {contactError}
                </p>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
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
                        <ModalItemCard
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
                          onFileClick={() => fileRefs.current.get(item.id)?.click()}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

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
                      Maximum 5 items per request. For larger orders, call (306) 954-8688.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-base cursor-pointer min-h-[44px]"
              >
                {loading
                  ? "Sending…"
                  : items.length > 1
                  ? `Send ${items.length}-Item Quote Request →`
                  : "Send My Request →"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                (306) 954-8688 · 216 33rd St W, Saskatoon · We reply within 1 business day
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Item Card (modal-scoped) ──────────────────────────────────────────────────

interface ModalItemCardProps {
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

function ModalItemCard({
  item,
  index,
  total,
  error,
  onUpdate,
  onUpdateFile,
  onRemove,
  fileRef,
  onFileClick,
}: ModalItemCardProps) {
  return (
    <div
      className={`border rounded-xl p-4 space-y-4 transition-colors ${
        error ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#1c1712]">Item {index + 1}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Product + Qty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`qm-product-${item.id}`} className={LABEL_CLS}>
            Product
          </label>
          <select
            id={`qm-product-${item.id}`}
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
          <label htmlFor={`qm-qty-${item.id}`} className={LABEL_CLS}>
            Quantity *
          </label>
          <input
            id={`qm-qty-${item.id}`}
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
        <label htmlFor={`qm-material-${item.id}`} className={LABEL_CLS}>
          Material / paper stock
        </label>
        <input
          id={`qm-material-${item.id}`}
          type="text"
          value={item.material}
          onChange={(e) => onUpdate(item.id, "material", e.target.value)}
          className={INPUT_CLS}
          placeholder="e.g. 4mm coroplast, 100lb gloss, 32lb paper — or describe what you need"
        />
        <p className="text-xs text-gray-400 mt-1">
          Not in our catalog? No problem — we&apos;ll source it or suggest an alternative.
        </p>
      </div>

      {/* Dimensions + Sides */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`qm-dim-${item.id}`} className={LABEL_CLS}>
            Size (optional)
          </label>
          <input
            id={`qm-dim-${item.id}`}
            type="text"
            value={item.dimensions}
            onChange={(e) => onUpdate(item.id, "dimensions", e.target.value)}
            className={INPUT_CLS}
            placeholder='e.g. 24"×36"'
          />
        </div>
        <div>
          <p className={LABEL_CLS} id={`qm-sides-label-${item.id}`}>
            Sides
          </p>
          <div
            className="flex rounded-lg overflow-hidden border border-gray-200"
            role="group"
            aria-labelledby={`qm-sides-label-${item.id}`}
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
                {side === "1" ? "Single" : "Double"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={`qm-notes-${item.id}`} className={LABEL_CLS}>
          Notes (optional)
        </label>
        <div className="relative">
          <textarea
            id={`qm-notes-${item.id}`}
            value={item.notes}
            onChange={(e) => onUpdate(item.id, "notes", e.target.value)}
            rows={2}
            maxLength={500}
            className={`${INPUT_CLS} resize-none`}
            placeholder="Deadline, special finish, anything else we should know…"
          />
          {item.notes.length > 200 && (
            <span className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none">
              {item.notes.length}/500
            </span>
          )}
        </div>
      </div>

      {/* File */}
      <div>
        <p className={LABEL_CLS}>Attach artwork (optional)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.ai,.eps,.jpg,.jpeg,.png,.webp"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 4 * 1024 * 1024) {
              onUpdateFile(item.id, null);
              e.target.value = "";
            } else {
              onUpdateFile(item.id, f);
            }
          }}
          className="hidden"
          aria-label={`Upload file for item ${index + 1}`}
        />
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-[#16C2F3] transition-colors cursor-pointer min-h-[56px] flex items-center justify-center"
          onClick={onFileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onFileClick();
          }}
          aria-label={`Upload file for item ${index + 1}`}
        >
          {item.file ? (
            <p className="text-sm text-[#1c1712] font-medium">
              {item.file.name}{" "}
              <span className="text-xs text-gray-400 font-normal">
                ({(item.file.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              PDF, AI, JPG, PNG — up to 4 MB
            </p>
          )}
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}
    </div>
  );
}
