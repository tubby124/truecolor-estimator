"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MessageDirection = "outbound" | "inbound";

interface OrderMessage {
  id: string;
  direction: MessageDirection;
  status: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_text: string;
  staff_actor: string | null;
  client_request_id: string | null;
  sender_matches_customer: boolean | null;
  is_auto_reply: boolean;
  sent_at: string | null;
  received_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  delivery_delayed_at: string | null;
  replied_at: string | null;
  last_event_detail: string | null;
  created_at: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
}

const STATUS_STYLES: Record<string, string> = {
  sending: "bg-gray-100 text-gray-600 border-gray-200",
  pending_confirmation: "bg-amber-50 text-amber-800 border-amber-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  delivery_delayed: "bg-amber-50 text-amber-700 border-amber-200",
  bounced: "bg-red-50 text-red-700 border-red-200",
  complained: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  received: "bg-violet-50 text-violet-700 border-violet-200",
};

const STATUS_LABELS: Record<string, string> = {
  sending: "Sending",
  pending_confirmation: "Confirmation pending",
  sent: "Sent",
  delivered: "Delivered",
  delivery_delayed: "Delayed",
  bounced: "Bounced",
  complained: "Spam complaint",
  failed: "Failed",
  received: "Reply received",
};

async function readJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(res.ok ? "Unexpected server response" : "The server could not complete that request");
  }
  return (await res.json()) as T;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-CA", {
    timeZone: "America/Regina",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function messageTimestamp(message: OrderMessage): string {
  return message.received_at ?? message.sent_at ?? message.created_at;
}

export function OrderMessagesPanel({ orderId, orderNumber, customerName, customerEmail }: Props) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: True Color Order ${orderNumber}`);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/messages`, {
        cache: "no-store",
        signal,
      });
      const json = await readJson<{ messages?: OrderMessage[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? "Could not load messages");
      setMessages(json.messages ?? []);
      setLoadError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setLoadError(err instanceof Error ? err.message : "Could not load messages");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMessages(controller.signal);
    return () => {
      controller.abort();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [loadMessages]);

  function invalidateRetry() {
    setPendingRequestId(null);
    setSendError(null);
    setSendSuccess(null);
  }

  async function sendMessage() {
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();
    if (!cleanSubject || !cleanBody || sending) return;

    const clientRequestId = pendingRequestId ?? crypto.randomUUID();
    setPendingRequestId(clientRequestId);
    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const res = await fetch(`/api/staff/orders/${orderId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: cleanSubject,
          message: cleanBody,
          clientRequestId,
        }),
      });
      const json = await readJson<{ ok?: boolean; error?: string; outcome?: string }>(res);
      if (!res.ok) {
        if (json.outcome === "rejected") setPendingRequestId(null);
        throw new Error(json.error ?? "Message could not be sent");
      }

      setPendingRequestId(null);
      setBody("");
      setSendSuccess(`Message accepted for ${customerEmail}`);
      await loadMessages();
      refreshTimer.current = setTimeout(() => void loadMessages(), 4_000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Message could not be sent");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pt-2 border-t border-gray-100" aria-labelledby={`messages-${orderId}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 id={`messages-${orderId}`} className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Customer messages
          </h3>
          {messages.length > 0 && (
            <span className="text-[11px] font-semibold rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMessages()}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setComposerOpen((open) => !open);
              setSendError(null);
              setSendSuccess(null);
            }}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#16C2F3] text-[#16C2F3] hover:bg-[#16C2F3] hover:text-white transition-colors"
          >
            {composerOpen ? "Close message" : "✉ Message customer"}
          </button>
        </div>
      </div>

      {composerOpen && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-sm text-gray-600">
            To: <span className="font-semibold text-gray-800">{customerName} &lt;{customerEmail}&gt;</span>
          </p>
          <div>
            <label htmlFor={`message-subject-${orderId}`} className="text-xs font-semibold text-gray-500 block mb-1.5">
              Subject
            </label>
            <input
              id={`message-subject-${orderId}`}
              type="text"
              value={subject}
              maxLength={200}
              onChange={(event) => {
                setSubject(event.target.value);
                invalidateRetry();
              }}
              disabled={sending}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16C2F3] disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor={`message-body-${orderId}`} className="text-xs font-semibold text-gray-500 block mb-1.5">
              Message
            </label>
            <textarea
              id={`message-body-${orderId}`}
              value={body}
              maxLength={20_000}
              onChange={(event) => {
                setBody(event.target.value);
                invalidateRetry();
              }}
              disabled={sending}
              rows={6}
              placeholder="Your order is…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16C2F3] resize-none disabled:opacity-60"
            />
          </div>
          <div aria-live="polite">
            {sendError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {sendError}
              </p>
            )}
            {sendSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                ✓ {sendSuccess}. Delivery status will update below.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || !subject.trim() || !body.trim()}
            className="bg-[#16C2F3] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending…" : sendError ? "Retry message safely →" : "Send message →"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 animate-pulse">Loading message history…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-400">No tracked messages for this order yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const inbound = message.direction === "inbound";
            const statusStyle = STATUS_STYLES[message.status] ?? STATUS_STYLES.sent;
            const retryAgeMs = Date.now() - Date.parse(message.created_at);
            const canRetryPending =
              !inbound &&
              ["sending", "pending_confirmation"].includes(message.status) &&
              Boolean(message.client_request_id) &&
              retryAgeMs <= 23 * 60 * 60 * 1000;
            return (
              <article
                key={message.id}
                className={`rounded-xl border p-4 ${inbound ? "bg-violet-50/40 border-violet-200" : "bg-white border-gray-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      {inbound ? "Customer → True Color" : "True Color → Customer"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{message.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {inbound ? `From ${message.from_address}` : `To ${message.to_address}`}
                      {message.staff_actor ? ` · Sent by ${message.staff_actor}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex text-[11px] font-bold px-2 py-1 rounded-full border ${statusStyle}`}>
                      {STATUS_LABELS[message.status] ?? message.status}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">{formatTimestamp(messageTimestamp(message))}</p>
                  </div>
                </div>

                {inbound && message.sender_matches_customer === false && (
                  <p className="mt-3 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Sender differs from the email saved on this order. Verify before acting.
                  </p>
                )}
                {message.is_auto_reply && (
                  <p className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    Automatic reply
                  </p>
                )}

                <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">{message.body_text}</p>

                {canRetryPending && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubject(message.subject);
                      setBody(message.body_text);
                      setPendingRequestId(message.client_request_id);
                      setComposerOpen(true);
                      setSendError(null);
                      setSendSuccess(null);
                    }}
                    className="mt-3 text-xs font-bold text-amber-800 underline underline-offset-2"
                  >
                    Retry this exact message safely
                  </button>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                  {message.delivered_at && <span>Delivered {formatTimestamp(message.delivered_at)}</span>}
                  {message.opened_at && <span>Opened signal {formatTimestamp(message.opened_at)} (not guaranteed)</span>}
                  {message.replied_at && <span>Replied {formatTimestamp(message.replied_at)}</span>}
                  {message.delivery_delayed_at && <span>Delayed {formatTimestamp(message.delivery_delayed_at)}</span>}
                  {message.bounced_at && <span>Bounced {formatTimestamp(message.bounced_at)}</span>}
                  {message.complained_at && <span>Complaint {formatTimestamp(message.complained_at)}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
