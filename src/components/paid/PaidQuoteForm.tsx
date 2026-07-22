"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2, Send } from "lucide-react";
import { readUtmFromStorage } from "@/components/site/UtmCapture";
import { ToastContainer, useToast } from "@/components/ui";
import { trackGenerateLead } from "@/lib/analytics";
import { appendAttributionToFormData } from "@/lib/analytics/utm";
import { PRODUCT_OPTIONS } from "@/lib/constants/products";
import { sanitizeError } from "@/lib/errors/sanitize";
import { trackPaidCta } from "@/components/paid/PaidProductLink";

type SubmitStatus = "idle" | "sending" | "sent" | "error";
type TurnstileFailure = "expired" | "error";

interface ResettableTurnstile {
  reset: () => void;
}

export const TURNSTILE_EXPIRED_MESSAGE =
  "Security verification expired. Please wait for it to refresh and try again.";
export const TURNSTILE_ERROR_MESSAGE =
  "Security verification could not load. Please refresh the page or call us at 954-8688.";

export function isPaidQuoteSubmitDisabled(params: {
  status: SubmitStatus;
  turnstileConfigured: boolean;
  turnstileToken: string;
}) {
  return params.status === "sending" || (params.turnstileConfigured && !params.turnstileToken);
}

export function resetPaidQuoteTurnstile(
  instance: ResettableTurnstile | null | undefined,
  clearToken: () => void,
) {
  clearToken();
  instance?.reset();
}

export function handlePaidQuoteTurnstileFailure(
  reason: TurnstileFailure,
  instance: ResettableTurnstile | null | undefined,
  clearToken: () => void,
  reportError: (message: string) => void,
) {
  resetPaidQuoteTurnstile(instance, clearToken);
  reportError(reason === "expired" ? TURNSTILE_EXPIRED_MESSAGE : TURNSTILE_ERROR_MESSAGE);
}

const INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-[#1c1712] outline-none transition placeholder:text-gray-400 focus:border-[#16C2F3] focus:ring-2 focus:ring-[#16C2F3]/30";
const LABEL_CLASS = "mb-1.5 block text-sm font-bold text-[#1c1712]";

export function buildPaidQuotePayload(fd: FormData, turnstileToken = ""): FormData {
  const payload = new FormData();
  payload.append("name", String(fd.get("name") ?? "").trim());
  payload.append("email", String(fd.get("email") ?? "").trim());
  const phone = String(fd.get("phone") ?? "").trim();
  if (phone) payload.append("phone", phone);
  payload.append(
    "items",
    JSON.stringify([
      {
        product: String(fd.get("product") ?? "Other / Not Sure"),
        qty: "To be confirmed",
        material: "",
        dimensions: "",
        sides: "1",
        notes: String(fd.get("details") ?? "").trim(),
      },
    ]),
  );
  if (turnstileToken) payload.append("cf-turnstile-response", turnstileToken);
  return payload;
}

export function PaidQuoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const { toasts, showToast, dismissToast } = useToast();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const turnstileConfigured = Boolean(turnstileSiteKey);

  function clearAndResetTurnstile() {
    resetPaidQuoteTurnstile(turnstileRef.current, () => setTurnstileToken(""));
  }

  function handleTurnstileFailure(reason: TurnstileFailure) {
    handlePaidQuoteTurnstileFailure(
      reason,
      turnstileRef.current,
      () => setTurnstileToken(""),
      (message) => {
        setFormError(message);
        showToast(message, "error");
      },
    );
  }

  function handleSendAnother() {
    setEmailError("");
    setFormError("");
    clearAndResetTurnstile();
    setStatus("idle");
  }

  function validateEmail(value: string) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    setEmailError(valid ? "" : "Enter a valid email address.");
    return valid;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    if (!validateEmail(email)) return;
    if (turnstileConfigured && !turnstileToken) return;

    setStatus("sending");
    setFormError("");
    trackPaidCta({ action: "submit_quote", placement: "compact_quote_form", destination: "/api/quote-request" });

    const payload = buildPaidQuotePayload(fd, turnstileToken);
    appendAttributionToFormData(payload, readUtmFromStorage());

    try {
      const response = await fetch("/api/quote-request", { method: "POST", body: payload });
      const data = (await response.json()) as { sent?: boolean };
      if (!response.ok || !data.sent) throw new Error("QUOTE_REQUEST_FAILED");

      setStatus("sent");
      form.reset();
      trackGenerateLead({ lead_source: "paid_competitor_landing", form_id: "paid-compact-quote" });
      showToast("Quote request sent. Check your inbox for confirmation.", "success");
    } catch (error) {
      const message = sanitizeError(error);
      setStatus("error");
      setFormError(message);
      showToast(message, "error");
    } finally {
      clearAndResetTurnstile();
    }
  }

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="paid-quote-heading">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_70px_rgba(28,23,18,0.10)] lg:grid-cols-[0.72fr_1.28fr]">
        <div className="bg-[#1c1712] p-6 text-white sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#16C2F3]">Custom job?</p>
          <h2 id="paid-quote-heading" className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
            Tell us the basics. We’ll price the rest.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            Use this for unusual sizes, mixed-product orders, or anything you cannot configure online.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-200">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#16C2F3]" size={17} aria-hidden="true" />No commitment</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#16C2F3]" size={17} aria-hidden="true" />A real person reviews every request</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#16C2F3]" size={17} aria-hidden="true" />Local help from the Saskatoon shop</li>
          </ul>
        </div>

        <div className="p-6 sm:p-8">
          {status === "sent" ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center" role="status" aria-live="polite">
              <CheckCircle2 size={48} className="text-[#5f8f1f]" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-black text-[#1c1712]">Request received</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                Check your inbox for confirmation. The shop will follow up with next steps.
              </p>
              <button
                type="button"
                onClick={handleSendAnother}
                className="mt-6 min-h-11 rounded-lg border border-gray-300 px-5 text-sm font-bold text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
              >
                Send another request
              </button>
            </div>
          ) : (
            <form ref={formRef} id="paid-compact-quote" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="paid-quote-name" className={LABEL_CLASS}>Name *</label>
                  <input id="paid-quote-name" name="name" required maxLength={100} autoComplete="name" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="paid-quote-email" className={LABEL_CLASS}>Email *</label>
                  <input
                    id="paid-quote-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    aria-invalid={emailError ? "true" : undefined}
                    aria-describedby={emailError ? "paid-quote-email-error" : undefined}
                    onBlur={(event) => validateEmail(event.currentTarget.value)}
                    onChange={() => emailError && setEmailError("")}
                    className={INPUT_CLASS}
                  />
                  {emailError && <p id="paid-quote-email-error" role="alert" className="mt-1.5 text-sm font-medium text-red-700">{emailError}</p>}
                </div>
                <div>
                  <label htmlFor="paid-quote-phone" className={LABEL_CLASS}>Phone (optional)</label>
                  <input id="paid-quote-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="paid-quote-product" className={LABEL_CLASS}>Product *</label>
                  <select id="paid-quote-product" name="product" required className={INPUT_CLASS} defaultValue="">
                    <option value="" disabled>Select one</option>
                    {PRODUCT_OPTIONS.map((product) => <option key={product} value={product}>{product}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="paid-quote-details" className={LABEL_CLASS}>Size, material, deadline, or other details *</label>
                  <textarea id="paid-quote-details" name="details" required maxLength={500} rows={3} placeholder="Tell us what you are making and when you need it." className={`${INPUT_CLASS} min-h-24 resize-y`} />
                </div>
              </div>

              {turnstileSiteKey && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setFormError("");
                  }}
                  onExpire={() => handleTurnstileFailure("expired")}
                  onError={() => handleTurnstileFailure("error")}
                  options={{ size: "invisible" }}
                />
              )}

              {formError && (
                <p id="paid-quote-form-error" role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isPaidQuoteSubmitDisabled({ status, turnstileConfigured, turnstileToken })}
                aria-describedby={formError ? "paid-quote-form-error" : undefined}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c92719] px-6 font-black text-white transition hover:bg-[#a91f14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c92719] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} aria-hidden="true" />
                {status === "sending" ? "Sending request…" : status === "error" ? "Try again" : "Request My Quote"}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                {turnstileConfigured && !turnstileToken
                  ? "Secure verification in progress…"
                  : "No account required · No payment due"}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
