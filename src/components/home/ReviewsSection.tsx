"use client";

import { useEffect, useRef, useState } from "react";
import { TRUSTINDEX_LOADER_URL } from "@/lib/trustindex";

const GOOGLE_REVIEW_URL = "https://g.page/r/CZH6HlbNejQAEAE/review";
const GOOGLE_ALL_REVIEWS_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJ96tVovr3BFMRkfoeVs16NAA";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function ReviewsSection() {
  const widgetHostRef = useRef<HTMLDivElement>(null);
  const [widgetStatus, setWidgetStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const widgetHost = widgetHostRef.current;
    if (!widgetHost) return;

    widgetHost.replaceChildren();
    const loadTimeout = window.setTimeout(() => setWidgetStatus("error"), 12_000);
    let activityInterval: number | undefined;
    const stopActivityNudge = () => {
      if (activityInterval !== undefined) window.clearInterval(activityInterval);
      activityInterval = undefined;
    };

    // The widget is configured with Trustindex rich snippets enabled. The site
    // already publishes canonical LocalBusiness schema, so mark the helper as
    // handled to prevent duplicate Organization/Product schema injection.
    const schemaGuard = document.createElement("script");
    schemaGuard.type = "application/ld+json";
    schemaGuard.dataset.trustindex = "1";
    schemaGuard.text = JSON.stringify({ "@context": "https://schema.org", "@graph": [] });
    widgetHost.appendChild(schemaGuard);

    const observer = new MutationObserver(() => {
      if (widgetHost.querySelector(".ti-widget")) {
        window.clearTimeout(loadTimeout);
        stopActivityNudge();
        setWidgetStatus("ready");
        observer.disconnect();
      }
    });
    observer.observe(widgetHost, { childList: true, subtree: true });

    // Trustindex replaces its script node and manages the resulting slider.
    // Keeping that DOM inside this empty host avoids React reconciliation conflicts.
    const script = document.createElement("script");
    script.src = TRUSTINDEX_LOADER_URL;
    script.async = true;
    script.defer = true;
    const handleLoadError = () => setWidgetStatus("error");
    const handleScriptLoad = () => {
      // Trustindex waits for viewport activity when the widget starts below the
      // fold. Its HTML arrives after the loader itself, so nudge briefly until
      // the placeholder is registered and an earlier user scroll cannot be lost.
      const nudgeTrustindex = () => {
        window.dispatchEvent(new Event("mousemove"));
        window.dispatchEvent(new Event("scroll"));
      };
      nudgeTrustindex();
      activityInterval = window.setInterval(nudgeTrustindex, 250);
    };
    script.addEventListener("error", handleLoadError, { once: true });
    script.addEventListener("load", handleScriptLoad, { once: true });
    widgetHost.appendChild(script);

    return () => {
      window.clearTimeout(loadTimeout);
      stopActivityNudge();
      observer.disconnect();
      script.removeEventListener("error", handleLoadError);
      script.removeEventListener("load", handleScriptLoad);

      const trustindexWindow = window as Window & {
        tiWidgetInstances?: Array<{ widget?: Element; destroy?: () => void }>;
      };
      const instances = trustindexWindow.tiWidgetInstances;
      if (Array.isArray(instances)) {
        const ownedInstances = instances.filter(
          (instance) => instance.widget && widgetHost.contains(instance.widget),
        );
        for (const instance of ownedInstances) instance.destroy?.();
        trustindexWindow.tiWidgetInstances = instances.filter(
          (instance) => !ownedInstances.includes(instance),
        );
      }

      widgetHost.replaceChildren();
    };
  }, []);

  return (
    <section
      aria-labelledby="customer-reviews-heading"
      className="border-b border-gray-100 bg-[#f8f6f2] px-6 py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              <GoogleIcon />
              Google reviews
            </div>
            <h2 id="customer-reviews-heading" className="text-3xl font-black tracking-tight text-[#1c1712] md:text-4xl">
              Local work. Real feedback.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Recent reviews from customers who trusted us with their signs, banners, and print projects.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={GOOGLE_ALL_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1712] transition-colors hover:border-[#16C2F3] hover:text-[#087fa1]"
            >
              See all on Google
            </a>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#16C2F3] px-4 py-2.5 text-sm font-semibold text-[#1c1712] transition-colors hover:bg-[#0fb0dd]"
            >
              Leave a review
            </a>
          </div>
        </div>

        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
          <div
            ref={widgetHostRef}
            aria-busy={widgetStatus === "loading"}
            aria-label="Recent Google customer reviews"
            className={widgetStatus === "ready" ? "" : "min-h-64"}
          />

          {widgetStatus === "loading" && (
            <div className="absolute inset-5 grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-5 h-3 w-full rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-5/6 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          )}

          {widgetStatus === "error" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-sm text-gray-600">
                Reviews could not load right now.{" "}
                <a href={GOOGLE_ALL_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                  Read them on Google instead.
                </a>
              </p>
            </div>
          )}

          <noscript>
            <p className="p-6 text-center text-sm text-gray-600">
              JavaScript is required for the review slider.{" "}
              <a href={GOOGLE_ALL_REVIEWS_URL} className="font-semibold text-blue-600 underline">
                Read our reviews on Google.
              </a>
            </p>
          </noscript>
        </div>
      </div>
    </section>
  );
}
