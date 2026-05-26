/**
 * GET /api/health
 *
 * Public health check — verifies env var SHAPES (not values), no secrets returned.
 * Used as Railway health check endpoint AND by harness to validate prod config.
 *
 * Returns 200 with ok:true even on config warnings so Railway doesn't restart the
 * container. Issues are surfaced in the response body for harness consumption.
 */

import { NextResponse } from "next/server";

interface Check {
  name: string;
  ok: boolean;
  note?: string;
}

function checkEnvShape(
  key: string,
  validator: (v: string) => boolean,
  failNote: string
): Check {
  const val = process.env[key];
  if (!val) return { name: key, ok: false, note: "not set" };
  if (!validator(val)) return { name: key, ok: false, note: failNote };
  return { name: key, ok: true };
}

export async function GET() {
  const checks: Check[] = [];

  // Payment token — must be 64 hex chars (rotating this invalidates ALL outstanding pay links)
  checks.push(
    checkEnvShape(
      "PAYMENT_TOKEN_SECRET",
      (v) => /^[0-9a-f]{64}$/i.test(v),
      "must be exactly 64 hex characters"
    )
  );

  // Site URL — must NOT be a Vercel or Railway ephemeral host
  checks.push(
    checkEnvShape(
      "NEXT_PUBLIC_SITE_URL",
      (v) => v === "https://truecolorprinting.ca",
      "must be https://truecolorprinting.ca (not vercel/railway ephemeral)"
    )
  );

  // Webhook secrets — presence only (not value)
  for (const key of ["CLOVER_WEBHOOK_SECRET", "WAVE_WEBHOOK_SECRET", "BREVO_WEBHOOK_SECRET", "CRON_SECRET"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      note: process.env[key] ? undefined : "not set — webhook/cron will reject ALL requests (fail-closed)",
    });
  }

  // API keys — presence only
  for (const key of ["WAVE_API_TOKEN", "CLOVER_ECOMM_PRIVATE_KEY", "CLOVER_MERCHANT_ID", "BREVO_API_KEY"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      note: process.env[key] ? undefined : "not set",
    });
  }

  // Supabase — presence only
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      note: process.env[key] ? undefined : "not set",
    });
  }

  // Telegram — presence only (fail-quiet if missing, but good to know)
  for (const key of ["TRUE_COLOR_TELEGRAM_BOT_TOKEN", "TRUE_COLOR_TELEGRAM_CHAT_ID"]) {
    checks.push({
      name: key,
      ok: Boolean(process.env[key]),
      note: process.env[key] ? undefined : "not set — Telegram alerts silenced",
    });
  }

  const allOk = checks.every((c) => c.ok);
  const issues = checks.filter((c) => !c.ok);

  return NextResponse.json({
    ok: true, // always 200 so Railway health check passes
    config_clean: allOk,
    checks_total: checks.length,
    issues_count: issues.length,
    issues: issues.length > 0 ? issues : undefined,
    checks: checks,
  });
}
