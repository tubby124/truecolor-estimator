"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { SocialPost, SocialCampaign } from "@/lib/types/social";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getPostDate(post: SocialPost): string | null {
  if (post.schedule_time) return post.schedule_time.split("T")[0];
  if (post.schedule_date) return post.schedule_date;
  if (post.posted_at) return post.posted_at.split("T")[0];
  return null;
}

interface Props {
  initialPosts: SocialPost[];
  campaigns: SocialCampaign[];
}

export function CalendarGrid({ initialPosts, campaigns }: Props) {
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("social-calendar")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, (payload) => {
        if (payload.eventType === "INSERT") setPosts(p => [...p, payload.new as SocialPost]);
        else if (payload.eventType === "UPDATE") setPosts(p => p.map(x => x.id === payload.new.id ? { ...x, ...payload.new as SocialPost } : x));
        else if (payload.eventType === "DELETE") setPosts(p => p.filter(x => x.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group posts by date
  const postsByDate: Record<string, SocialPost[]> = {};
  posts.forEach(p => {
    const d = getPostDate(p);
    if (!d) return;
    postsByDate[d] = [...(postsByDate[d] ?? []), p];
  });

  // Campaign color map
  const campaignColors: Record<string, string> = {};
  campaigns.forEach(c => { campaignColors[c.id] = c.campaign_color; });

  function getCampaignColor(post: SocialPost) {
    if (post.campaign?.campaign_color) return post.campaign.campaign_color;
    if (post.campaign_id) return campaignColors[post.campaign_id] ?? "#6b7280";
    return "#6b7280";
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  // Legend
  const activeCampaigns = campaigns.filter(c => c.status === "in-progress" || c.status === "planned");

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712] tracking-tight">Content Calendar</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-medium">
              {MONTHS[month]} {year} · {posts.length} post{posts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="text-xs font-bold text-gray-500 hover:text-[#1c1712] px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Today
            </button>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#1c1712] border-r border-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-xs font-black text-[#1c1712] min-w-28 text-center px-2">
                {MONTHS[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#1c1712] border-l border-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            <Link
              href="/staff/social/compose"
              className="flex items-center gap-1.5 bg-[#e63020] text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#c8281a] transition-colors shadow-sm ml-1"
            >
              + Post
            </Link>
          </div>
        </div>
      </div>

      {/* Campaign legend */}
      {activeCampaigns.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-4 overflow-x-auto">
            <span className="text-xs text-gray-400 flex-shrink-0">Campaigns:</span>
            {activeCampaigns.map(c => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.campaign_color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-[#1c1712]">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 border-r border-b border-gray-100 bg-gray-50/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = isoDate(new Date(year, month, dayNum));
              const dayPosts = postsByDate[dateStr] ?? [];
              const isToday = dateStr === isoDate(today);
              const isPast = new Date(year, month, dayNum) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <div
                  key={dayNum}
                  className={`min-h-24 border-r border-b border-gray-100 p-1.5 ${(i + firstDay + 1) % 7 === 0 ? "border-r-0" : ""} ${isPast && !dayPosts.length ? "bg-gray-50/30" : "bg-white"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/staff/social/compose?date=${dateStr}`}
                      className="group"
                    >
                      <span
                        className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full transition-colors group-hover:bg-[#e63020] group-hover:text-white ${
                          isToday
                            ? "bg-[#e63020] text-white"
                            : isPast ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {dayNum}
                      </span>
                    </Link>
                  </div>

                  {/* Post chips */}
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map(post => (
                      <Link
                        key={post.id}
                        href={`/staff/social/${post.id}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-80 transition-opacity text-white"
                        style={{ backgroundColor: getCampaignColor(post) }}
                        title={post.caption_raw || post.caption_instagram || "Post"}
                      >
                        <span className="flex-shrink-0">
                          {post.platforms?.includes("instagram") ? "📸" : post.platforms?.includes("facebook") ? "🌐" : "🐦"}
                        </span>
                        <span className="truncate">
                          {post.post_type ?? "post"}{post.post_number ? ` #${post.post_number}` : ""}
                        </span>
                      </Link>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-[10px] text-gray-400 px-1">+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
