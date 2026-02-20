"use client";

import { useState, useRef, useEffect } from "react";
import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";
import type { ProofImageState } from "@/components/estimator/ProductProof";

interface Props {
  result: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
  onClose: () => void;
  proofImage?: ProofImageState | null;
}

type SendState = "idle" | "sending" | "success" | "error";

export function EmailModal({ result, jobDetails, onClose, proofImage }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus email field when modal opens
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailInvalid = emailTouched && !emailValid;

  const handleSend = async () => {
    if (!emailValid) { setEmailTouched(true); return; }

    setSendState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          customerName: name.trim() || undefined,
          note: note.trim() || undefined,
          quoteData: result,
          jobDetails,
          proofImage: proofImage ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to send");
      }

      setSendState("success");
    } catch (err) {
      setSendState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const sellPrice = result.sell_price ?? 0;
  const total = Math.round(sellPrice * 1.05 * 100) / 100;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Email Quote</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Send to customer · {jobDetails.categoryLabel} · <span className="font-mono">${total.toFixed(2)} total</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {sendState === "success" ? (
          <SuccessView email={email} onClose={onClose} />
        ) : (
          <div className="px-6 py-5 space-y-4">

            {/* Customer email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="customer@email.com"
                disabled={sendState === "sending"}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white transition-colors ${
                  emailInvalid
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
                } disabled:opacity-50`}
              />
              {emailInvalid && (
                <p className="text-xs text-red-500 mt-1">Enter a valid email address</p>
              )}
            </div>

            {/* Customer name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Customer Name <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                disabled={sendState === "sending"}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] bg-white disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                Note to Customer <span className="text-gray-300">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. As discussed, here is your quote for the upcoming event..."
                rows={3}
                disabled={sendState === "sending"}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] bg-white resize-none disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Error */}
            {sendState === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 font-medium mb-0.5">Failed to send</p>
                <p className="text-xs text-red-600">{errorMsg}</p>
              </div>
            )}

            {/* Proof attachment notice */}
            {proofImage && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-sm">📎</span>
                <p className="text-xs text-blue-700">
                  Proof image will be attached: <span className="font-mono">{proofImage.filename}</span>
                </p>
              </div>
            )}

            {/* BCC notice */}
            <p className="text-xs text-[var(--muted)]">
              A copy will be sent to <span className="font-mono">info@true-color.ca</span>
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                disabled={sendState === "sending"}
                className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:border-gray-400 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sendState === "sending"}
                className="flex-1 py-2.5 bg-[var(--brand)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {sendState === "sending" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Quote →"
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function SuccessView({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "var(--margin-green-bg, #f0fdf4)" }}>
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#16a34a" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-semibold mb-1">Quote sent!</p>
      <p className="text-sm text-[var(--muted)] mb-6">
        Email delivered to <span className="font-mono text-[var(--foreground)]">{email}</span>.<br />
        A copy was sent to your inbox.
      </p>
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-[var(--brand)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
      >
        Done
      </button>
    </div>
  );
}
