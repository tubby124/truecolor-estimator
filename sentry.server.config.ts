/**
 * Sentry server-side init. Captures errors thrown in API routes + RSC.
 * No-op when SENTRY_DSN is unset.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_DEV === "1",
    // Strip PII from server errors before they leave the box
    beforeSend(event) {
      // Remove request bodies (may contain customer PII / card data we don't want in Sentry)
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },
  });
}
