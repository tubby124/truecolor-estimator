"use client";

import { useState } from "react";

export function TriggerButton() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function trigger() {
    setState("loading");
    try {
      const res = await fetch("/api/staff/social/blitz/trigger", { method: "POST" });
      setState(res.ok ? "success" : "error");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 3000);
  }

  const label = {
    idle: "Run Engine",
    loading: "Triggering...",
    success: "Triggered",
    error: "Failed",
  }[state];

  const bg = {
    idle: "bg-[#1c1712] hover:bg-[#2a231c]",
    loading: "bg-gray-400 cursor-not-allowed",
    success: "bg-green-600",
    error: "bg-red-600",
  }[state];

  return (
    <button
      onClick={trigger}
      disabled={state === "loading"}
      className={`text-xs text-white px-4 py-2 rounded-lg font-semibold transition-colors ${bg}`}
    >
      {label}
    </button>
  );
}
