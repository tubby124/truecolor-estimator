"use client";

import { useState, useRef, useEffect } from "react";
import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";

interface Props {
  result: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
  onClose: () => void;
}

type SendState = "idle" | "sending" | "success" | "error";

interface WaveResult {
  invoiceNumber: string;
  invoiceId: string;
  viewUrl: string | null;
  action: "draft" | "approved" | "sent";
}

export function WaveModal({ result, jobDetails, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sendViaWave, setSendViaWave] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [waveResult, setWaveResult] = useState<WaveResult | null>(null);
  const [copied, setCopied] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Focus first focusable element on open
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // runs once on mount

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailInvalid = emailTouched && !emailValid;

  const handleCreate = async () => {
    if (!emailValid) { setEmailTouched(true); return; }

    setSendState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/staff/quote/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name.trim() || undefined,
          quoteData: result,
          jobDetails: {
            qty: jobDetails.qty,
            isRush: jobDetails.isRush,
            categoryLabel: jobDetails.categoryLabel,
          },
          action: sendViaWave ? "send" : "draft",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create Wave invoice");
      }

      setWaveResult({
        invoiceNumber: data.invoiceNumber,
        invoiceId: data.invoiceId,
        viewUrl: data.viewUrl,
        action: data.action,
      });
      setSendState("success");
    } catch (err) {
      setSendState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const copyViewUrl = async () => {
    if (!waveResult?.viewUrl) return;
    await navigator.clipboard.writeText(waveResult.viewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sellPrice = result.sell_price ?? 0;
  const total = Math.round(sellPrice * 1.05 * 100) / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create Wave Invoice
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {jobDetails.categoryLabel} · <span className="font-mono">${total.toFixed(2)} total incl. GST</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {sendState === "success" && waveResult ? (
          <SuccessView result={waveResult} onClose={onClose} copied={copied} onCopyUrl={copyViewUrl} />
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
                    : "border-[var(--border)] focus:border-blue-500 focus:ring-blue-500"
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
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Send via Wave toggle */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <input
                id="wave-send-toggle"
                type="checkbox"
                checked={sendViaWave}
                onChange={(e) => setSendViaWave(e.target.checked)}
                disabled={sendState === "sending"}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="wave-send-toggle" className="text-xs text-blue-800 cursor-pointer leading-relaxed">
                <span className="font-semibold">Send invoice to customer via Wave</span>
                <br />
                <span className="text-blue-700">Customer receives a Wave-hosted payment link by email (approve + send)</span>
              </label>
            </div>

            {/* Info note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-500 leading-relaxed">
                {sendViaWave
                  ? "Invoice will be approved and emailed to the customer. They can pay online via Wave's hosted payment page."
                  : "A DRAFT invoice will appear in Wave accounting but won't be sent. Staff can review and send from the Wave dashboard."}
              </p>
            </div>

            {/* Error */}
            {sendState === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 font-medium mb-0.5">Failed to create invoice</p>
                <p className="text-xs text-red-600">{errorMsg}</p>
              </div>
            )}

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
                onClick={handleCreate}
                disabled={sendState === "sending"}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {sendState === "sending" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  sendViaWave ? "Create & Send →" : "Create Draft →"
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function SuccessView({
  result,
  onClose,
  copied,
  onCopyUrl,
}: {
  result: WaveResult;
  onClose: () => void;
  copied: boolean;
  onCopyUrl: () => void;
}) {
  const actionLabel =
    result.action === "sent"
      ? "Invoice sent to customer via Wave"
      : result.action === "approved"
      ? "Invoice created & approved (send failed — check Wave)"
      : "Draft invoice created in Wave";

  const waveAppUrl = "https://next.waveapps.com/dashboard/invoicing/";

  return (
    <div className="px-6 py-8">
      {/* Success icon */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold">Invoice #{result.invoiceNumber}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{actionLabel}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 mb-5">
        <a
          href={waveAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Wave Dashboard
        </a>

        {result.viewUrl && (
          <button
            onClick={onCopyUrl}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : "Copy Customer Payment Link"}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:border-gray-400 transition-all"
      >
        Done
      </button>
    </div>
  );
}
