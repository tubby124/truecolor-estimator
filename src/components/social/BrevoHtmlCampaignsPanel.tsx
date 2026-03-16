"use client";

import type { BrevoHtmlCampaign } from "@/lib/types/blitz";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Regina",
  });
}

function openRateColor(rate: number, hasSent: boolean): string {
  if (!hasSent) return "text-gray-300";
  if (rate >= 30) return "text-emerald-500";
  if (rate >= 15) return "text-amber-500";
  return "text-red-500";
}

interface Props {
  campaigns: BrevoHtmlCampaign[];
}

export function BrevoHtmlCampaignsPanel({ campaigns }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-3">
              Campaign
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-3 hidden sm:table-cell">
              Sent
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-3 hidden md:table-cell">
              Delivered
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">
              Open Rate
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-3 hidden sm:table-cell">
              Clicks
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-3">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c, i) => {
            const hasSent = c.stats.sent > 0;
            const openRate = hasSent
              ? ((c.stats.uniqueOpens / c.stats.sent) * 100).toFixed(1)
              : null;
            const isScheduled = c.status === "scheduled";
            const isEven = i % 2 === 0;

            return (
              <tr
                key={c.id}
                className={`border-b border-gray-50 last:border-0 ${isEven ? "" : "bg-gray-50/50"} ${isScheduled ? "opacity-60" : ""}`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isScheduled ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-medium text-[#1c1712] text-xs truncate max-w-[220px] sm:max-w-none">
                      {c.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 hidden sm:table-cell">
                  {hasSent ? c.stats.sent.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 hidden md:table-cell">
                  {hasSent ? c.stats.delivered.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-xs font-bold ${openRateColor(
                      openRate ? parseFloat(openRate) : 0,
                      hasSent
                    )}`}
                  >
                    {openRate !== null ? `${openRate}%` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 hidden sm:table-cell">
                  {hasSent ? c.stats.clicks.toLocaleString() : "—"}
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                  {isScheduled
                    ? formatDate(c.scheduledAt)
                    : formatDate(c.sentDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
