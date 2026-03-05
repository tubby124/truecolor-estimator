"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { SocialCampaign } from "@/lib/types/social";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function buildProgress(campaign: SocialCampaign & { post_count?: number }) {
  let done = 0;
  const total = 5;
  if (campaign.brevo_campaign_ids?.length > 0) done++;
  if (campaign.landing_page_slug) done++;
  const igPosts = campaign.post_count ?? 0;
  if (igPosts >= 3) done += 2;
  else if (igPosts >= 1) done += 1;
  if (campaign.gbp_posts_done >= campaign.gbp_posts_total && campaign.gbp_posts_total > 0) done++;
  else if (campaign.gbp_posts_done > 0) done += 0.5;
  return Math.round((done / total) * 100);
}

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  "in-progress": { label: "In Progress", dot: "bg-amber-400" },
  "planned":     { label: "Planned",     dot: "bg-gray-300" },
  "complete":    { label: "Complete",    dot: "bg-green-500" },
  "archived":    { label: "Archived",    dot: "bg-gray-400" },
};

interface Props {
  campaign: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number };
  index: number;
}

export function CampaignCard({ campaign, index }: Props) {
  const progress = buildProgress(campaign);
  const igCount = campaign.post_count ?? 0;
  const igTarget = 3;
  const gbpDone = campaign.gbp_posts_done ?? 0;
  const gbpTotal = campaign.gbp_posts_total ?? 2;
  const breCount = campaign.brevo_campaign_ids?.length ?? 0;
  const landingUrl = campaign.landing_page_slug ? `https://truecolorprinting.ca/${campaign.landing_page_slug}` : null;
  const statusCfg = STATUS_LABEL[campaign.status] ?? { label: campaign.status, dot: "bg-gray-300" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
      style={{ borderLeftColor: campaign.campaign_color, borderLeftWidth: 4 }}
    >
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#1c1712] leading-tight">{campaign.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
              <span className="text-xs text-gray-400">{statusCfg.label}</span>
              {campaign.event_date && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs text-gray-400">{formatDate(campaign.event_date)}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/staff/social/compose?campaign=${campaign.slug}`}
            className="flex-shrink-0 text-xs font-bold text-[#e63020] border border-[#e63020]/30 hover:bg-[#e63020] hover:text-white px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
          >
            + Post
          </Link>
        </div>

        {/* Progress */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Build progress</span>
            <span className="text-xs font-black" style={{ color: campaign.campaign_color }}>{progress}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.04 + 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: campaign.campaign_color }}
            />
          </div>
        </div>

        {/* Channel grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Email */}
          <ChannelChip
            label="Email"
            done={breCount > 0}
            href="https://app.brevo.com/email-campaign/"
            doneText={`${breCount} campaign${breCount !== 1 ? "s" : ""}${campaign.lead_count > 0 ? ` · ${campaign.lead_count} leads` : ""}`}
            emptyText="No campaigns"
          />

          {/* Landing */}
          <ChannelChip
            label="Landing"
            done={!!landingUrl}
            href={landingUrl ?? undefined}
            doneText={`/${campaign.landing_page_slug}`}
            emptyText="No page"
          />

          {/* Instagram */}
          <div className="flex flex-col gap-1 bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Instagram</span>
              <span className={`text-[10px] font-bold ${igCount > 0 ? "text-[#E1306C]" : "text-gray-300"}`}>{igCount}/{igTarget}</span>
            </div>
            <Link href={`/staff/social/queue?campaign=${campaign.id}`} className="flex gap-1 hover:opacity-75 transition-opacity">
              {Array.from({ length: igTarget }).map((_, i) => (
                <span key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < igCount ? "bg-[#E1306C]" : "bg-gray-200"}`} />
              ))}
            </Link>
          </div>

          {/* GBP */}
          <div className="flex flex-col gap-1 bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">GBP</span>
              <span className={`text-[10px] font-bold ${gbpDone > 0 ? "text-amber-500" : "text-gray-300"}`}>{gbpDone}/{gbpTotal}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: gbpTotal }).map((_, i) => (
                <span key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < gbpDone ? "bg-amber-400" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChannelChip({
  label, done, href, doneText, emptyText,
}: {
  label: string;
  done: boolean;
  href?: string;
  doneText: string;
  emptyText: string;
}) {
  const inner = (
    <div className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors ${done ? "bg-green-50 hover:bg-green-100" : "bg-gray-50"}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-xs font-semibold truncate ${done ? "text-green-700" : "text-gray-300"}`}>
        {done ? doneText : emptyText}
      </span>
    </div>
  );
  if (done && href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
  }
  return inner;
}
