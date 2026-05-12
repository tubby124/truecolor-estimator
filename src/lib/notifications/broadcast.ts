import { createServiceClient } from "@/lib/supabase/server";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const CHANNEL_NAME = "tc-staff-notifs";

export type StaffNotificationEvent = "quote.created" | "order.paid";

/**
 * Emit a server-side Supabase Broadcast event to all subscribed staff clients.
 *
 * Fail-quiet by design — Broadcast is a notification side-channel.
 * It must never break the route that called it.
 *
 * Why Broadcast over Postgres CDC: `quote_requests` has service-role-only RLS,
 * so browser clients can't subscribe to row INSERT events on it. Broadcast
 * channels don't touch RLS — server emits, client subscribes by channel name.
 */
export async function broadcastStaffNotification(
  event: StaffNotificationEvent,
  payload: Record<string, unknown>
): Promise<void> {
  let supabase: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;
  try {
    supabase = createServiceClient();
    channel = supabase.channel(CHANNEL_NAME);
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Unknown";
    console.error(`[broadcast] send failed: ${name}`);
  } finally {
    if (supabase && channel) {
      try {
        await supabase.removeChannel(channel);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
