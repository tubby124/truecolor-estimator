/**
 * Sentry client-side init. Loaded into every browser page bundle.
 * No-op when NEXT_PUBLIC_SENTRY_DSN is unset (local dev / no account).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Performance tracing — sample low in prod, full in dev.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Session replay — record 10% of sessions, all error sessions.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Don't capture noise from local dev unless explicitly enabled
    enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_DEV === "1",
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Filter common noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      // Browser extensions that inject scripts and throw
      /^Script error\.?$/,
      // User offline
      /Network request failed/i,
      /Failed to fetch/i,
    ],
  });
}
