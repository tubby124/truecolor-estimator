"use client";

import { useState } from "react";

type SyncResult = {
  matched: Record<string, number>;
  unmatched: Record<string, number>;
};

export function SyncHtmlListsButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setState("loading");
    try {
      const res = await fetch("/api/staff/social/blitz/sync-brevo-lists", { method: "POST" });
      if (res.ok) {
        const data: SyncResult = await res.json();
        setResult(data);
        setState("done");
        setTimeout(() => setState("idle"), 8000);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  if (state === "done" && result) {
    const totalMatched = Object.values(result.matched).reduce((a, b) => a + b, 0);
    return (
      <span className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded-lg font-semibold">
        Synced {totalMatched} leads
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg font-semibold">
        Sync failed
      </span>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === "loading"}
      className="text-xs bg-purple-100 text-purple-800 px-3 py-2 rounded-lg font-semibold hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === "loading" ? "Syncing…" : "Sync HTML Lists"}
    </button>
  );
}
