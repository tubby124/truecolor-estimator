import { recordAuditEvent } from "@/lib/audit/record";
import {
  escapeTelegramHtml,
  sendTelegramNotification,
} from "@/lib/notifications/telegram";
import { createServiceClient } from "@/lib/supabase/server";
import {
  extractMessageText,
  getGmailClient,
  getGmailMailbox,
  getHeader,
  isAutoReply,
  parseFrom,
  stripQuotedHistory,
  type GmailHeaderLike,
} from "./gmailClient";

const RECIPIENT_HEADER_NAMES = ["To", "Delivered-To", "X-Original-To"] as const;
const ORDER_REPLY_ADDRESS = /^info\+o_([0-9a-f]{32})@true-color\.ca$/i;
const PROBE_ADDRESS = "info+probe@true-color.ca";
const UNIQUE_VIOLATION = "23505";

interface OrderCustomer {
  email: string | null;
  name: string | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  customers: OrderCustomer | OrderCustomer[] | null;
}

interface InsertError {
  code?: string | null;
  message?: string | null;
}

interface InsertResult {
  data: { id: string } | null;
  error: InsertError | null;
}

export interface OrderReplyRecipient {
  address: string;
  recipientHeader: string;
  token: string;
}

export interface OrderReplySyncResult {
  dryRun: boolean;
  enabled: boolean;
  writeEnabled: boolean;
  hours: number;
  pages: number;
  scanned: number;
  tokenCandidates: number;
  matchedOrders: number;
  wouldInsert: number;
  inserted: number;
  duplicates: number;
  unmatchedTokens: number;
  autoReplies: number;
  senderMismatches: number;
  probeRecipientsSeen: number;
  pageLimitReached: boolean;
}

export type InboundClaim =
  | { status: "inserted"; id: string }
  | { status: "duplicate" };

function extractAddresses(headerValue: string): string[] {
  return headerValue.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
}

function relevantRecipientHeaders(headers: readonly GmailHeaderLike[]): Array<{
  name: string;
  value: string;
}> {
  const allowed = new Set(RECIPIENT_HEADER_NAMES.map((name) => name.toLowerCase()));
  return headers
    .filter((header) => header.name && allowed.has(header.name.toLowerCase()))
    .map((header) => ({ name: header.name ?? "", value: header.value ?? "" }));
}

/**
 * Return an order token only when one unambiguous, exact reply mailbox appears
 * in To, Delivered-To, or X-Original-To. Wrong domains and malformed tags do
 * not associate a message.
 */
export function extractOrderReplyRecipient(
  headers: readonly GmailHeaderLike[]
): OrderReplyRecipient | null {
  const recipientHeaders = relevantRecipientHeaders(headers);
  const matches = recipientHeaders.flatMap(({ value }) =>
    extractAddresses(value).flatMap((address) => {
      const match = address.match(ORDER_REPLY_ADDRESS);
      return match ? [match[1].toLowerCase()] : [];
    })
  );
  const tokens = new Set(matches);
  if (tokens.size !== 1) return null;

  const token = matches[0];
  if (!token) return null;
  const preservedHeaders = [...new Set(recipientHeaders.map(({ name, value }) => `${name}: ${value}`))];
  return {
    address: `info+o_${token}@true-color.ca`,
    recipientHeader: preservedHeaders.join("\n"),
    token,
  };
}

export function containsReplyProbe(headers: readonly GmailHeaderLike[]): boolean {
  return relevantRecipientHeaders(headers).some(({ value }) =>
    extractAddresses(value).some((address) => address.toLowerCase() === PROBE_ADDRESS)
  );
}

export function senderMatchesOrderCustomer(
  fromEmail: string,
  customerEmail: string | null | undefined
): boolean {
  return Boolean(customerEmail && fromEmail.trim().toLowerCase() === customerEmail.trim().toLowerCase());
}

/** Claim the Gmail ID once; unique violations are normal overlap, not errors. */
export async function claimInboundMessage(
  insert: () => PromiseLike<InsertResult>
): Promise<InboundClaim> {
  const { data, error } = await insert();
  if (error?.code === UNIQUE_VIOLATION) return { status: "duplicate" };
  if (error) throw new Error(`Inbound Gmail claim failed: ${error.message ?? "database error"}`);
  if (!data?.id) throw new Error("Inbound Gmail claim returned no row");
  return { status: "inserted", id: data.id };
}

function customerFromOrder(order: OrderRow): OrderCustomer | null {
  return Array.isArray(order.customers) ? order.customers[0] ?? null : order.customers;
}

