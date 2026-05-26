/**
 * Next.js 15+ instrumentation hook. Loads the right Sentry runtime config
 * based on which environment we're booting in. No-op when SENTRY_DSN unset.
 *
 * Required by @sentry/nextjs since Next.js deprecated sentry.{client,server,edge}.config.ts
 * as the only auto-loaded files.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
