"use client";

import { useState } from "react";
import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";
import { EmailModal } from "@/components/estimator/EmailModal";
import { WaveModal } from "@/components/estimator/WaveModal";
import type { ProofImageState } from "@/components/estimator/ProductProof";
import { buildSpecDiagramSvg } from "@/lib/diagram";
import { SITE_URL } from "@/lib/config";

interface Props {
  result: EstimateResponse | null;
  loading: boolean;
  isCustomerMode: boolean;
  onToggleCustomerMode: () => void;
  jobDetails?: QuoteEmailData["jobDetails"];
  proofImage?: ProofImageState | null;
}

export function QuotePanel({ result, loading, isCustomerMode, onToggleCustomerMode, jobDetails, proofImage }: Props) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [waveModalOpen, setWaveModalOpen] = useState(false);

  if (!result && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-8">
        <div className="text-4xl mb-4 opacity-30">💰</div>
        <p className="text-sm text-[var(--muted)]">Select a product and enter dimensions<br />to see your quote.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const isBlocked = result.status === "BLOCKED";
  const sellPrice = result.sell_price ?? 0;
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;
  const cost = result.cost;

  const greenThreshold = result.margin_green_threshold ?? 50;
  const yellowThreshold = result.margin_yellow_threshold ?? 30;

  const marginPct = cost && cost.total_cost !== "PLACEHOLDER" && sellPrice > 0
    ? Math.round(((sellPrice - cost.total_cost) / sellPrice) * 1000) / 10
    : null;

  const handlePrint = () => {
    if (!result || !jobDetails) return;

    // Generate a short reference from timestamp
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeRef = String(now.getHours() * 100 + now.getMinutes()).padStart(4, "0");
    const quoteRef = `Q-${dateStr}-${timeRef}`;

    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30);
    const validStr = validUntil.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
    const todayStr = now.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

    const diagramSvg = buildSpecDiagramSvg(jobDetails);

    const hasDimensions = jobDetails.widthIn && jobDetails.heightIn;
    const wFt = hasDimensions ? (jobDetails.widthIn! / 12).toFixed(2) : null;
    const hFt = hasDimensions ? (jobDetails.heightIn! / 12).toFixed(2) : null;

    const specsRow = [
      jobDetails.categoryLabel,
      hasDimensions ? `${wFt} × ${hFt} ft` : null,
      jobDetails.qty > 1 ? `Qty: ${jobDetails.qty}` : "Qty: 1",
      jobDetails.sides === 2 ? "Double-sided" : "Single-sided",
      jobDetails.materialName || null,
      jobDetails.isRush ? "⚡ RUSH ORDER" : null,
    ].filter(Boolean).join("  ·  ");

    const lineItemRows = result.line_items
      .map(item => `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${escHtml(item.description)}</td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;white-space:nowrap;font-variant-numeric:tabular-nums;">$${item.line_total.toFixed(2)}</td>
        </tr>`)
      .join("");

    const logoUrl = `${SITE_URL}/truecolorlogo.webp`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quote ${quoteRef} — True Color Display Printing</title>
  <style>
    @page { size: letter; margin: 18mm 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #111827; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e52222; }
    .logo img { height: 44px; width: auto; }
    .company-info { text-align: right; font-size: 11px; color: #6b7280; }
    .company-info strong { display: block; font-size: 13px; color: #111827; font-weight: 700; margin-bottom: 2px; }
    .meta-row { display: flex; gap: 32px; margin-bottom: 20px; }
    .meta-item { flex: 1; }
    .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 2px; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111827; }
    .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
    .specs-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 12px; color: #374151; }
    .diagram-box { background: #faf8f6; border: 1.5px solid #e2dbd4; border-radius: 8px; overflow: hidden; margin-bottom: 20px; padding: 8px; text-align: center; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    thead { background: #f9fafb; }
    th { padding: 9px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th:last-child { text-align: right; }
    .total-row td { padding: 12px 14px; font-size: 15px; font-weight: 700; background: #e52222; color: white; }
    .subtotal-row td, .gst-row td { padding: 8px 14px; font-size: 12px; background: #f9fafb; color: #6b7280; }
    .validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #166534; margin-bottom: 16px; }
    .payment-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 12px; }
    .signature-box { border-top: 2px solid #374151; margin-top: 28px; padding-top: 16px; }
    .sig-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin-bottom: 4px; }
    .sig-desc { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sig-field { border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 4px; min-height: 28px; }
    .sig-field-label { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .terms { font-size: 10px; color: #9ca3af; margin-top: 20px; line-height: 1.6; }
    .rush-banner { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #9a3412; font-weight: 600; margin-bottom: 12px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <img src="${logoUrl}" alt="True Color Display Printing" />
    </div>
    <div class="company-info">
      <strong>True Color Display Printing</strong>
      216 33rd St W (Upstairs), Saskatoon SK<br />
      (306) 954-8688 · info@true-color.ca
    </div>
  </div>

  <!-- Quote metadata -->
  <div class="meta-row">
    <div class="meta-item"><div class="meta-label">Quote #</div><div class="meta-value">${escHtml(quoteRef)}</div></div>
    <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${escHtml(todayStr)}</div></div>
    <div class="meta-item"><div class="meta-label">Valid Until</div><div class="meta-value">${escHtml(validStr)}</div></div>
  </div>

  ${jobDetails.isRush ? `<div class="rush-banner">⚡ RUSH ORDER — Same-day/priority turnaround requested</div>` : ""}

  <!-- Job specs -->
  <div class="section-label">Job Specifications</div>
  <div class="specs-box">${escHtml(specsRow)}</div>

  <!-- Spec diagram -->
  <div class="diagram-box">
    ${diagramSvg}
  </div>

  <!-- Quote table -->
  <div class="section-label">Quote Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
      <tr class="subtotal-row">
        <td>Subtotal</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums;">$${sellPrice.toFixed(2)}</td>
      </tr>
      <tr class="gst-row">
        <td>GST (5%)</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums;">$${gst.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>Total (CAD)</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums;">$${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Validity -->
  <div class="validity">✓ This quote is valid for <strong>30 days</strong> from the date above. Prices are in Canadian dollars and include GST.</div>

  <!-- Payment instructions -->
  <div class="section-label">Payment</div>
  <div class="payment-box">
    <div style="margin-bottom:8px;"><strong>Interac eTransfer</strong> — info@true-color.ca (auto-deposit enabled, no password needed)</div>
    <div style="color:#6b7280;">Or pay by card online: truecolorprinting.ca &nbsp;·&nbsp; 50% deposit required to begin production</div>
  </div>

  <!-- Signature block -->
  <div class="signature-box">
    <div class="sig-title">Customer Approval</div>
    <div class="sig-desc">By signing below, I approve the above specifications and authorize True Color Display Printing to proceed with production.</div>
    <div class="sig-grid">
      <div>
        <div class="sig-field"></div>
        <div class="sig-field-label">Authorized Signature</div>
      </div>
      <div>
        <div class="sig-field"></div>
        <div class="sig-field-label">Date</div>
      </div>
      <div>
        <div class="sig-field"></div>
        <div class="sig-field-label">Printed Name</div>
      </div>
      <div>
        <div class="sig-field"></div>
        <div class="sig-field-label">Company (if applicable)</div>
      </div>
    </div>
  </div>

  <!-- Terms -->
  <div class="terms">
    50% deposit required to begin production · Balance due on pickup · All prices in CAD · GST included at 5%<br />
    Prices valid for 30 days from quote date · Questions? Call (306) 954-8688 or email info@true-color.ca<br />
    True Color Display Printing · 216 33rd St W (Upstairs), Saskatoon SK S7M 0R1
  </div>

</body>
</html>`;

    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      alert("Print blocked by browser. Please allow pop-ups for this site, then try again.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    // Slight delay to let images/fonts load before triggering print
    printWindow.onload = () => printWindow.print();
    // Fallback if onload doesn't fire (inline HTML, no external resources)
    setTimeout(() => {
      try { printWindow.print(); } catch { /* already printed */ }
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest">Quote</h2>
        <button
          onClick={onToggleCustomerMode}
          className={`text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
            isCustomerMode
              ? "bg-[var(--brand)] text-white hover:opacity-90"
              : "bg-green-600 text-white hover:bg-green-500"
          }`}
        >
          {isCustomerMode ? "← Back to Staff View" : "Show Customer Price →"}
        </button>
      </div>

      {/* PLACEHOLDER cost warning */}
      {!isBlocked && result.has_placeholder && (
        <div
          className="rounded-xl p-3 text-sm border"
          style={{
            background: "var(--warning-bg)",
            borderColor: "var(--warning-border)",
            color: "var(--warning-text)",
          }}
        >
          ⚠ Cost estimate incomplete — supplier quote pending for {result.placeholder_materials.join(", ")}. Margin shown as TBD.
        </div>
      )}

      {/* Blocked state */}
      {isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Cannot quote</p>
          {result.clarification_notes.map((n, i) => (
            <p key={i} className="text-xs text-red-600">{n}</p>
          ))}
        </div>
      )}

      {/* Big price */}
      {!isBlocked && (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 price-animate">
          <p className="text-xs text-[var(--muted)] mb-1">Subtotal</p>
          {result.qty_discount_applied && result.qty_discount_pct && result.price_per_unit != null && (
            <p className="text-sm text-gray-400 line-through leading-none mb-0.5">
              ${(result.price_per_unit / (1 - result.qty_discount_pct / 100)).toFixed(2)} (standard rate)
            </p>
          )}
          <p className="text-4xl font-semibold tracking-tight price-animate" style={{ fontFamily: "var(--font-price)" }}>
            ${sellPrice.toFixed(2)}
          </p>
          {result.sqft_calculated && result.price_per_sqft && (
            <p className="text-sm text-[var(--muted)] mt-1">
              {result.sqft_calculated.toFixed(2)} sq ft × ${result.price_per_sqft.toFixed(2)}/sqft
            </p>
          )}
          {result.qty_discount_applied && result.qty_discount_pct && result.price_per_unit != null && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                {result.qty_discount_pct}% bulk discount
              </span>
              <span className="text-sm text-green-700 font-medium">${result.price_per_unit.toFixed(2)}/unit</span>
            </div>
          )}
          {result.min_charge_applied && (
            <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              Minimum charge applied (${result.min_charge_value?.toFixed(2)})
              {result.price_per_unit != null && result.sell_price != null &&
               result.price_per_unit < result.sell_price &&
               ` · $${result.price_per_unit.toFixed(2)}/unit`}
            </span>
          )}
        </div>
      )}

      {/* Line items */}
      {!isBlocked && result.line_items.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest">Breakdown</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {result.line_items.map((item, i) => (
              <div key={i} className="flex justify-between items-start px-4 py-3">
                <div className="flex-1 pr-4">
                  <p className="text-sm">{item.description}</p>
                  {!isCustomerMode && (
                    <p className="text-xs text-[var(--muted)] font-mono mt-0.5">{item.rule_id}</p>
                  )}
                </div>
                <p className="text-sm font-medium tabular-nums" style={{ fontFamily: "var(--font-price)" }}>
                  ${item.line_total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-[var(--border)] space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">GST (5%)</span>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-price)" }}>${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-price)" }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost / Margin — staff only */}
      {!isCustomerMode && !isBlocked && cost && (
        <div className="bg-gray-50 border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest">Cost Estimate (Internal)</p>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            <CostLine label="Material" value={cost.material_cost} />
            <CostLine label="Ink" value={cost.ink_cost} />
            <CostLine label="Labor" value={cost.labor_cost} />
            <CostLine label="Overhead" value={cost.overhead_cost} />
            {result.qty_discount_applied && result.qty_discount_pct && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Bulk discount</span>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">−{result.qty_discount_pct}%</span>
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-2 mt-2">
              <CostLine label="Total cost" value={cost.total_cost} bold />
              {marginPct !== null ? (
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-sm text-[var(--muted)]">Gross margin</span>
                  <MarginBadge pct={marginPct} greenThreshold={greenThreshold} yellowThreshold={yellowThreshold} />
                </div>
              ) : (
                <p className="text-xs text-amber-600 mt-1.5">Margin unavailable — supplier cost missing</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wave line name */}
      {!isCustomerMode && !isBlocked && result.wave_line_name && (
        <div className="bg-white border border-[var(--border)] rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">Wave Invoice Line</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono flex-1 text-gray-700">{result.wave_line_name}</p>
            <CopyButton text={result.wave_line_name} />
          </div>
        </div>
      )}

      {/* Clarification warnings */}
      {result.needs_clarification && result.clarification_notes.length > 0 && !isBlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">Needs Review</p>
          {result.clarification_notes.map((n, i) => (
            <p key={i} className="text-xs text-amber-700">{n}</p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!isBlocked && (
        <div className="flex gap-2 no-print">
          {/* Print */}
          <button
            onClick={handlePrint}
            disabled={!jobDetails}
            title="Print a customer-ready quote with signature line"
            className="py-2.5 px-3.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          {/* Email quote */}
          <button
            onClick={() => setEmailModalOpen(true)}
            disabled={!jobDetails}
            className="flex-1 py-2.5 bg-[var(--brand)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email quote →
          </button>

          {/* Wave invoice */}
          <button
            onClick={() => setWaveModalOpen(true)}
            disabled={!jobDetails}
            title="Create a Wave accounting invoice"
            className="py-2.5 px-3.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Wave
          </button>
        </div>
      )}

      {/* Email modal */}
      {emailModalOpen && result && jobDetails && (
        <EmailModal
          result={result}
          jobDetails={jobDetails}
          onClose={() => setEmailModalOpen(false)}
          proofImage={proofImage}
        />
      )}

      {/* Wave modal */}
      {waveModalOpen && result && jobDetails && (
        <WaveModal
          result={result}
          jobDetails={jobDetails}
          onClose={() => setWaveModalOpen(false)}
        />
      )}
    </div>
  );
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function CostLine({ label, value, bold }: { label: string; value: number | "PLACEHOLDER"; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-sm text-[var(--muted)]">{label}</span>
      {value === "PLACEHOLDER" ? (
        <span className="text-xs text-amber-600 font-medium">TBD</span>
      ) : (
        <span className="text-sm tabular-nums" style={{ fontFamily: "var(--font-price)" }}>
          ${(value as number).toFixed(2)}
        </span>
      )}
    </div>
  );
}

function MarginBadge({ pct, greenThreshold, yellowThreshold }: { pct: number; greenThreshold: number; yellowThreshold: number }) {
  const badgeClass = pct > greenThreshold
    ? "margin-badge--green"
    : pct >= yellowThreshold
    ? "margin-badge--yellow"
    : "margin-badge--red";

  return (
    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors p-1.5 rounded"
    >
      {copied ? (
        <span className="text-xs font-medium" style={{ color: "var(--margin-green)" }}>Copied!</span>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
