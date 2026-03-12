"use client";

import { useState, useRef } from "react";

const PRODUCT_OPTIONS = [
  "Coroplast Signs",
  "Vinyl Banners",
  "Business Cards",
  "ACP Aluminum Signs",
  "Vehicle Magnets",
  "Flyers / Brochures",
  "Window Decals",
  "Retractable Banners",
  "Stickers",
  "Other / Not Sure",
];

// Shared input class — light theme, visible focus ring (WCAG 2.1 AA)
const inputCls =
  "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/60 focus:border-[#16C2F3] transition-colors";

const labelCls = "block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-1.5";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const email = (fd.get("email") as string).trim();
    const phone = (fd.get("phone") as string).trim();
    const product = (fd.get("product") as string).trim() || "Not specified";
    const message = (fd.get("message") as string).trim();

    const payload = new FormData();
    payload.append("name", name);
    payload.append("email", email);
    if (phone) payload.append("phone", phone);
    payload.append(
      "items",
      JSON.stringify([
        {
          product,
          qty: "TBD",
          material: "",
          dimensions: "",
          sides: "1",
          notes: message,
        },
      ])
    );

    try {
      const res = await fetch("/api/quote-request", { method: "POST", body: payload });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok || !data.sent) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("sent");
        formRef.current?.reset();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#16C2F3]/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-[#1c1712] font-semibold text-lg">Message sent!</p>
        <p className="text-gray-500 text-sm max-w-xs">
          We&rsquo;ll reply to your email within 1 business day. Check your inbox for a confirmation.
        </p>
        {/* min-h-[44px] satisfies WCAG 2.5.5 touch target size */}
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 min-h-[44px] px-4 text-[#16C2F3] text-sm font-semibold hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/60 rounded"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className={labelCls}>
            Your Name <span className="text-[#16C2F3]" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Jane Smith"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelCls}>
            Email <span className="text-[#16C2F3]" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelCls}>
          Phone <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          maxLength={20}
          autoComplete="tel"
          placeholder="(306) 555-0000"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="contact-product" className={labelCls}>
          What do you need?
        </label>
        <select
          id="contact-product"
          name="product"
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">Select a product...</option>
          {PRODUCT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelCls}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          maxLength={500}
          placeholder="Size, quantity, deadline, or any other details..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full min-h-[48px] bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16C2F3] focus:ring-offset-2 focus:ring-offset-white"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>

      <p className="text-gray-500 text-xs text-center">
        Or call us directly at{" "}
        <a
          href="tel:+13069548688"
          className="text-gray-700 hover:text-[#16C2F3] transition-colors underline underline-offset-2"
        >
          (306) 954-8688
        </a>
      </p>
    </form>
  );
}
