"use client";

import { useState, useEffect } from "react";
import {
  BUSINESS_INFO,
  getSameDayRushState,
  type SaskatchewanWeekday,
} from "@/lib/business-info";

/** Returns hour (0-23), minute (0-59), and day name for Saskatchewan (CST, no DST). */
function getSaskTime() {
  const now = new Date();
  const tz = BUSINESS_INFO.hours.timeZone;
  const day = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(now)
  );
  const minute = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, minute: "2-digit" }).format(now)
  );
  return { day: day as SaskatchewanWeekday, hour, minute };
}

/**
 * Live countdown to the 10:00 AM same-day order cutoff.
 * After the cutoff, asks the customer to call while the shop is open.
 * Returns null on weekends and after closing.
 * Pass className to override text styling for different backgrounds.
 */
export function SameDayClock({ className }: { className?: string }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const state = getSameDayRushState(getSaskTime());
      if (state.status === "closed") {
        setMessage(null);
        return;
      }
      if (state.status === "call") {
        setMessage("Call to confirm rush availability");
        return;
      }

      const h = Math.floor(state.minutesRemaining / 60);
      const m = state.minutesRemaining % 60;
      const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
      setMessage(`Rush cutoff in ${countdown}`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!message) return null;

  return (
    <p className={className ?? "text-xs text-white/80 mt-1 flex items-center justify-center gap-1"}>
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" />
      </svg>
      {message}
    </p>
  );
}
