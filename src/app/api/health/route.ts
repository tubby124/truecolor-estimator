/**
 * GET /api/health
 *
 * Public health check — verifies env var SHAPES (not values), no secrets returned.
 * Used as Railway health check endpoint AND by harness to validate prod config.
 *
 * Returns 200 when every hard requirement is present. Warnings remain healthy,
 * but a hard config failure returns 503 so Railway rejects the broken deployment.
 */

import { NextResponse } from "next/server";
import { getQuoteTurnstileConfig } from "@/lib/quote-request-guard";

type Severity = "fail" | "warn";

interface Check {
  name: string;
  ok: boolean;
  severity?: Severity; // present only when !ok
  note?: string;
}

// Hard requirement: missing/malformed value breaks a flow (fail-closed outage, dead links).
function checkRequired(
  key: string,
  validator: (v: string) => boolean,
  failNote: string
): Check {
  const val = process.env[key];
  if (!val) return { name: key, ok: false, severity: "fail", note: "not set" };
  if (!validator(val)) return { name: key, ok: false, severity: "fail", note: failNote };
  return { name: key, ok: true };
}

// Soft recommendation: deviation works but is suboptimal. Never an outage.
function checkRecommended(
  key: string,
  validator: (v: string) => boolean,
  warnNote: string
): Check {
  const val = process.env[key];
  if (!val) return { name: key, ok: false, severity: "fail", note: "not set" };
  if (!validator(val)) return { name: key, ok: false, severity: "warn", note: warnNote };
  return { name: key, ok: true };
}

export async function GET() {
  const checks: Check[] = [];

  // Payment token — 64 hex is the documented 32-byte HMAC standard. A shorter
  // secret STILL produces valid signatures (HMAC works with any key length), so
  // a deviation is a WARN, not an outage. Critically: rotating this to fix the
  // format invalidates EVERY outstanding pay link (30-day window) — so do not
  // "fix" casually. Only present (not set) is a hard fail.
  checks.push(
    checkRecommended(
      "PAYMENT_TOKEN_SECRET",
      (v) => /^[0-9a-f]{64}$/i.test(v),
      "below 64-hex/32-byte standard — works, but lower entropy. Do NOT rotate casually (invalidates all outstanding pay links). Rotate only during a low-unpaid-order window."
    )
  );

  // Site URL — wrong value puts ephemeral hosts in emailed pay links = dead links.
  checks.push(
    checkRequired(
      "NEXT_PUBLIC_SITE_URL",
      (v) => v === "https://truecolorprinting.ca",
      "must be https://truecolorprinting.ca (not vercel/railway ephemeral) — wrong value breaks emailed pay links"
    )
  );

  // Webhook + cron secrets — missing = fail-closed = silently drops ALL events.
  for (const key of [
    "CLOVER_WEBHOOK_SECRET",
    "WAVE_WEBHOOK_SECRET",
    "BREVO_WEBHOOK_SECRET",
    "RESEND_WEBHOOK_SECRET",
    "CRON_SECRET",
  ]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      severity: process.env[key] ? undefined : "fail",
      note: process.env[key] ? undefined : "not set — webhook/cron rejects ALL requests (fail-closed outage)",
    });
  }
  checks.push({
    name: "CLOVER_SIGNING_SECRET",
    ok: Boolean(process.env.CLOVER_SIGNING_SECRET),
    severity: process.env.CLOVER_SIGNING_SECRET ? undefined : "warn",
    note: process.env.CLOVER_SIGNING_SECRET
      ? undefined
      : "not set — legacy ?k= webhook secret still works, but first-class Clover signature verification is not active",
  });

  // API keys — missing = that integration is dead.
  for (const key of [
    "WAVE_API_TOKEN",
    "CLOVER_ECOMM_PRIVATE_KEY",
    "CLOVER_MERCHANT_ID",
    "BREVO_API_KEY",
    "RESEND_API_KEY",
  ]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      severity: process.env[key] ? undefined : "fail",
      note: process.env[key] ? undefined : "not set",
    });
  }

  // Supabase — missing = app can't read/write orders.
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      severity: process.env[key] ? undefined : "fail",
      note: process.env[key] ? undefined : "not set",
    });
  }

  const turnstile = getQuoteTurnstileConfig(
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
  );
  checks.push({
    name: "CLOUDFLARE_TURNSTILE_KEY_PAIR",
    ok: turnstile.valid,
    severity: turnstile.valid ? undefined : "fail",
    note: turnstile.issue ?? undefined,
  });

  // Telegram — fail-quiet by design, so missing is only a WARN (alerts go silent).
  for (const key of ["TRUE_COLOR_TELEGRAM_BOT_TOKEN", "TRUE_COLOR_TELEGRAM_CHAT_ID"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      severity: process.env[key] ? undefined : "warn",
      note: process.env[key] ? undefined : "not set — Telegram alerts silenced (no outage, but you go blind to failures)",
    });
  }

  const issues = checks.filter((c) => !c.ok);
  const fails = issues.filter((c) => c.severity === "fail");
  const warns = issues.filter((c) => c.severity === "warn");

  const healthy = fails.length === 0;

  return NextResponse.json({
    ok: healthy,
    config_clean: issues.length === 0,
    has_failures: !healthy,
    checks_total: checks.length,
    fail_count: fails.length,
    warn_count: warns.length,
    issues: issues.length > 0 ? issues : undefined,
    checks,
  }, { status: healthy ? 200 : 503 });
}