function messageReceivedAt(internalDate: string | null | undefined, dateHeader: string): {
  iso: string;
  milliseconds: number;
} {
  const internalMilliseconds = Number(internalDate ?? 0);
  if (Number.isFinite(internalMilliseconds) && internalMilliseconds > 0) {
    return { iso: new Date(internalMilliseconds).toISOString(), milliseconds: internalMilliseconds };
  }
  const headerMilliseconds = Date.parse(dateHeader);
  if (Number.isFinite(headerMilliseconds)) {
    return { iso: new Date(headerMilliseconds).toISOString(), milliseconds: headerMilliseconds };
  }
  const now = Date.now();
  return { iso: new Date(now).toISOString(), milliseconds: now };
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

export async function syncOrderReplies(options: {
  hours: number;
  dryRun: boolean;
  maxPages?: number;
  pageSize?: number;
}): Promise<OrderReplySyncResult> {
  const hours = clampInteger(options.hours, 1, 720);
  const maxPages = clampInteger(options.maxPages ?? 50, 1, 100);
  const pageSize = clampInteger(options.pageSize ?? 100, 1, 100);
  const enabled = process.env.ORDER_REPLY_SYNC_ENABLED === "true";
  const writeEnabled = enabled && !options.dryRun;
  const mailbox = getGmailMailbox();
  const gmail = getGmailClient();
  const supabase = createServiceClient();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const query = `in:inbox newer_than:${Math.max(1, Math.ceil(hours / 24))}d`;
  const result: OrderReplySyncResult = {
    dryRun: options.dryRun,
    enabled,
    writeEnabled,
    hours,
    pages: 0,
    scanned: 0,
    tokenCandidates: 0,
    matchedOrders: 0,
    wouldInsert: 0,
    inserted: 0,
    duplicates: 0,
    unmatchedTokens: 0,
    autoReplies: 0,
    senderMismatches: 0,
    probeRecipientsSeen: 0,
    pageLimitReached: false,
  };

  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const list = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: pageSize,
      ...(pageToken ? { pageToken } : {}),
    });
    result.pages += 1;

    for (const summary of list.data.messages ?? []) {
      if (!summary.id) continue;
      const message = await gmail.users.messages.get({
        userId: "me",
        id: summary.id,
        format: "full",
      });
      result.scanned += 1;

      const headers = message.data.payload?.headers ?? [];
      if (containsReplyProbe(headers)) result.probeRecipientsSeen += 1;

      const recipient = extractOrderReplyRecipient(headers);
      if (!recipient) continue;
      result.tokenCandidates += 1;

      const received = messageReceivedAt(message.data.internalDate, getHeader(headers, "Date"));
      if (received.milliseconds < cutoff) continue;

      const { data: tokenData, error: tokenError } = await supabase
        .from("order_reply_tokens")
        .select("order_id")
        .eq("reply_token", recipient.token)
        .maybeSingle();
      if (tokenError) throw new Error(`Order token lookup failed: ${tokenError.message}`);
      if (!tokenData?.order_id) {
        result.unmatchedTokens += 1;
        continue;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, customers ( name, email )")
        .eq("id", tokenData.order_id)
        .maybeSingle();
      if (orderError) throw new Error(`Order lookup failed: ${orderError.message}`);
      if (!orderData) {
        result.unmatchedTokens += 1;
        continue;
      }

      const order = orderData as unknown as OrderRow;
      const customer = customerFromOrder(order);
      const from = parseFrom(getHeader(headers, "From"));
      const senderMatchesCustomer = senderMatchesOrderCustomer(from.email, customer?.email);
      const autoReply = isAutoReply(
        getHeader(headers, "Auto-Submitted"),
        getHeader(headers, "Precedence"),
        getHeader(headers, "X-Autoreply"),
        getHeader(headers, "Subject")
      );
      const bodyText = stripQuotedHistory(extractMessageText(message.data.payload));
      result.matchedOrders += 1;
      if (autoReply) result.autoReplies += 1;
      if (!senderMatchesCustomer) result.senderMismatches += 1;

      const inboundRow = {
        order_id: order.id,
        customer_id: order.customer_id,
        direction: "inbound",
        status: "received",
        from_address: from.email,
        to_address: recipient.address,
        subject: getHeader(headers, "Subject"),
        body_text: bodyText,
        gmail_mailbox: mailbox,
        gmail_message_id: summary.id,
        gmail_thread_id: message.data.threadId ?? "",
        rfc_message_id: getHeader(headers, "Message-ID"),
        in_reply_to: getHeader(headers, "In-Reply-To"),
        references_header: getHeader(headers, "References"),
        recipient_header: recipient.recipientHeader,
        sender_matches_customer: senderMatchesCustomer,
        is_auto_reply: autoReply,
        received_at: received.iso,
        processed_at: autoReply ? received.iso : null,
      };

      if (!writeEnabled) {
        const { data: existing, error: existingError } = await supabase
          .from("order_messages")
          .select("id")
          .eq("gmail_mailbox", mailbox)
          .eq("gmail_message_id", summary.id)
          .maybeSingle();
        if (existingError) throw new Error(`Inbound dedupe lookup failed: ${existingError.message}`);
        if (existing) result.duplicates += 1;
        else result.wouldInsert += 1;
        continue;
      }

      const claim = await claimInboundMessage(() =>
        supabase.from("order_messages").insert(inboundRow).select("id").single()
      );
      let inboundMessageId: string;
      let processedAt: string | null = null;
      let notifiedAt: string | null = null;
      if (claim.status === "duplicate") {
        result.duplicates += 1;
        const { data: existing, error: existingError } = await supabase
          .from("order_messages")
          .select("id,processed_at,notified_at")
          .eq("gmail_mailbox", mailbox)
          .eq("gmail_message_id", summary.id)
          .single();
        if (existingError || !existing) {
          throw new Error(
            `Inbound processing-state lookup failed: ${existingError?.message ?? "missing row"}`
          );
        }
        inboundMessageId = existing.id;
        processedAt = existing.processed_at;
        notifiedAt = existing.notified_at;
      } else {
        result.inserted += 1;
        inboundMessageId = claim.id;
      }

      // Auto-replies remain visible in the ledger but never count as a human
      // reply and never produce staff alerts.
      if (autoReply) continue;

      if (!processedAt) {
        const { data: processingClaimed, error: processingClaimError } = await supabase.rpc(
          "claim_order_message_stage",
          { p_message_id: inboundMessageId, p_stage: "process" }
        );
        if (processingClaimError) {
          throw new Error(`Inbound processing claim failed: ${processingClaimError.message}`);
        }
        if (!processingClaimed) continue;

        const { data: outbound, error: outboundError } = await supabase
          .from("order_messages")
          .select("id")
          .eq("order_id", order.id)
          .eq("direction", "outbound")
          .lte("created_at", received.iso)
          .order("sent_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (outboundError) throw new Error(`Outbound reply lookup failed: ${outboundError.message}`);
        if (outbound?.id) {
          const { error: updateError } = await supabase
            .from("order_messages")
            .update({ replied_at: received.iso })
            .eq("id", outbound.id)
            .is("replied_at", null);
          if (updateError) throw new Error(`Outbound reply update failed: ${updateError.message}`);
        }

        const audited = await recordAuditEvent({
          actor_type: "system",
          actor_id: mailbox,
          event_type: "order.email_reply_received",
          entity_type: "order",
          entity_id: order.id,
          detail: {
            order_message_id: inboundMessageId,
            gmail_message_id: summary.id,
            from_address: from.email,
            sender_matches_customer: senderMatchesCustomer,
            subject: inboundRow.subject,
          },
        });
        if (!audited) throw new Error("Inbound reply audit write failed");

        const processedTimestamp = new Date().toISOString();
        const { error: processedError } = await supabase
          .from("order_messages")
          .update({
            processed_at: processedTimestamp,
            processing_started_at: null,
            updated_at: processedTimestamp,
          })
          .eq("id", inboundMessageId)
          .is("processed_at", null);
        if (processedError) {
          throw new Error(`Inbound processing marker failed: ${processedError.message}`);
        }
        processedAt = processedTimestamp;
      }

      if (!notifiedAt) {
        const { data: notificationClaimed, error: notificationClaimError } = await supabase.rpc(
          "claim_order_message_stage",
          { p_message_id: inboundMessageId, p_stage: "notify" }
        );
        if (notificationClaimError) {
          throw new Error(`Inbound notification claim failed: ${notificationClaimError.message}`);
        }
        if (!notificationClaimed) continue;

        const senderWarning = senderMatchesCustomer
          ? ""
          : "\n⚠️ Sender differs from the order customer email.";
        const notified = await sendTelegramNotification(
          `📨 <b>Customer replied to an order email</b>\n` +
            `Order: <b>${escapeTelegramHtml(order.order_number)}</b>\n` +
            `${senderWarning}\n` +
            `View securely: https://truecolorprinting.ca/staff/orders`,
          `order-reply:${summary.id}`
        );
        if (notified) {
          const notifiedTimestamp = new Date().toISOString();
          const { error: notifiedError } = await supabase
            .from("order_messages")
            .update({
              notified_at: notifiedTimestamp,
              notification_started_at: null,
              updated_at: notifiedTimestamp,
            })
            .eq("id", inboundMessageId)
            .is("notified_at", null);
          if (notifiedError) {
            throw new Error(`Inbound notification marker failed: ${notifiedError.message}`);
          }
        } else {
          const { error: releaseError } = await supabase
            .from("order_messages")
            .update({ notification_started_at: null, updated_at: new Date().toISOString() })
            .eq("id", inboundMessageId)
            .is("notified_at", null);
          if (releaseError) {
            throw new Error(`Inbound notification lease release failed: ${releaseError.message}`);
          }
        }
      }
    }

    const nextPageToken = list.data.nextPageToken ?? undefined;
    if (!nextPageToken) {
      pageToken = undefined;
      break;
    }
    pageToken = nextPageToken;
    if (page === maxPages - 1) result.pageLimitReached = true;
  }

  return result;
}
