/**
 * Send a Telegram message to Hasan via @truecolorprintingbot.
 *
 * Fail-quiet by design — Telegram is a notification side-channel.
 * It must never break the route that called it.
 *
 * Env vars (Railway):
 *   TRUE_COLOR_TELEGRAM_BOT_TOKEN — bot token from BotFather
 *   TRUE_COLOR_TELEGRAM_CHAT_ID   — Hasan's chat_id
 */
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
    console.error("[telegram] send failed:", err instanceof Error ? err.message : err);
  }
}
