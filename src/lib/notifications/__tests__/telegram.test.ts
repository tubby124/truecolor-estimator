import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendTelegramNotification, escapeTelegramHtml } from "../telegram";

describe("sendTelegramNotification", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      TRUE_COLOR_TELEGRAM_BOT_TOKEN: "fake-token",
      TRUE_COLOR_TELEGRAM_CHAT_ID: "12345",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("posts to the Telegram API with the chat_id and message", async () => {
    await sendTelegramNotification("hello");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botfake-token/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("12345");
    expect(body.text).toBe("hello");
    expect(body.parse_mode).toBe("HTML");
  });

  it("does nothing if env vars are missing", async () => {
    process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN = "";
    await sendTelegramNotification("hello");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("swallows network errors silently", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    await expect(sendTelegramNotification("hello")).resolves.toBeUndefined();
  });

  it("swallows Telegram API 5xx errors silently", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("server error", { status: 500 })
    );
    await expect(sendTelegramNotification("hello")).resolves.toBeUndefined();
  });

  it("does not include err.message in console.error on network failures", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Simulate a fetch error whose message contains the bot token (worst case).
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new TypeError("fetch failed to https://api.telegram.org/botfake-token/sendMessage")
    );
    await sendTelegramNotification("hello");
    const allLogs = consoleSpy.mock.calls.flat().join(" ");
    expect(allLogs).not.toContain("fake-token");
    expect(allLogs).toContain("TypeError");
    consoleSpy.mockRestore();
  });
});

describe("escapeTelegramHtml", () => {
  it("escapes < > and &", () => {
    expect(escapeTelegramHtml("<a href=\"evil.com\">x</a>")).toBe(
      "&lt;a href=\"evil.com\"&gt;x&lt;/a&gt;"
    );
    expect(escapeTelegramHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("returns the input unchanged when no special chars present", () => {
    expect(escapeTelegramHtml("Acme Corp")).toBe("Acme Corp");
    expect(escapeTelegramHtml("smoke@example.com")).toBe("smoke@example.com");
  });

  it("handles empty string", () => {
    expect(escapeTelegramHtml("")).toBe("");
  });
});
