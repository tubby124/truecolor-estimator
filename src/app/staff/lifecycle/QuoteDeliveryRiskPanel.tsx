"use client";

import Link from "next/link";
import { useState } from "react";
import type { QuoteDeliveryHealth } from "@/lib/lifecycle/rollup";

export interface QuoteDeliveryRiskRow {
  ledger: "request" | "priced";
  quote_id: string;
  delivery_id: string;
  channel: string;
  status: string;
  resolution: string | null;
  last_error: string | null;
  stale: boolean;
  created_at: string;
}

export function QuoteDeliveryRiskPanel({
  rows,
  health,
}: {
  rows: QuoteDeliveryRiskRow[];
  health: QuoteDeliveryHealth;
}) {
  const [providerIds, setProviderIds] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (
    row: QuoteDeliveryRiskRow,
    resolution: "confirm_sent" | "confirm_not_sent",
  ) => {
    const providerMessageId = providerIds[row.delivery_id]?.trim() ?? "";
    if (resolution === "confirm_sent" && !providerMessageId) {
      setError("Enter the provider message ID before confirming sent.");
      return;
    }

    setBusy(row.delivery_id);
    setError(null);
    try {
      const suffix =
        row.ledger === "request" ? "request-deliveries" : "send-quote";
      const response = await fetch(
        `/api/staff/quotes/${row.quote_id}/${suffix}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliveryId: row.delivery_id,
            resolution,
            ...(providerMessageId ? { providerMessageId } : {}),
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not resolve delivery");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve delivery");
      setBusy(null);
    }
  };

  const queryFailed =
    health.publicQueryError > 0 || health.pricedQueryError > 0;
  if (rows.length === 0 && !queryFailed) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Quote delivery reconciliation
          </h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            no unresolved deliveries
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Quote delivery reconciliation — {rows.length}
        </h2>
        <Link href="/staff/quotes" className="text-xs text-blue-700 hover:underline">
          Open quotes
        </Link>
      </div>
      {queryFailed && (
        <p className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          One or more delivery ledgers could not be queried. Check migration and
          service-role permissions before treating this panel as complete.
        </p>
      )}
      {error && (
        <p className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {rows.map((row) => {
          const canReconcile = ["sending", "pending_confirmation"].includes(
            row.status,
          );
          return (
            <article
              key={`${row.ledger}:${row.delivery_id}`}
              className="rounded-xl border border-red-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gray-900">
                  {row.ledger === "request" ? "Initial quote email" : "Pay Now quote"}
                </span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800">
                  {row.status}
                </span>
                <span className="text-gray-500">{row.channel}</span>
                <span className="font-mono text-gray-500">
                  quote/{row.quote_id.slice(0, 8)}
                </span>
                {row.resolution && (
                  <span className="text-gray-500">{row.resolution}</span>
                )}
              </div>
              {row.last_error && (
                <p className="mt-1 text-xs text-red-700">{row.last_error}</p>
              )}
              {canReconcile && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={providerIds[row.delivery_id] ?? ""}
                    onChange={(event) =>
                      setProviderIds((current) => ({
                        ...current,
                        [row.delivery_id]: event.target.value,
                      }))
                    }
                    placeholder="Provider message ID"
                    aria-label={`Provider message ID for ${row.delivery_id}`}
                    className="min-h-10 min-w-64 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={busy === row.delivery_id}
                    onClick={() => void resolve(row, "confirm_sent")}
                    className="min-h-10 rounded bg-blue-700 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Confirm sent
                  </button>
                  {row.stale && (
                    <button
                      type="button"
                      disabled={busy === row.delivery_id}
                      onClick={() => void resolve(row, "confirm_not_sent")}
                      className="min-h-10 rounded border border-gray-300 px-3 text-xs font-semibold text-gray-700 disabled:opacity-50"
                    >
                      Confirm not sent
                    </button>
                  )}
                </div>
              )}
              {!canReconcile && (
                <p className="mt-2 text-xs text-gray-600">
                  Verify the address/provider failure, then send a corrected
                  notification or changed quote from the staff Quotes page.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
