"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { PostStatusBadge } from "./PostStatusBadge";
import { PlatformBadges } from "./PlatformBadges";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import type { SocialPost, PostStatus, Platform } from "@/lib/types/social";

const STATUS_TABS: { key: PostStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "ready", label: "Ready" },
  { key: "posted", label: "Posted" },
  { key: "failed", label: "Failed" },
];

function formatSchedule(post: SocialPost) {
  if (post.use_next_free_slot) return "Next free slot";
  if (post.schedule_time) {
    return new Date(post.schedule_time).toLocaleDateString("en-CA", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  }
  if (post.schedule_date) return post.schedule_date;
  return "—";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface Props {
  initialPosts: SocialPost[];
  campaignFilter?: string;
}

export function PostQueueTable({ initialPosts, campaignFilter }: Props) {
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<PostStatus | "all">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("social-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts(prev => [payload.new as SocialPost, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts(prev =>
              prev.map(p => p.id === payload.new.id ? { ...p, ...(payload.new as SocialPost) } : p)
            );
          } else if (payload.eventType === "DELETE") {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = posts.filter(p => {
    if (campaignFilter && p.campaign_id !== campaignFilter) return false;
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/staff/social/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPosts(prev => prev.filter(p => p.id !== id));
      showToast("Post deleted", "success");
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(id: string, status: PostStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/staff/social/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      showToast(`Status → ${status}`, "success");
    } catch {
      showToast("Failed to update", "error");
    } finally {
      setUpdating(null);
    }
  }

  const tabCounts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? posts.length : posts.filter(p => p.status === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">Post Queue</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} post{filtered.length !== 1 ? "s" : ""}
              {campaignFilter && " · filtered by campaign"}
              {" · "}<span className="text-green-500 font-medium">● live</span>
            </p>
          </div>
          <Link
            href="/staff/social/compose"
            className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#c8281a] transition-colors"
          >
            + New Post
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[#e63020] text-[#e63020]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-[#e63020]/10 text-[#e63020]" : "bg-gray-100 text-gray-400"}`}>
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 text-sm">No posts in this view.</p>
            <Link href="/staff/social/compose" className="text-sm font-semibold text-[#e63020] hover:underline mt-3 inline-block">
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Image thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {post.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🖼️</div>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.campaign && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: post.campaign.campaign_color }}
                            >
                              {post.campaign.name}
                            </span>
                          )}
                          {post.post_type && (
                            <span className="text-xs text-gray-400 capitalize">{post.post_type} #{post.post_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <PostStatusBadge status={post.status} />
                        </div>
                      </div>

                      <p className="text-sm text-[#1c1712] mt-1.5 line-clamp-2 leading-snug">
                        {post.caption_raw || post.caption_instagram || "No caption"}
                      </p>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <PlatformBadges platforms={post.platforms as Platform[]} />
                        <span className="text-xs text-gray-400">{formatSchedule(post)}</span>
                        {post.posted_at && (
                          <span className="text-xs text-green-500">{timeAgo(post.posted_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {post.status === "draft" && (
                        <button
                          onClick={() => handleStatusChange(post.id, "ready")}
                          disabled={updating === post.id}
                          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark Ready
                        </button>
                      )}
                      {post.status === "ready" && (
                        <button
                          onClick={() => handleStatusChange(post.id, "draft")}
                          disabled={updating === post.id}
                          className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Unready
                        </button>
                      )}
                      <Link
                        href={`/staff/social/${post.id}`}
                        className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Delete post"
                      >
                        {deleting === post.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>

                  {post.error_message && (
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        ⚠️ {post.error_message}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
