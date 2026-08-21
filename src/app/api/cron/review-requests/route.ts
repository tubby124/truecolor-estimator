/**
 * GET /api/cron/review-requests
 *
 * Safe two-touch review workflow:
 * - initial ask: 5 days after staff confirmed completion
 * - one reminder: 7 days after the initial ask
 * - one active cycle per customer per 365 days
 * - consent, suppression, bounce/complaint, and staff controls all stop sends
 *
 * Default is dry-run. Set REVIEW_REQUESTS_ENABLED=true only after the internal
 * delivery proof has passed. REVIEW_REQUEST_DAILY_CAP defaults to 0.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReviewRequestEmail } from "@/lib/email/reviewRequest";
import { recordCronRun } from "@/lib/cron/heartbeat";

const INITIAL_DELAY_MS = 5 * 24 * 60 * 60 * 1000;
const REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
const CUSTOMER_COOLDOWN_MS = 365 * 24 * 60 * 60 * 1000;
const CANDIDATE_SCAN_LIMIT = 250;

type Customer = { id: string; name: string; email: string; marketing_consent: boolean | null };
type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  completed_at: string | null;
  order_items: Array<{ product_name: string; qty: number }> | null;
  customers: Customer | Customer[] | null;
};
type State = {
  customer_id: string;
  last_review_request_at: string | null;
  last_review_order_id: string | null;
  review_confirmed_at: string | null;
  suppressed_at: string | null;
};
type Cycle = {
  id: string;
  order_id: string;
  customer_id: string;
  initial_sent_at: string | null;
  reminder_sent_at: string | null;
  suppressed_at: string | null;
};

function configuredCap(): number {
  const raw = Number.parseInt(process.env.REVIEW_REQUEST_DAILY_CAP ?? "0", 10);
  return Number.isFinite(raw) ? Math.max(0, Math.min(raw, 25)) : 0;
}

function scalarCustomer(value: Order["customers"]): Customer | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = process.env.REVIEW_REQUESTS_ENABLED === "true";
  const dryRun = !enabled || new URL(req.url).searchParams.get("dry_run") === "1";
  const cap = dryRun ? 0 : configuredCap();
  const now = new Date();
  const initialCutoff = new Date(now.getTime() - INITIAL_DELAY_MS).toISOString();
  const reminderCutoff = new Date(now.getTime() - REMINDER_DELAY_MS).toISOString();
  const cooldownCutoff = new Date(now.getTime() - CUSTOMER_COOLDOWN_MS).toISOString();
  const summary = {
    enabled,
    dryRun,
    cap,
    initial: { eligible: 0, sent: 0, skipped: 0 },
    reminder: { eligible: 0, sent: 0, skipped: 0 },
    errors: 0,
  };

  const supabase = createServiceClient();
  try {
    const { data: completed, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, completed_at, order_items(product_name, qty), customers(id, name, email, marketing_consent)")
      .eq("status", "complete")
      .not("completed_at", "is", null)
      .lte("completed_at", initialCutoff)
      .order("completed_at", { ascending: true })
      .limit(CANDIDATE_SCAN_LIMIT);
    if (error) throw error;

    const orders = (completed ?? []) as unknown as Order[];
    const orderIds = orders.map((order) => order.id);
    const customerIds = orders.map((order) => order.customer_id).filter((id): id is string => Boolean(id));
    const [{ data: states, error: statesError }, { data: cycles, error: cyclesError }] = await Promise.all([
      customerIds.length ? supabase.from("customer_review_state").select("customer_id,last_review_request_at,last_review_order_id,review_confirmed_at,suppressed_at").in("customer_id", customerIds) : Promise.resolve({ data: [], error: null }),
      orderIds.length ? supabase.from("review_request_cycles").select("id,order_id,customer_id,initial_sent_at,reminder_sent_at,suppressed_at").in("order_id", orderIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (statesError) throw statesError;
    if (cyclesError) throw cyclesError;
    const stateByCustomer = new Map((states ?? []).map((state) => [state.customer_id, state as State]));
    const cycleByOrder = new Map((cycles ?? []).map((cycle) => [cycle.order_id, cycle as Cycle]));

    for (const order of orders) {
      const customer = scalarCustomer(order.customers);
      if (!customer || !order.customer_id || !customer.marketing_consent) { summary.initial.skipped++; continue; }
      const state = stateByCustomer.get(customer.id);
      if (state?.suppressed_at || state?.review_confirmed_at || (state?.last_review_request_at && state.last_review_request_at >= cooldownCutoff)) {
        summary.initial.skipped++; continue;
      }
      const existingCycle = cycleByOrder.get(order.id);
      if (existingCycle?.initial_sent_at) continue;
      summary.initial.eligible++;
      if (dryRun || summary.initial.sent + summary.reminder.sent >= cap) continue;

      // An earlier run may have reached Resend but died before marking the
      // cycle. Reuse its deterministic idempotency key instead of creating a
      // second logical send. A brand-new cycle is protected by order_id UNIQUE.
      let cycleId = existingCycle?.id;
      if (!cycleId) {
        const { data: created, error: createError } = await supabase
          .from("review_request_cycles")
          .insert({ order_id: order.id, customer_id: customer.id, eligible_at: order.completed_at })
          .select("id")
          .maybeSingle();
        if (createError || !created?.id) {
          summary.initial.skipped++;
          continue;
        }
        const createdCycleId = created.id;
        cycleId = createdCycleId;
        cycleByOrder.set(order.id, { id: createdCycleId, order_id: order.id, customer_id: customer.id, initial_sent_at: null, reminder_sent_at: null, suppressed_at: null });
      }

      const { data: replyToken, error: replyTokenError } = await supabase
        .from("order_reply_tokens")
        .select("reply_token")
        .eq("order_id", order.id)
        .maybeSingle();
      if (replyTokenError || !replyToken?.reply_token) {
        // A review request without a durable reply identity cannot safely stop
        // after a customer answers, so fail closed rather than send it.
        summary.initial.skipped++;
        continue;
      }
      const replyTo = `info+o_${replyToken.reply_token}@true-color.ca`;
      if (!cycleId) {
        summary.initial.skipped++;
        continue;
      }

      try {
        const sent = await sendReviewRequestEmail({
          orderId: order.id,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          orderNumber: order.order_number,
          touch: "initial",
          replyTo,
          items: order.order_items ?? [],
        });
        const sentAt = new Date().toISOString();
        const [{ error: cycleError }, { error: stateError }] = await Promise.all([
          supabase.from("review_request_cycles").update({ initial_sent_at: sentAt, provider_initial_message_id: sent.providerMessageId, updated_at: sentAt }).eq("id", cycleId),
          supabase.from("customer_review_state").upsert({ customer_id: customer.id, last_review_request_at: sentAt, last_review_order_id: order.id, updated_at: sentAt }, { onConflict: "customer_id" }),
        ]);
        if (cycleError || stateError) throw cycleError ?? stateError;
        // Keep this run's in-memory view current so another old completed
        // order for the same customer cannot receive a second initial ask.
        stateByCustomer.set(customer.id, {
          customer_id: customer.id,
          last_review_request_at: sentAt,
          last_review_order_id: order.id,
          review_confirmed_at: null,
          suppressed_at: null,
        });
        cycleByOrder.set(order.id, { id: cycleId, order_id: order.id, customer_id: customer.id, initial_sent_at: sentAt, reminder_sent_at: null, suppressed_at: null });
        summary.initial.sent++;
      } catch (sendError) {
        summary.errors++;
        console.error("[review-requests] initial failed:", sendError instanceof Error ? sendError.message : sendError);
      }
    }

    // Only cycles created by this system can get a reminder. Historical sends were
    // backfilled into customer state but intentionally never get a surprise nudge.
    const { data: reminders, error: reminderError } = await supabase
      .from("review_request_cycles")
      .select("id,order_id,customer_id,initial_sent_at,reminder_sent_at,suppressed_at")
      .not("initial_sent_at", "is", null)
      .is("reminder_sent_at", null)
      .is("suppressed_at", null)
      .lte("initial_sent_at", reminderCutoff)
      .order("initial_sent_at", { ascending: true })
      .limit(CANDIDATE_SCAN_LIMIT);
    if (reminderError) throw reminderError;

    for (const cycle of (reminders ?? []) as Cycle[]) {
      const order = orders.find((item) => item.id === cycle.order_id);
      const customer = order ? scalarCustomer(order.customers) : null;
      const state = customer ? stateByCustomer.get(customer.id) : null;
      if (!order || !customer || !state || !customer.marketing_consent || state.suppressed_at || state.review_confirmed_at || state.last_review_order_id !== order.id) {
        summary.reminder.skipped++; continue;
      }
      summary.reminder.eligible++;
      if (dryRun || summary.initial.sent + summary.reminder.sent >= cap) continue;
      try {
        const sent = await sendReviewRequestEmail({ orderId: order.id, customerId: customer.id, customerName: customer.name, customerEmail: customer.email, orderNumber: order.order_number, touch: "reminder", items: order.order_items ?? [] });
        const sentAt = new Date().toISOString();
        const { error: updateError } = await supabase.from("review_request_cycles").update({ reminder_sent_at: sentAt, provider_reminder_message_id: sent.providerMessageId, updated_at: sentAt }).eq("id", cycle.id).is("reminder_sent_at", null);
        if (updateError) throw updateError;
        summary.reminder.sent++;
      } catch (sendError) {
        summary.errors++;
        console.error("[review-requests] reminder failed:", sendError instanceof Error ? sendError.message : sendError);
      }
    }

    await recordCronRun("review-requests", summary.errors === 0, JSON.stringify(summary));
    return NextResponse.json({ ok: summary.errors === 0, ...summary });
  } catch (error) {
    console.error("[review-requests] run failed:", error instanceof Error ? error.message : error);
    await recordCronRun("review-requests", false, error instanceof Error ? error.message : "unknown failure");
    return NextResponse.json({ error: "Review request run failed" }, { status: 500 });
  }
}
