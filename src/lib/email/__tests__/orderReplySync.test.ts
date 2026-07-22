import { describe, expect, it, vi } from "vitest";
import {
  extractMessageText,
  isAutoReply,
  parseFrom,
  stripQuotedHistory,
} from "../gmailClient";
import {
  claimInboundMessage,
  containsReplyProbe,
  extractOrderReplyRecipient,
  senderMatchesOrderCustomer,
} from "../orderReplySync";

const TOKEN = "0123456789abcdef0123456789abcdef";

function encoded(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

describe("order reply recipient parsing", () => {
  it("extracts an exact token from the supported recipient headers", () => {
    expect(
      extractOrderReplyRecipient([
        { name: "To", value: "True Color <info@true-color.ca>" },
        { name: "Delivered-To", value: `info+o_${TOKEN}@true-color.ca` },
      ])
    ).toEqual({
      address: `info+o_${TOKEN}@true-color.ca`,
      recipientHeader:
        `To: True Color <info@true-color.ca>\nDelivered-To: info+o_${TOKEN}@true-color.ca`,
      token: TOKEN,
    });
  });

  it("rejects malformed tags, wrong domains, and ambiguous order tokens", () => {
    expect(
      extractOrderReplyRecipient([{ name: "To", value: "info+o_abc@true-color.ca" }])
    ).toBeNull();
    expect(
      extractOrderReplyRecipient([{ name: "To", value: `info+o_${TOKEN}@example.com` }])
    ).toBeNull();
    expect(
      extractOrderReplyRecipient([
        { name: "To", value: `info+o_${TOKEN}@true-color.ca` },
        { name: "X-Original-To", value: "info+o_ffffffffffffffffffffffffffffffff@true-color.ca" },
      ])
    ).toBeNull();
  });

  it("reports only the controlled plus-address probe", () => {
    expect(containsReplyProbe([{ name: "X-Original-To", value: "info+probe@true-color.ca" }])).toBe(true);
    expect(containsReplyProbe([{ name: "To", value: "info+other@true-color.ca" }])).toBe(false);
  });
});

describe("Gmail message parsing", () => {
  it("prefers plain text in multipart mail and trims quoted history", () => {
    const payload = {
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: encoded("New reply\n\nOn Tue, Customer wrote:\n> old") } },
        { mimeType: "text/html", body: { data: encoded("<p>HTML reply</p>") } },
      ],
    };
    expect(stripQuotedHistory(extractMessageText(payload))).toBe("New reply");
  });

  it("converts HTML-only replies to readable text", () => {
    const payload = {
      mimeType: "text/html",
      body: { data: encoded("<p>Yes &amp; thank you.<br>See you soon.</p>") },
    };
    expect(extractMessageText(payload)).toBe("Yes & thank you.\nSee you soon.");
  });

  it("parses senders, sender mismatch evidence, and auto-replies", () => {
    expect(parseFrom('"Jane Customer" <JANE@example.com>')).toEqual({
      email: "jane@example.com",
      name: "Jane Customer",
    });
    expect(senderMatchesOrderCustomer("jane@example.com", "JANE@example.com")).toBe(true);
    expect(senderMatchesOrderCustomer("other@example.com", "jane@example.com")).toBe(false);
    expect(isAutoReply("auto-replied", "", "", "Re: order")).toBe(true);
    expect(isAutoReply("", "", "", "Automatic reply: away")).toBe(true);
    expect(isAutoReply("no", "", "", "Re: order")).toBe(false);
  });
});

describe("Gmail message claim dedupe", () => {
  it("returns duplicate for the mailbox/message unique violation", async () => {
    const insert = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    await expect(claimInboundMessage(insert)).resolves.toEqual({ status: "duplicate" });
    expect(insert).toHaveBeenCalledOnce();
  });

  it("returns the durable ledger ID for a new claim and rejects other failures", async () => {
    await expect(
      claimInboundMessage(async () => ({ data: { id: "message-id" }, error: null }))
    ).resolves.toEqual({ status: "inserted", id: "message-id" });

    await expect(
      claimInboundMessage(async () => ({
        data: null,
        error: { code: "42501", message: "permission denied" },
      }))
    ).rejects.toThrow("Inbound Gmail claim failed");
  });
});
