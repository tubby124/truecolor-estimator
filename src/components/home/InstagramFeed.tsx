"use client";

import { useEffect, useRef } from "react";

const FEED_SCRIPT_URL =
  "https://cdn.trustindex.io/loader-feed.js?f60bd1266a949943bc6687c079d";

export function InstagramFeed() {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = feedRef.current;
    if (!container) return;
    // Guard: don't inject twice (React StrictMode double-mount)
    if (container.querySelector("script")) return;

    const script = document.createElement("script");
    script.src = FEED_SCRIPT_URL;
    script.defer = true;
    script.async = true;
    container.appendChild(script);

    return () => {
      // Cleanup on unmount — remove injected widget + script
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return (
    <div
      ref={feedRef}
      className="min-h-[340px] flex items-center justify-center"
    >
      <p className="text-gray-400 text-sm">Loading latest projects...</p>
    </div>
  );
}
