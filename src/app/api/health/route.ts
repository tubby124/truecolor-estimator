/**
 * GET /api/health
 *
 * Public health check — verifies configuration internally without exposing it.
 * Used as Railway's readiness endpoint; detailed configuration validation stays
 * in local/operator tooling rather than a public API response.
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

export async function GET() {
  const checks: Check[] = [];

  // Payment token — 64 hex is the documented 32-byte HMAC standard. A shorter
  // secret STILL produces valid signatures (HMAC works with any key length), so
  // a deviation is a WARN, not an outage. Critically: rotating this to fix the
  // format invalidates EVERY outstanding pay link (30-day window) — so do not
  // "fix" casually. Only present (not set) is a hard fail.
  const legacySecret = process.env.PAYMENT_TOKEN_SECRET;
  const nextSecret = process.env.PAYMENT_TOKEN_SECRET_NEXT;
  if (!legacySecret && !nextSecret) {
    checks.push({ name: "PAYMENT_TOKEN_SECRET", ok: false, severity: "fail", note: "not set" });
  } else {
    for (const [key, value] of [
      ["PAYMENT_TOKEN_SECRET", legacySecret],
      ["PAYMENT_TOKEN_SECRET_NEXT", nextSecret],
    ] as const) {
      if (!value) continue;
      checks.push({
        name: key,
        ok: /^[0-9a-f]{64}$/i.test(value),
        severity: /^[0-9a-f]{64}$/i.test(value) ? undefined : "warn",
        note: /^[0-9a-f]{64}$/i.test(value)
          ? undefined
          : "below 64-hex/32-byte standard — works, but lower entropy. Do NOT rotate casually.",
      });
    }
  }

  const legacyUntil = process.env.PAYMENT_TOKEN_LEGACY_UNTIL;
  if (nextSecret && legacySecret) {
    const cutoff = legacyUntil && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(legacyUntil)
      ? Date.parse(legacyUntil)
      : Number.NaN;
    const canonical = Number.isFinite(cutoff)
      && new Date(cutoff).toISOString() === (legacyUntil?.includes(".") ? legacyUntil : legacyUntil?.replace("Z", ".000Z"));
    checks.push({
      name: "PAYMENT_TOKEN_LEGACY_UNTIL",
      ok: canonical,
      severity: canonical ? undefined : "fail",
      note: canonical ? undefined : "must be a canonical UTC timestamp while staged payment-key rotation is active",
    });
  }

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

  const fails = checks.filter((c) => !c.ok && c.severity === "fail");

  const healthy = fails.length === 0;

  return NextResponse.json({ ok: healthy }, { status: healthy ? 200 : 503 });
}
