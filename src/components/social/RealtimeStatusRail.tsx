"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { SocialPostResult } from "@/lib/types/social";

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
  twitter: "🐦",
  tiktok: "🎵",
};

export function RealtimeStatusRail() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("social-results-rail")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_post_results" },
        (payload) => {
          const result = payload.new as SocialPostResult;
          const id = Math.random().toString(36).slice(2);
          setNotifications(prev => [
            ...prev.slice(-2), // keep max 3
            {
              id,
              platform: result.platform,
              status: result.status,
              at: Date.now(),
            },
          ]);
          // Auto-dismiss after 10s
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          }, 10_000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
