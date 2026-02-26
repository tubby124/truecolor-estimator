"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

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

function QuoteForm() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product") ?? "";

  // Match slug back to a display name
  const defaultProduct =
    PRODUCT_OPTIONS.find(
      (p) => p.toLowerCase().replace(/[^a-z0-9]+/g, "-") === productParam
    ) ?? productParam;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState(defaultProduct || PRODUCT_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !description.trim()) {
      setError("Name, email, and description are required.");
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
          isCustom,
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
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1c1712] mb-3">
            Quote request sent!
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

        <div className="space-y-6">
          {/* Request type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsCustom(false)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isCustom
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              Standard quote
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isCustom
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              Custom / bulk request
            </button>
          </div>

          {isCustom && (
            <div className="bg-[#f4efe9] rounded-xl p-4 text-sm text-gray-600">
              For bulk orders, special sizes, non-catalog products, or
              project-level requests. Tell us everything — we handle it.
            </div>
          )}

          {/* Contact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Your name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                placeholder="(306) 555-0100"
              />
            </div>
            {!isCustom && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Product
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] bg-white"
                >
                  {PRODUCT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isCustom ? "Describe your project *" : "What do you need? *"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] resize-none"
              placeholder={
                isCustom
                  ? "E.g. We need 500 coroplast signs for a subdivision launch — 24\u00d736\", double-sided, deliverable within 2 weeks. Can you handle this volume?"
                  : "E.g. 10 coroplast signs, 24\u00d736\", double-sided. I have a logo but need layout help. Picking up next Thursday."
              }
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Attach a file (optional)
            </label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#16C2F3] transition-colors cursor-pointer"
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
                <div>
                  <p className="font-semibold text-sm text-[#1c1712]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(1)} MB &middot; Click to
                    change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">
                    Upload a reference image, logo, or sketch
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, AI, JPG, PNG — up to 50MB
                  </p>
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
            className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors"
          >
            {loading ? "Sending\u2026" : "Send quote request \u2192"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            We reply within 1 business day &middot; (306) 954-8688 &middot; 216
            33rd St W, Saskatoon
          </p>
        </div>
      </main>
      <SiteFooter />
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
