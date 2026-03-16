"use client";

import type { BrevoHtmlCampaign, BrevoHtmlNicheGroup, BrevoHtmlNicheStep } from "@/lib/types/blitz";

// Map normalized display names → canonical niche slugs
const DISPLAY_TO_NICHE: Record<string, string> = {
  healthcare: "healthcare",
  construction: "construction",
  "real estate": "real-estate",
  agriculture: "agriculture",
  retail: "retail",
  sports: "sports",
  events: "events",
  nonprofits: "non-profits",
  "non-profits": "non-profits",
  "real-estate": "real-estate",
};

function parseCampaign(name: string): { nicheSlug: string; displayName: string; day: number } | null {
  // Pattern: "Healthcare — Day 7 — Mar 10" or "Construction — Day 0 — Feb 2026"
  const m = name.match(/^(.+?)\s*[—–\-]+\s*Day\s+(\d+)/i);
  if (!m) return null;
  const raw = m[1].trim();
  const key = raw.toLowerCase();
  const slug = DISPLAY_TO_NICHE[key] ?? key.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return { nicheSlug: slug, displayName: raw, day: parseInt(m[2], 10) };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Regina",
  });
}

function groupCampaigns(campaigns: BrevoHtmlCampaign[]): BrevoHtmlNicheGroup[] {
  const map = new Map<string, BrevoHtmlNicheGroup>();

  for (const c of campaigns) {
    const parsed = parseCampaign(c.name);
    if (!parsed) continue;

    const { nicheSlug, displayName, day } = parsed;

    if (!map.has(nicheSlug)) {
      map.set(nicheSlug, {
        nicheSlug,
        displayName,
        steps: [],
        nextTouchpoint: null,
        htmlContactedCount: 0,
      });
    }

    const group = map.get(nicheSlug)!;
    const openRate =
      c.stats.sent > 0
        ? parseFloat(((c.stats.uniqueOpens / c.stats.sent) * 100).toFixed(1))
        : null;
    const date = c.status === "sent" ? c.sentDate : c.scheduledAt;

    const step: BrevoHtmlNicheStep = {
      day,
      status: c.status === "sent" ? "sent" : "scheduled",
      date,
      openRate,
    };

    // Avoid duplicate day entries (prefer sent over scheduled)
    const existing = group.steps.findIndex((s) => s.day === day);
    if (existing >= 0) {
      if (step.status === "sent") group.steps[existing] = step;
    } else {
      group.steps.push(step);
    }

    if (c.status === "scheduled" && c.scheduledAt) {
      if (!group.nextTouchpoint || c.scheduledAt < group.nextTouchpoint) {
        group.nextTouchpoint = c.scheduledAt;
      }
    }
  }

  for (const g of map.values()) {
    g.steps.sort((a, b) => a.day - b.day);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

function StepChip({ step }: { step: BrevoHtmlNicheStep }) {
  const isSent = step.status === "sent";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
        isSent
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
      title={isSent ? `Sent ${formatDate(step.date)}` : `Scheduled ${formatDate(step.date)}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isSent ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />
      D{step.day}
      {isSent && step.openRate !== null ? (
        <span className="opacity-75">{step.openRate}%</span>
      ) : (
        <span className="opacity-60">{formatDate(step.date)}</span>
      )}
    </span>
  );
}

interface Props {
  campaigns: BrevoHtmlCampaign[];
}

export function BrevoHtmlCampaignsPanel({ campaigns }: Props) {
  const groups = groupCampaigns(campaigns);

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-400">No campaigns found — check BREVO_API_KEY</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-3">
              Niche
            </th>
            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-3">
              Sequence
            </th>
            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-3 whitespace-nowrap">
              Next Touchpoint
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, i) => (
            <tr
              key={group.nicheSlug}
              className={`border-b border-gray-50 last:border-0 ${i % 2 !== 0 ? "bg-gray-50/50" : ""}`}
            >
              {/* Niche name + badge */}
              <td className="px-5 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#1c1712] text-xs">
                    {group.displayName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 self-start">
                    Brevo HTML
                  </span>
                </div>
              </td>

              {/* Step chips */}
              <td className="px-4 py-3 align-middle">
                <div className="flex flex-wrap gap-1.5">
                  {group.steps.map((step) => (
                    <StepChip key={step.day} step={step} />
                  ))}
                </div>
              </td>

              {/* Next touchpoint */}
              <td className="px-5 py-3 text-right align-middle">
                {group.nextTouchpoint ? (
                  <span className="text-xs font-bold text-amber-600">
                    {formatDate(group.nextTouchpoint)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">No upcoming</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer: show unparsed campaigns if any were skipped */}
      {(() => {
        const parsed = campaigns.filter((c) => parseCampaign(c.name));
        const skipped = campaigns.length - parsed.length;
        if (skipped === 0) return null;
        return (
          <div className="px-5 py-2 border-t border-gray-100 text-[10px] text-gray-300">
            {skipped} campaign{skipped !== 1 ? "s" : ""} not grouped (seasonal / other format)
          </div>
        );
      })()}
    </div>
  );
}
