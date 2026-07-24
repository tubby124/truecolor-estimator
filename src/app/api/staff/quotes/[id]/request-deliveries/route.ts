import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDER_MESSAGE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,299}$/;

function singleRpcRow<T>(data: unknown, message: string): T {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error(message);
  return row as T;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid quote id" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(
      "list_quote_request_deliveries",
      { p_quote_id: id },
    );
    if (error) throw new Error(error.message || "Could not load quote deliveries");

    return NextResponse.json({ deliveries: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("[staff/quotes/request-deliveries/get]", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      deliveryId?: unknown;
      resolution?: unknown;
      providerMessageId?: unknown;
    };
    const deliveryId =
      typeof body.deliveryId === "string" ? body.deliveryId : "";
    const resolution =
      body.resolution === "confirm_sent" || body.resolution === "confirm_not_sent"
        ? body.resolution
        : "";
    const providerMessageId =
      typeof body.providerMessageId === "string"
        ? body.providerMessageId.trim()
        : "";

    if (
      !UUID_RE.test(id) ||
      !UUID_RE.test(deliveryId) ||
      !resolution ||
      (
        resolution === "confirm_sent" &&
        !PROVIDER_MESSAGE_ID_RE.test(providerMessageId)
      ) ||
      (
        resolution === "confirm_not_sent" &&
        providerMessageId.length > 0
      )
    ) {
      return NextResponse.json(
        { error: "A valid delivery and resolution are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(
      "resolve_stale_quote_request_delivery",
      {
        p_quote_id: id,
        p_delivery_id: deliveryId,
        p_resolution: resolution,
        p_provider_message_id: providerMessageId || null,
        p_actor: staffCheck.email ?? staffCheck.id ?? "staff",
      },
    );
    if (error) throw new Error(error.message || "Could not resolve quote delivery");
    const resolved = singleRpcRow<{
      delivery_status: string;
      delivery_channel: string;
    }>(data, "Quote delivery resolution returned an invalid result");

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "quote.request_delivery_resolved",
      entity_type: "quote",
      entity_id: id,
      detail: {
        delivery_id: deliveryId,
        channel: resolved.delivery_channel,
        resolution,
        delivery_status: resolved.delivery_status,
        provider_message_id:
          resolution === "confirm_sent" ? providerMessageId : null,
      },
    });

    return NextResponse.json({
      ok: true,
      deliveryId,
      channel: resolved.delivery_channel,
      status: resolved.delivery_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    console.error("[staff/quotes/request-deliveries/resolve]", message);
    const notStale =
      /QUOTE_REQUEST_DELIVERY_RESOLUTION_NOT_STALE/.test(message);
    const notFound = /QUOTE_REQUEST_DELIVERY_NOT_FOUND/.test(message);
    const invalid = /QUOTE_REQUEST_DELIVERY_INVALID_RESOLUTION/.test(message);
    return NextResponse.json(
      {
        error: notStale
          ? "This delivery is still inside its provider retry window."
          : notFound
            ? "Quote delivery not found"
            : invalid
              ? "This delivery cannot be resolved in its current state"
              : sanitizeError(err),
      },
      { status: notFound ? 404 : notStale ? 409 : invalid ? 400 : 500 },
    );
  }
}
