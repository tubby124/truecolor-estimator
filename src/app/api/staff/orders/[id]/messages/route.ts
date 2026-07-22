import { NextRequest, NextResponse } from "next/server";
import { sanitizeError } from "@/lib/errors/sanitize";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

const MESSAGE_FIELDS = [
  "id",
  "direction",
  "status",
  "from_address",
  "to_address",
  "subject",
  "body_text",
  "staff_actor",
  "client_request_id",
  "sender_matches_customer",
  "is_auto_reply",
  "sent_at",
  "received_at",
  "delivered_at",
  "opened_at",
  "bounced_at",
  "complained_at",
  "delivery_delayed_at",
  "replied_at",
  "last_event_detail",
  "created_at",
].join(",");

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const ip = getClientIp(req);
  if (!rateLimit(`order-messages:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { id: orderId } = await params;
    const supabase = createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("order_messages")
      .select(MESSAGE_FIELDS)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    console.error("[staff/orders/messages]", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
