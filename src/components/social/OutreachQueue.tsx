"use client";

import { useState } from "react";
import type { BlitzLead } from "@/lib/types/blitz";

function daysAgo(iso: string | null) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d === 0 ? "today" : `${d}d ago`;
}

export function OutreachQueue({ leads }: { leads: BlitzLead[] }) {
  const [contacted, setContacted] = useState<Set<string>>(
    new Set(leads.filter((l) => l.manual_outreach_at).map((l) => l.id)),
  );
  const [loading, setLoading] = useState<string | null>(null);

  async function markContacted(leadId: string) {
    setLoading(leadId);
    try {
      const res = await fetch("/api/staff/social/blitz/outreach", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (res.ok) {
        setContacted((prev) => new Set([...prev, leadId]));
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Niche</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opens</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flagged</th>
              <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isContacted = contacted.has(lead.id);
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-100 transition-colors ${isContacted ? "bg-green-50/50 opacity-60" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1c1712] truncate max-w-[200px]">{lead.business_name ?? "—"}</p>
                    <p className="text-[11px] text-gray-400">{lead.city ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lead.drip_niche ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{lead.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${lead.score >= 70 ? "text-green-600" : lead.score >= 45 ? "text-amber-600" : "text-gray-400"}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-mono text-gray-600">{lead.drip_step ?? 0}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{lead.emails_opened ?? 0}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">{daysAgo(lead.manual_outreach_at ?? lead.drip_enrolled_at)}</td>
                  <td className="px-4 py-3 text-center">
                    {isContacted ? (
                      <span className="text-xs text-green-600 font-medium">Done</span>
                    ) : (
                      <button
                        onClick={() => markContacted(lead.id)}
                        disabled={loading === lead.id}
                        className="text-xs bg-[#1c1712] text-white px-3 py-1.5 rounded-lg hover:bg-[#2a231c] transition-colors disabled:opacity-50"
                      >
                        {loading === lead.id ? "..." : "Mark DM'd"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
