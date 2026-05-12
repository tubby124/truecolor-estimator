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
 *   Forces IPv4 via an undici Agent. Railway's IPv6 egress hangs on
 *   api.telegram.org (which has both A + AAAA records). Without this,
 *   Node 20 fetch picks the AAAA path and fails with "TypeError: fetch failed".
 */
import { Agent } from "undici";

const TELEGRAM_DISPATCHER = new Agent({
  // @ts-expect-error — undici Agent.connect.family is runtime-supported but mis-typed in @types/node
  connect: { family: 4 },
  connectTimeout: 5_000,
});
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
      // @ts-expect-error — `dispatcher` is a Node-undici extension to fetch options.
      dispatcher: TELEGRAM_DISPATCHER,
    });

    if (!res.ok) {
      console.error(`[telegram] API ${res.status}`);
    }
  } catch (err) {
    // Intentionally NOT logging err.message by default — it can contain the
    // request URL (with bot token) on some Node fetch failures.
    // Opt-in TC_DEBUG_TELEGRAM=1 redacts the token and logs the rest for diagnosis.
    const name = err instanceof Error ? err.name : "Unknown";
    if (process.env.TC_DEBUG_TELEGRAM === "1") {
      const tok = process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN ?? "";
      const raw = err instanceof Error ? err.message : String(err);
      const redacted = tok ? raw.split(tok).join("[REDACTED_TOKEN]") : raw;
      console.error(`[telegram] send failed: ${name} | msg=${redacted}`);
    } else {
      console.error(`[telegram] send failed: ${name}`);
    }
  }
}
