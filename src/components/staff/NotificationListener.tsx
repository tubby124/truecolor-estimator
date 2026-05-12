"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "tc-staff-notifs";
const DING_PATH = "/sounds/ding.mp3";
const TOAST_DURATION_MS = 4000;

type ToastEntry = {
  id: string;
  title: string;
  body: string;
};

type QuotePayload = { id?: string; name?: string; email?: string; summary?: string };
type OrderPayload = { id?: string; order_number?: string; total?: number };

export default function NotificationListener() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toastTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Lazy-init the audio element once on mount.
    audioRef.current = new Audio(DING_PATH);
    audioRef.current.preload = "auto";

    const supabase = createClient();
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on("broadcast", { event: "quote.created" }, ({ payload }) => {
        const p = payload as QuotePayload;
        handleNotification({
          title: "New quote request",
          body: p.name ? `${p.name} — ${p.summary ?? "view in /staff/quotes"}` : "View in /staff/quotes",
        });
      })
      .on("broadcast", { event: "order.paid" }, ({ payload }) => {
        const p = payload as OrderPayload;
        const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "";
        handleNotification({
          title: "Order paid",
          body: `${p.order_number ?? "Order"} ${total}`.trim(),
        });
      })
      .subscribe();

    function handleNotification(entry: { title: string; body: string }) {
      // Play ding — may reject if tab is backgrounded or user hasn't interacted yet.
      audioRef.current?.play().catch(() => {});

      // Increment localStorage badge.
      try {
        const current = parseInt(localStorage.getItem("tc.notifBadge") ?? "0", 10);
        localStorage.setItem("tc.notifBadge", String(current + 1));
        window.dispatchEvent(new CustomEvent("tc:notification"));
      } catch {
        // localStorage may be disabled — non-fatal
      }

      // Show toast.
      const toastId = crypto.randomUUID();
      setToasts((prev) => [...prev, { id: toastId, ...entry }]);
      const timerId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
        toastTimersRef.current = toastTimersRef.current.filter((t) => t !== timerId);
      }, TOAST_DURATION_MS);
      toastTimersRef.current.push(timerId);
    }

    return () => {
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
      supabase.removeChannel(channel);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            maxWidth: 320,
            pointerEvents: "auto",
            borderLeft: "4px solid #e63020",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}
