"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { SocialPost } from "@/lib/types/social";

interface Notification {
  id: string;
  platform: string;
  status: string;
  campaign?: string;
  postType?: string;
  at: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  facebook: "🌐",
  gbp: "📍",
  tiktok: "🎵",
};

export function RealtimeStatusRail() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let active = true;
    let initialized = false;
    const seen = new Set<string>();
    const controller = new AbortController();
    const dismissTimers = new Set<ReturnType<typeof setTimeout>>();
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/staff/social/posts?limit=1000", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const posts: SocialPost[] = await response.json();
        if (!active || !Array.isArray(posts)) return;
        const next: Notification[] = [];
        for (const post of posts) for (const result of post.results ?? []) {
          const id = `${result.id}:${result.status}`;
          if (!seen.has(id) && initialized) next.push({ id, platform: result.platform, status: result.status, at: Date.now() });
          seen.add(id);
        }
        initialized = true;
        if (!next.length) return;
        setNotifications(prev => [...prev, ...next].slice(-3));
        const timer = setTimeout(() => {
          dismissTimers.delete(timer);
          if (active) setNotifications(prev => prev.filter(n => !next.some(item => item.id === n.id)));
        }, 10000);
        dismissTimers.add(timer);
      } catch { /* Keep status quiet while disconnected. */ }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      dismissTimers.forEach(clearTimeout);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
              n.status === "published"
                ? "bg-green-600 text-white"
                : n.status === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-[#1c1712] text-white"
            }`}
          >
            <span>{PLATFORM_ICONS[n.platform] ?? "📣"}</span>
            <span className="capitalize">{n.platform}</span>
            <span className="opacity-60">—</span>
            <span>{n.status === "published" ? "✓ published" : n.status === "failed" ? "✕ failed" : "posting…"}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
