import { describe, expect, it, vi } from "vitest";
import { processQuoteLeadConversions } from "./route";

const configuredEnv = {
  GOOGLE_ADS_QUOTE_LEAD_CONVERSION_ACTION_ID: "333",
};

describe("qualified quote lead cron pass", () => {
  it("is a no-op when the owner has not configured the action", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const supabase = { rpc: vi.fn() };
    await expect(processQuoteLeadConversions(supabase as never, { env: {} })).resolves.toEqual({
      claimed: 0,
      sent: 0,
      failed: 0,
      dormant: true,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("quote lead action not configured");
    info.mockRestore();
  });

  it("claims one attributable lead and marks it sent without retaining contact details", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const quoteRead = {
      select: () => quoteRead,
      eq: () => quoteRead,
      maybeSingle: async () => ({ data: { email: null, phone: null } }),
    };
    const outboxUpdate = {
      update: (values: Record<string, unknown>) => { updates.push(values); return outboxUpdate; },
      eq: () => outboxUpdate,
      select: () => outboxUpdate,
      maybeSingle: async () => ({ data: { id: "lead-1" }, error: null }),
    };
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: [{
        id: "lead-1",
        quote_request_id: "quote-1",
        gclid: "click-1",
        gbraid: null,
        wbraid: null,
        conversion_time: "2026-08-16T12:00:00.000Z",
        attempt_count: 1,
      }], error: null }),
      from: (table: string) => table === "quote_requests" ? quoteRead : outboxUpdate,
    };
    const upload = vi.fn().mockResolvedValue({ requestId: "request-1", enhancedConversionsApplied: true });

    await expect(processQuoteLeadConversions(supabase as never, { env: configuredEnv, upload })).resolves.toEqual({
      claimed: 1,
      sent: 1,
      failed: 0,
      dormant: false,
    });
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({
      conversion_type: "quote_submit_qualified",
      order_number: "quote-1",
      customer_email: null,
      customer_phone: null,
    }), { env: configuredEnv });
    expect(updates[0]).toMatchObject({ status: "sent", data_manager_request_id: "request-1" });
  });
});
