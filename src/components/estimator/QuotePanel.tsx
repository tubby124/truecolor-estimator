"use client";

import { useState } from "react";
import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";
import { EmailModal } from "@/components/estimator/EmailModal";
import type { ProofImageState } from "@/components/estimator/ProductProof";

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
  // GST: derive from sell_price and total — engine calculates with config GST rate
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;
  const cost = result.cost;

  // Margin thresholds come from config.v1.csv via the engine response
  const greenThreshold = result.margin_green_threshold ?? 50;
  const yellowThreshold = result.margin_yellow_threshold ?? 30;

  const marginPct = cost && cost.total_cost !== "PLACEHOLDER" && sellPrice > 0
    ? Math.round(((sellPrice - cost.total_cost) / sellPrice) * 1000) / 10
    : null;

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

      {/* PLACEHOLDER cost warning — shown when supplier cost is missing */}
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
          {/* Strikethrough original price when bulk discount applied */}
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
          {/* Bulk discount badge */}
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
          <button
            onClick={() => window.print()}
            className="py-2.5 px-4 border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:border-gray-400 transition-all"
          >
            Print
          </button>
          <button
            onClick={() => setEmailModalOpen(true)}
            disabled={!jobDetails}
            className="flex-1 py-2.5 bg-[var(--brand)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40"
          >
            Email quote →
          </button>
          <button
            onClick={() => alert("Wave integration coming in Phase 3")}
            className="py-2.5 px-4 border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:border-gray-400 transition-all"
          >
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
    </div>
  );
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
