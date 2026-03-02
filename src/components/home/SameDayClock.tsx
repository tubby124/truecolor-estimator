"use client";

import { useState, useEffect } from "react";

/** Returns hour (0-23), minute (0-59), and day name for Saskatchewan (CST, no DST). */
function getSaskTime() {
  const now = new Date();
  const tz = "America/Regina";
  const day = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now)
  );
  const minute = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, minute: "2-digit" }).format(now)
  );
  return { day, hour, minute };
}

/**
 * Live countdown to the same-day order cutoff (12:00 PM CST).
 * Renders a small line showing "Closes in Xh Ym".
 * Returns null on weekends or after noon — disappears automatically.
 */
export function SameDayClock() {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const { day, hour, minute } = getSaskTime();
      if (day === "Sat" || day === "Sun") { setCountdown(null); return; }
      const minsLeft = 12 * 60 - (hour * 60 + minute);
      if (minsLeft <= 0) { setCountdown(null); return; }
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!countdown) return null;

  return (
    <p className="text-xs text-white/80 mt-1 flex items-center justify-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" />
      </svg>
      Closes in {countdown}
    </p>
  );
}
