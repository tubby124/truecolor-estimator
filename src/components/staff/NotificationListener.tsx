"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "tc-staff-notifs";
const DING_PATH = "/sounds/ding.mp3";
const TOAST_DURATION_MS = 4000;
const MUTE_STORAGE_KEY = "tc.notifMuted";

type ToastEntry = {
  id: string;
  title: string;
  body: string;
};

type QuotePayload = { id?: string; name?: string; email?: string; summary?: string };
type OrderPayload = { id?: string; order_number?: string; total?: number };

export default function NotificationListener() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);
  const toastTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load mute state from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUTE_STORAGE_KEY) === "1";
      setMuted(stored);
      mutedRef.current = stored;
    } catch {
      // localStorage disabled — fine, default to unmuted
    }
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage disabled — toggle still works in memory
    }
  };

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
      // Use the ref so live mute changes are honored (state captures in closure go stale).
      if (!mutedRef.current) {
        audioRef.current?.play().catch(() => {});
      }

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

  return (
    <>
      {/* Persistent mute toggle — fixed bottom-left, out of the way of toasts. */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute staff notification sound" : "Mute staff notification sound"}
        title={muted ? "Sound muted — click to unmute" : "Click to mute notification ding"}
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 9999,
          width: 36,
          height: 36,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.1)",
          background: muted ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)",
          color: muted ? "#f87171" : "#9ca3af",
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        {muted ? "🔕" : "🔔"}
      </button>

      {toasts.length === 0 ? null : (
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
      )}
    </>
  );
}
