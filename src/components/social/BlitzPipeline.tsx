"use client";

import { motion } from "motion/react";
import type { BlitzCampaign, CampaignStage } from "@/lib/types/blitz";

const STAGES: { key: CampaignStage; label: string; dot: string }[] = [
  { key: "draft", label: "Draft", dot: "bg-gray-300" },
  { key: "canary", label: "Canary", dot: "bg-amber-400" },
  { key: "ramping", label: "Ramping", dot: "bg-blue-400" },
  { key: "active", label: "Active", dot: "bg-green-500" },
  { key: "completed", label: "Completed", dot: "bg-green-700" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "< 1 hr ago";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface Props {
  campaigns: BlitzCampaign[];
}

export function BlitzPipeline({ campaigns }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {STAGES.map((stage) => {
        const items = campaigns.filter((c) => c.status === stage.key);
        return (
          <div
            key={stage.key}
            className="bg-white rounded-2xl border border-gray-200 p-4 min-h-[120px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {stage.label}
              </span>
              <span className="text-[10px] font-bold text-gray-300 ml-auto">
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-gray-300 italic">No campaigns</p>
            ) : (
              <div className="space-y-2">
                {items.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-xs font-bold text-[#1c1712] truncate">
                      {campaign.name || campaign.slug}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {timeAgo(campaign.updated_at)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
