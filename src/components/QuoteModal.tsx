"use client";

import { useEffect, useRef, useState } from "react";
import { X, Paperclip } from "lucide-react";

const PRODUCT_OPTIONS = [
  "Coroplast Signs",
  "Vinyl Banners",
  "Vehicle Magnets",
  "Business Cards",
  "Flyers & Brochures",
  "Aluminum Composite Signs",
  "Foamboard Displays",
  "Retractable Banners",
  "Window Decals / Vinyl",
  "Installation Service",
  "Graphic Design",
  "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultProduct?: string;
}

export function QuoteModal({ open, onClose, defaultProduct }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState(defaultProduct ?? PRODUCT_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setProduct(defaultProduct ?? PRODUCT_OPTIONS[0]);
      setDescription("");
      setFile(null);
      setLoading(false);
      setSent(false);
      setError("");
    }
  }, [open, defaultProduct]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !description.trim()) {
      setError("Name, email, and project details are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let fileBase64: string | undefined;
      let fileName: string | undefined;
      if (file) {
        fileName = file.name;
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          product,
          description,
          isCustom: false,
          fileBase64,
          fileName,
        }),
      });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#1c1712]">Request a Quote</h2>
            <p className="text-sm text-gray-500 mt-0.5">We reply within 1 business day</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 bg-[#8CC63E] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1c1712] mb-2">Quote request sent!</h3>
            <p className="text-gray-500 mb-6">
              We&apos;ll reply to <strong>{email}</strong> within 1 business day.
            </p>
            <button
              onClick={onClose}
              className="bg-[#16C2F3] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="px-6 py-6 space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Your name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                />
              </div>
            </div>

            {/* Phone + Product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(306) 555-0100"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] bg-white"
                >
                  {PRODUCT_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Project details *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="E.g. 10 coroplast signs, 24×36″, double-sided. Need a layout. Picking up next Thursday."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] resize-none"
              />
            </div>

            {/* File attachment */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Attach a file (optional)</label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#16C2F3] transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.ai,.eps,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#16C2F3]" />
                    <span className="text-sm font-medium text-[#1c1712]">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">Logo, sketch, or reference image — PDF, AI, JPG, PNG</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
            >
              {loading ? "Sending…" : "Send quote request →"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              (306) 954-8688 · 216 33rd St W, Saskatoon · We reply within 1 business day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
