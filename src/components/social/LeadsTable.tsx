"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface Lead {
  id: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  score: number;
  drip_status: string | null;
  drip_step: number | null;
  next_email_at: string | null;
  emails_sent: number | null;
  emails_opened: number | null;
  rating: number | null;
  review_count: number | null;
}

interface ApiResponse {
  leads: Lead[];
  total: number;
  page: number;
  totalPages: number;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "bounced", label: "Bounced" },
  { key: "paused", label: "Paused" },
  { key: "queued", label: "Queued" },
];

const STATUS_PILLS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  bounced: "bg-red-100 text-red-600",
  paused: "bg-amber-100 text-amber-700",
  queued: "bg-gray-100 text-gray-500",
};

const LeadRow = React.memo(function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5">
        <span className="font-semibold text-[#1c1712]">{lead.business_name ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">{lead.email ?? "—"}</td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">{lead.city ?? "—"}</td>
      <td className="px-4 py-2.5 text-center">
        <span className={`text-xs font-bold ${
          lead.score >= 70 ? "text-[#e63020]" : lead.score >= 45 ? "text-amber-500" : "text-gray-400"
        }`}>
          {lead.score}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-center gap-0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < (lead.drip_step ?? 0) ? "bg-[#e63020]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          STATUS_PILLS[lead.drip_status ?? "queued"] ?? STATUS_PILLS.queued
        }`}>
          {lead.drip_status ?? "queued"}
        </span>
      </td>
    </tr>
  );
});

interface Props {
  nicheSlug: string;
}

export function LeadsTable({ nicheSlug }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, 300);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        status,
      });
      if (searchDebounced) params.set("q", searchDebounced);

      const res = await fetch(`/api/staff/social/blitz/${nicheSlug}/leads?${params}`);
      if (res.ok) {
        const data: ApiResponse = await res.json();
        setLeads(data.leads);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [nicheSlug, page, status, searchDebounced]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [status, searchDebounced]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                status === tab.key
                  ? "bg-[#e63020] text-white"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative sm:ml-auto sm:w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e63020]/20 focus:border-[#e63020]/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Business</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">City</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Drip</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? "70%" : j === 4 ? "100px" : "60%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {total.toLocaleString()} total · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
