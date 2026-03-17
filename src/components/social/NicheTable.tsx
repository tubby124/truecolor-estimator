"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useDebounce } from "@/hooks/useDebounce";
import type { BlitzNiche } from "@/lib/types/blitz";

const STATUS_PILLS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  canary: { label: "Canary", cls: "bg-amber-100 text-amber-700" },
  ramping: { label: "Ramping", cls: "bg-blue-100 text-blue-700" },
  paused: { label: "Paused", cls: "bg-red-100 text-red-600" },
  ready: { label: "Ready", cls: "bg-gray-100 text-gray-500" },
};

type SortKey = "lead_count" | "priority" | "display_name";
type SortDir = "asc" | "desc";

// Niches currently running on the Brevo HTML scheduled campaign track
const HTML_TRACK_NICHES = new Set([
  "construction",
  "healthcare",
  "real-estate",
  "retail",
  "events",
  "non-profits",
  "sports",
]);

interface Props {
  niches: BlitzNiche[];
}

export function NicheTable({ niches }: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sortKey, setSortKey] = useState<SortKey>("lead_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = niches;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (n) =>
          n.display_name.toLowerCase().includes(q) ||
          n.niche_slug.toLowerCase().includes(q) ||
          (n.google_categories ?? []).some((c) => c.toLowerCase().includes(q))
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "lead_count") cmp = a.lead_count - b.lead_count;
      else if (sortKey === "priority") cmp = a.priority - b.priority;
      else cmp = a.display_name.localeCompare(b.display_name);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [niches, debouncedSearch, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function getStatus(n: BlitzNiche): string {
    if (n.has_campaign && n.has_landing_page) return "active";
    if (n.has_campaign) return "canary";
    if (n.has_landing_page) return "ready";
    return "ready";
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search niches..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e63020]/20 focus:border-[#e63020]/40 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th
                className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 select-none"
                onClick={() => toggleSort("display_name")}
              >
                Niche{sortIndicator("display_name")}
              </th>
              <th
                className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 select-none"
                onClick={() => toggleSort("lead_count")}
              >
                Leads{sortIndicator("lead_count")}
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Cats
              </th>
              <th
                className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 select-none"
                onClick={() => toggleSort("priority")}
              >
                Priority{sortIndicator("priority")}
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Page
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Campaign
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">
                Track
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Status
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                  No niches match &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((niche, i) => {
                const status = getStatus(niche);
                const pill = STATUS_PILLS[status] ?? STATUS_PILLS.ready;
                return (
                  <motion.tr
                    key={niche.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-[#1c1712]">{niche.display_name}</span>
                      <span className="text-xs text-gray-300 ml-2">{niche.niche_slug}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                      {niche.lead_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs text-gray-400">
                      {(niche.google_categories ?? []).length || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        niche.priority === 1 ? "bg-[#e63020]/10 text-[#e63020]" :
                        niche.priority === 2 ? "bg-amber-100 text-amber-600" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {niche.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {niche.has_landing_page ? (
                        <span className="text-green-600 text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-gray-300 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {niche.has_campaign ? (
                        <span className="text-green-600 text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-gray-300 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {niche.has_campaign && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            n8n drip
                          </span>
                        )}
                        {HTML_TRACK_NICHES.has(niche.niche_slug) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            Brevo HTML
                          </span>
                        )}
                        {!niche.has_campaign && !HTML_TRACK_NICHES.has(niche.niche_slug) && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill.cls}`}>
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/staff/social/blitz/${niche.niche_slug}`}
                        className="text-xs font-bold text-[#e63020] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
