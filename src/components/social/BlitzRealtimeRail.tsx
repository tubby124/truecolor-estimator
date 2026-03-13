"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";

interface BlitzNotification {
  id: string;
  niche: string;
  count: number;
  at: number;
}

export function BlitzRealtimeRail() {
  const [notifications, setNotifications] = useState<BlitzNotification[]>([]);
  const batchRef = useRef<Record<string, number>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("blitz-leads-rail")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tc_leads",
          filter: "drip_status=eq.active",
        },
        (payload) => {
          const niche = (payload.new as { drip_niche?: string }).drip_niche ?? "unknown";
          batchRef.current[niche] = (batchRef.current[niche] ?? 0) + 1;

          // Debounce — flush after 3s of quiet to batch rapid updates
          if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
          flushTimerRef.current = setTimeout(() => {
            const batch = { ...batchRef.current };
            batchRef.current = {};

            for (const [nicheKey, count] of Object.entries(batch)) {
              const id = Math.random().toString(36).slice(2);
              setNotifications((prev) => [
                ...prev.slice(-2),
                { id, niche: nicheKey, count, at: Date.now() },
              ]);
              // Auto-dismiss after 10s
              setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
              }, 10_000);
            }
          }, 3_000);
        }
      )
      .subscribe();

    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[140] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto bg-[#1c1712] text-white"
          >
            <svg className="w-4 h-4 text-[#e63020]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699-2.842a4.5 4.5 0 10-6.364-6.364" />
            </svg>
            <span>
              {n.count} email{n.count !== 1 ? "s" : ""} sent — <span className="font-bold">{n.niche}</span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
