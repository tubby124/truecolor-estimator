import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ providerMessageId: "test" }));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));
vi.mock("../smtp", () => ({ sendEmail }));

import { sendStaffOrderNotification } from "../staffNotification";

describe("pending Clover staff notification", () => {
  beforeEach(() => {
    sendEmail.mockClear();
  });

  it("does not describe an opened checkout as captured or production-ready", async () => {
    await sendStaffOrderNotification({
      orderNumber: "TC-2026-0319",
      contact: { name: "Synthetic customer", email: "customer@example.test" },
      items: [{ product_name: "Synthetic sign", qty: 1, width_in: null, height_in: null, sides: 1, design_status: "PRINT_READY", line_total: 111 }],
      subtotal: 100,
      gst: 5,
      pst: 6,
      total: 111,
      is_rush: false,
      payment_method: "clover_pending",
      notes: null,
      filePaths: [],
      siteUrl: "https://truecolorprinting.ca",
    });

    const email = sendEmail.mock.calls[0][0];
    expect(email.subject).toContain("Clover (Pending)");
    expect(email.html).toContain("Payment request sent — awaiting payment");
    expect(email.html).toContain("Clover payment link sent to customer");
    expect(email.html).not.toContain("Card payment captured");
    expect(email.html).not.toContain("Safe to begin production");
    expect(email.text).toContain("Clover payment request sent");
    expect(email.text).toContain("Awaiting customer payment from the Clover link");
    expect(email.text).toContain("DO NOT start printing until payment is confirmed");
    expect(email.text).not.toContain("Card charged");
    expect(email.text).not.toContain("Safe to begin production");
  });
});
