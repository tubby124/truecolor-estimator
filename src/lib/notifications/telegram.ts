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

export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TRUE_COLOR_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] env vars missing — skipping notification");
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
    }
  } catch (err) {
    // Intentionally NOT logging err.message — it can contain the request URL
    // (with bot token) on some Node fetch failures.
    const name = err instanceof Error ? err.name : "Unknown";
    console.error(`[telegram] send failed: ${name}`);
  }
}
