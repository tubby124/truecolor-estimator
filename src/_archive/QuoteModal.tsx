"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

const INPUT_CLS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#16C2F3] bg-white transition-colors";
const LABEL_CLS =
  "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

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
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
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
      setConfirmRemoveId(null);
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
    setConfirmRemoveId(null);
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card — slides up from bottom on mobile, centered on desktop */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Request a quote"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative z-10 bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Modal header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#1c1712]">Request a Quote</h2>
            <p className="text-xs text-gray-400 mt-0.5">We reply within 1 business day</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Item counter badge */}
            {items.length > 1 && (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
                {items.length} / 5
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          {sent ? (
            /* ── Success ── */
            <div className="px-6 py-12 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="w-16 h-16 bg-[#8CC63E] rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1c1712] mb-2">
                  {items.length > 1
                    ? `Your ${items.length}-item quote request was sent!`
                    : "Quote request sent!"}
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                  We&apos;ll reply to <strong>{email}</strong> within 1 business day.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#16C2F3] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#0fb0dd] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            </div>
          ) : (
            /* ── Form ── */
            <div className="px-5 py-5 space-y-5">
              {/* Contact fields */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Your contact info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    What do you need printed?
                  </p>
                  <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                    {items.length} / 5
                  </span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        <ModalItemCard
                          item={item}
                          index={index}
                          total={items.length}
                          error={itemErrors[item.id]}
                          confirmRemove={confirmRemoveId === item.id}
                          onUpdate={updateItem}
                          onUpdateFile={updateItemFile}
                          onRequestRemove={() => setConfirmRemoveId(item.id)}
                          onCancelRemove={() => setConfirmRemoveId(null)}
                          onConfirmRemove={() => removeItem(item.id)}
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
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 px-4 text-sm font-semibold text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add another item
                      <span className="text-xs font-normal text-gray-400">
                        ({5 - items.length} remaining)
                      </span>
                    </button>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      Maximum 5 items. For larger orders, call{" "}
                      <a href="tel:3069548688" className="text-[#16C2F3] hover:underline cursor-pointer">
                        (306) 954-8688
                      </a>
                      .
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base cursor-pointer min-h-[52px] flex items-center justify-center gap-3 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending…
                  </>
                ) : items.length > 1 ? (
                  `Send ${items.length}-Item Quote Request →`
                ) : (
                  "Send My Request →"
                )}
              </button>

              <p className="text-xs text-gray-400 text-center pb-1">
                (306) 954-8688 · 216 33rd St W, Saskatoon · Reply within 1 business day
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ── Modal Item Card ───────────────────────────────────────────────────────────

interface ModalItemCardProps {
  item: QuoteItem;
  index: number;
  total: number;
  error?: string;
  confirmRemove: boolean;
  onUpdate: (
    id: string,
    field: keyof Omit<QuoteItem, "id" | "file">,
    value: string
  ) => void;
  onUpdateFile: (id: string, file: File | null) => void;
  onRequestRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  fileRef: React.RefCallback<HTMLInputElement>;
  onFileClick: () => void;
}

function ModalItemCard({
  item,
  index,
  total,
  error,
  confirmRemove,
  onUpdate,
  onUpdateFile,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
  fileRef,
  onFileClick,
}: ModalItemCardProps) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        error ? "border-red-200 bg-red-50/20" : "border-gray-200 bg-white"
      }`}
    >
      {/* Card header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          error ? "border-red-100 bg-red-50/30" : "border-gray-100 bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
              error ? "bg-red-500 text-white" : "bg-[#16C2F3] text-white"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#1c1712]">Item {index + 1}</span>
            <span className="text-xs text-gray-400 ml-1.5 truncate">{item.product}</span>
          </div>
        </div>

        {total > 1 &&
          (confirmRemove ? (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={onCancelRemove}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmRemove}
                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestRemove}
              aria-label={`Remove item ${index + 1}`}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
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
          ))}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
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
            placeholder="e.g. 4mm coroplast, 100lb gloss — or describe what you need"
          />
          <p className="text-xs text-gray-400 mt-1">
            Not sure? Leave blank and add a note below.
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
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    item.sides === side
                      ? "bg-[#1c1712] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-pressed={item.sides === side}
                >
                  {side === "1" ? "1-sided" : "2-sided"}
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
              placeholder="Timeline, finish, laminate, grommets, anything else…"
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
            className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-[#16C2F3] hover:bg-blue-50/30 transition-all cursor-pointer min-h-[56px] flex flex-col items-center justify-center"
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
                <div className="w-7 h-7 bg-[#8CC63E]/10 rounded-lg flex items-center justify-center mb-1">
                  <svg
                    className="w-3.5 h-3.5 text-[#8CC63E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#1c1712] font-semibold">{item.file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">PDF, AI, JPG, PNG — up to 4 MB</p>
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
    </div>
  );
}
