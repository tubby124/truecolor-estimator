import { describe, it, expect, vi, beforeEach } from "vitest";
import { broadcastStaffNotification } from "../broadcast";

const sendMock = vi.fn();
const removeChannelMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    channel: () => ({
      send: sendMock,
    }),
    removeChannel: removeChannelMock,
  }),
}));

describe("broadcastStaffNotification", () => {
  beforeEach(() => {
    sendMock.mockReset();
    removeChannelMock.mockReset();
    sendMock.mockResolvedValue("ok");
  });

  it("sends a broadcast event with the given type and payload", async () => {
    await broadcastStaffNotification("quote.created", { id: "q1", name: "Acme" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      type: "broadcast",
      event: "quote.created",
      payload: { id: "q1", name: "Acme" },
    });
  });

  it("cleans up the channel after send", async () => {
    await broadcastStaffNotification("order.paid", { id: "o1" });
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it("swallows errors silently", async () => {
    sendMock.mockRejectedValue(new Error("broadcast down"));
    await expect(
      broadcastStaffNotification("quote.created", { id: "q1" })
    ).resolves.toBeUndefined();
  });
});
