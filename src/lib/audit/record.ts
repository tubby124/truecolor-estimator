/**
 * audit_events write helper. Fail-quiet by design — never let an audit-log
 * write break the parent operation.
 *
 * Usage:
 *   await recordAuditEvent({
 *     actor_type: "staff",
 *     actor_id: staffEmail,
 *     event_type: "order.status_changed",
 *     entity_type: "order",
 *     entity_id: order.id,
 *     detail: { from: "pending_payment", to: "in_production", reason: "manual" },
 *   });
 *
 * Read by src/app/staff/lifecycle/data.ts (Activity feed) + per-customer
 * drill-down at /staff/lifecycle/customer/[email].
 */

import { createServiceClient } from "@/lib/supabase/server";

export type AuditActorType = "customer" | "staff" | "system" | "cron";

export interface AuditEventInput {
  actor_type: AuditActorType;
  actor_id?: string | null;
  event_type: string;        // e.g. "order.status_changed", "coupon.issued"
  entity_type: string;       // "order" | "customer" | "quote" | "coupon"
  entity_id: string;
  detail?: Record<string, unknown> | null;
  ip?: string | null;
  user_agent?: string | null;
}

export async function recordAuditEvent(e: AuditEventInput): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("audit_events").insert({
      actor_type: e.actor_type,
      actor_id: e.actor_id ?? null,
      event_type: e.event_type,
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      detail: e.detail ?? null,
      ip: e.ip ?? null,
      user_agent: e.user_agent ?? null,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    // Audit write failed — log and move on. The parent operation already
    // succeeded; the audit table is a secondary observability layer.
    console.error(
      `[audit] write failed for ${e.event_type}/${e.entity_id} (non-fatal):`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Extract IP + user-agent from a Next request, for callers that want to
 * tag the event with request context.
 */
export function extractRequestContext(req: Request): { ip: string | null; user_agent: string | null } {
  const headers = req.headers;
  // Railway sets x-forwarded-for; Vercel sets x-real-ip; fallback to null.
  const xff = headers.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0]?.trim() : headers.get("x-real-ip");
  const user_agent = headers.get("user-agent");
  return { ip: ip ?? null, user_agent: user_agent ?? null };
}
