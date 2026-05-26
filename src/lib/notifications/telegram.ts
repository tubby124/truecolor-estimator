/**
 * Send a Telegram message to Hasan via @truecolorprintingbot.
 *
 * Fail-quiet by design — Telegram is a notification side-channel.
 * It must never break the route that called it.
 *
 * Env vars (Railway):
 *   TRUE_COLOR_TELEGRAM_BOT_TOKEN — bot token from BotFather
 *   TRUE_COLOR_TELEGRAM_CHAT_ID   — Hasan's chat_id
 *
 * Security:
 *   parse_mode is HTML — callers MUST run user-supplied values through
 *   escapeTelegramHtml() before embedding them into the message string.
 *   Error logging avoids err.message to prevent token-in-URL leakage.
 *
 * Network:
 *   Forces IPv4 DNS resolution. Railway's IPv6 egress hangs on
 *   api.telegram.org (which has both A + AAAA records). Without this,
 *   Node 20 fetch picks the AAAA path and fails with "TypeError: fetch failed".
 *   setDefaultResultOrder is process-wide, but only flips order (still
 *   falls back to IPv6 if no A record exists for a given host).
 *
 * Observability (added 2026-05-26 — Round 2 harness):
 *   Every send attempt writes a row to telegram_log (success or failure).
 *   /staff/lifecycle surfaces this so silent rotation of the bot token
 *   becomes visible — previously every send was .catch(() => {}) into the void.
 */
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");
const HTML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
};

export function escapeTelegramHtml(input: string): string {
  return input.replace(/[<>&]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

async function logTelegramAttempt(opts: {
  chatId: string | null;
  category: string | null;
  ok: boolean;
  statusCode: number | null;
  error: string | null;
  messagePreview: string;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/telegram_log`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        chat_id: opts.chatId,
        category: opts.category,
        ok: opts.ok,
        status_code: opts.statusCode,
        error: opts.error,
        message_preview: opts.messagePreview.slice(0, 200),
      }),
    });
  } catch {
    // Audit log write failed — don't compound the failure.
  }
}

export async function sendTelegramNotification(
  message: string,
  category: string | null = null,
): Promise<void> {
  const token = process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TRUE_COLOR_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] env vars missing — skipping notification");
    void logTelegramAttempt({
      chatId: null, category, ok: false, statusCode: null,
      error: "TRUE_COLOR_TELEGRAM_BOT_TOKEN or CHAT_ID missing",
      messagePreview: message,
    });
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[telegram] API ${res.status}`);
      void logTelegramAttempt({
        chatId, category, ok: false, statusCode: res.status,
        error: `API ${res.status}`, messagePreview: message,
      });
      return;
    }
    void logTelegramAttempt({
      chatId, category, ok: true, statusCode: res.status,
      error: null, messagePreview: message,
    });
  } catch (err) {
    // Intentionally NOT logging err.message — it can contain the request URL
    // (with bot token) on some Node fetch failures.
    const name = err instanceof Error ? err.name : "Unknown";
    console.error(`[telegram] send failed: ${name}`);
    void logTelegramAttempt({
      chatId, category, ok: false, statusCode: null,
      error: name, messagePreview: message,
    });
  }
}
