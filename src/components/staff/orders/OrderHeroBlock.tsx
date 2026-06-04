"use client";

/**
 * OrderHeroBlock — the sticky top section of an expanded staff order card.
 *
 * The hero IS the dashboard's job-to-be-done surface. Staff opens an order,
 * the hero tells them in one sentence what should happen next, and presents
 * the 1-3 most relevant action buttons inline. Everything else in the card
 * lives behind tabs.
 *
 * State machine (order.status × ledger):
 *   pending_payment + unpaid      → "Customer hasn't paid. Send / resend the invoice."
 *   pending_payment + partial     → "Partial paid. Send a link for the balance or record next payment."
 *   pending_payment + paid (rare) → "Customer paid but order hasn't advanced. Mark received."
 *   payment_received              → "Payment in. Send a proof or start production."
 *   in_production                 → "Print job running. Send proof when ready, then mark ready for pickup."
 *   ready_for_pickup              → "Job's ready. Notify customer or mark complete."
 *   complete                      → "Order closed. Resend receipt if needed."
 *
 * Payment ledger is fetched once on expand. Fail-soft: if the ledger endpoint
 * fails, falls back to order.status-only signalling so the hero always renders.
 */

import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/app/staff/orders/OrdersTable";
import { STATUS_LABELS, NEXT_STATUS, NEXT_LABEL } from "@/lib/data/order-constants";

// Inline customer resolution. The cleaner "customer snapshot" lives on
// feat/order-customer-snapshot; until that branch ships we read from the
// embedded customers join directly.
function readCustomer(order: Order) {
  const c = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  return {
    name: c?.name?.trim() || "Customer",
    company: c?.company?.trim() || null,
    phone: c?.phone?.trim() || null,
    email: c?.email?.trim() || null,
  };
}

interface PaymentLedgerSummary {
  amountPaid: number;
  balanceDue: number;
  status: "unpaid" | "partial" | "paid" | "overpaid";
}

interface Props {
  order: Order;
  isLoadingStatus: boolean;
  onStatusUpdate: (newStatus: string) => void;
  resendingPayment: boolean;
  resendSuccess: boolean;
  onResendPayment: () => void;
  sendingReceipt: boolean;
  receiptSent: boolean;
  onSendReceipt: () => void;
  onJumpToTab: (tab: "items" | "payments" | "files" | "activity") => void;
}

function fmt(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];

interface ActionDescriptor {
  label: string;
  variant: "primary" | "secondary" | "success" | "warning";
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  external?: { href: string };
}

interface NextStep {
  headline: string;
  actions: ActionDescriptor[];
}

export function OrderHeroBlock(props: Props) {
  const { order } = props;

  // ── Payment ledger lookup ─────────────────────────────────────────────────
  // Fetched on mount (i.e. on expand). Single API call per order — same shape
  // the PaymentLedgerPanel uses, but we only need the summary here.
  const [ledger, setLedger] = useState<PaymentLedgerSummary | null>(null);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/staff/orders/${order.id}/payments`);
        if (!res.ok) {
          if (!cancelled) setLedgerLoaded(true);
          return;
        }
        const data = await res.json() as { summary?: PaymentLedgerSummary };
        if (cancelled) return;
        if (data.summary) setLedger(data.summary);
        setLedgerLoaded(true);
      } catch {
        if (!cancelled) setLedgerLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [order.id]);

  const snap = useMemo(() => readCustomer(order), [order]);
  const total = Number(order.total ?? 0);

  // Payment state — derive from ledger when loaded, fall back to order.status.
  const orderSaysPaid = PAID_STATUSES.includes(order.status);
  const paymentState: "unpaid" | "partial" | "paid" | "overpaid" = ledger
    ? ledger.status
    : (orderSaysPaid ? "paid" : "unpaid");
  const amountPaid = ledger?.amountPaid ?? (orderSaysPaid ? total : 0);
  const balanceDue = ledger?.balanceDue ?? (orderSaysPaid ? 0 : total);

  const previewHref = order.receipt_token
    ? `/api/receipt/${order.id}/pdf?token=${order.receipt_token}`
    : null;

  // ── Next-step copywriting + action recipe ─────────────────────────────────
  const nextStep: NextStep = useMemo(() => {
    const advanceStatus = NEXT_STATUS[order.status];
    const advanceLabel = NEXT_LABEL[order.status];

    if (order.status === "pending_payment") {
      if (paymentState === "paid") {
        // Edge case: ledger says paid but order hasn't advanced. Surface the manual nudge.
        return {
          headline: `Payment is fully recorded but the order hasn't advanced. Mark it received to start production.`,
          actions: [
            advanceStatus && advanceLabel
              ? { label: advanceLabel, variant: "primary", loading: props.isLoadingStatus, loadingLabel: "Advancing…", onClick: () => props.onStatusUpdate(advanceStatus) }
              : null,
            { label: "Open payments", variant: "secondary", onClick: () => props.onJumpToTab("payments") },
          ].filter(Boolean) as ActionDescriptor[],
        };
      }

      if (paymentState === "partial") {
        return {
          headline: `${fmt(amountPaid)} paid · ${fmt(balanceDue)} still due. Send a link for the balance or record the next payment.`,
          actions: [
            { label: `Send link for ${fmt(balanceDue)}`, variant: "primary", onClick: () => props.onJumpToTab("payments") },
            { label: "Record payment", variant: "secondary", onClick: () => props.onJumpToTab("payments") },
            previewHref ? { label: "Preview PDF", variant: "secondary", onClick: () => {}, external: { href: previewHref } } : null,
          ].filter(Boolean) as ActionDescriptor[],
        };
      }

      // unpaid
      return {
        headline: `Customer hasn't paid yet. Resend the invoice or mark a payment manually.`,
        actions: [
          {
            label: props.resendSuccess ? "✓ Resent" : "Resend payment link",
            variant: "primary",
            loading: props.resendingPayment,
            loadingLabel: "Sending…",
            onClick: () => props.onResendPayment(),
            disabled: props.resendSuccess,
          },
          { label: "Record payment", variant: "secondary", onClick: () => props.onJumpToTab("payments") },
          previewHref ? { label: "Preview invoice", variant: "secondary", onClick: () => {}, external: { href: previewHref } } : null,
        ].filter(Boolean) as ActionDescriptor[],
      };
    }

    if (order.status === "payment_received") {
      return {
        headline: `Payment is in. Send a design proof if needed, or start production.`,
        actions: [
          advanceStatus && advanceLabel
            ? { label: advanceLabel, variant: "success", loading: props.isLoadingStatus, loadingLabel: "Advancing…", onClick: () => props.onStatusUpdate(advanceStatus) }
            : null,
          { label: "Send proof", variant: "secondary", onClick: () => props.onJumpToTab("files") },
        ].filter(Boolean) as ActionDescriptor[],
      };
    }

    if (order.status === "in_production") {
      return {
        headline: `Print job in progress. Send a proof to the customer, or mark it ready for pickup.`,
        actions: [
          advanceStatus && advanceLabel
            ? { label: advanceLabel, variant: "success", loading: props.isLoadingStatus, loadingLabel: "Advancing…", onClick: () => props.onStatusUpdate(advanceStatus) }
            : null,
          { label: "Send proof", variant: "secondary", onClick: () => props.onJumpToTab("files") },
        ].filter(Boolean) as ActionDescriptor[],
      };
    }

    if (order.status === "ready_for_pickup") {
      return {
        headline: `Order is ready. Mark it complete to email the review-request receipt.`,
        actions: [
          advanceStatus && advanceLabel
            ? { label: advanceLabel, variant: "success", loading: props.isLoadingStatus, loadingLabel: "Sending receipt…", onClick: () => props.onStatusUpdate(advanceStatus) }
            : null,
          { label: "Message customer", variant: "secondary", onClick: () => props.onJumpToTab("activity") },
        ].filter(Boolean) as ActionDescriptor[],
      };
    }

    // complete
    return {
      headline: `Order is closed. Resend the receipt or download the PDF if the customer asks for it.`,
      actions: [
        {
          label: props.receiptSent ? "✓ Receipt resent" : "Resend receipt",
          variant: "primary",
          loading: props.sendingReceipt,
          loadingLabel: "Sending…",
          onClick: () => props.onSendReceipt(),
          disabled: props.receiptSent,
        },
        previewHref ? { label: "Preview receipt", variant: "secondary", onClick: () => {}, external: { href: previewHref } } : null,
      ].filter(Boolean) as ActionDescriptor[],
    };
  }, [order.status, paymentState, amountPaid, balanceDue, previewHref, props]);

  const paymentChipTone =
    paymentState === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : paymentState === "partial" ? "bg-amber-100 text-amber-800 border-amber-200"
      : paymentState === "overpaid" ? "bg-rose-100 text-rose-800 border-rose-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  const paymentChipLabel =
    paymentState === "paid" ? "PAID"
      : paymentState === "partial" ? `PARTIAL · ${fmt(amountPaid)} of ${fmt(total)}`
      : paymentState === "overpaid" ? `OVERPAID by ${fmt(amountPaid - total)}`
      : "UNPAID";

  return (
    <div className="space-y-4">
      {/* Identity row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-bold text-[#1c1712] leading-tight">{snap.name}</p>
          {snap.company && <p className="text-sm text-gray-600 leading-tight">{snap.company}</p>}
          <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs">
            {snap.email && (
              <a href={`mailto:${snap.email}`} className="text-[#16C2F3] hover:underline truncate">{snap.email}</a>
            )}
            {snap.phone && (
              <a href={`tel:${snap.phone}`} className="text-[#16C2F3] hover:underline">{snap.phone}</a>
            )}
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{order.order_number}</p>
          <p className="text-2xl font-bold text-[#1c1712] font-mono tracking-tight">{fmt(total)}</p>
          <div className="mt-1.5 flex items-center md:justify-end gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${paymentChipTone}`}>
              {ledgerLoaded ? paymentChipLabel : "loading…"}
            </span>
          </div>
        </div>
      </div>

      {/* Next-step prompt + actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-800 leading-snug">{nextStep.headline}</p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {nextStep.actions.map((action, i) => (
            <ActionButton key={i} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, variant, loading, loadingLabel, onClick, disabled, external }: ActionDescriptor) {
  const styles: Record<ActionDescriptor["variant"], string> = {
    primary: "bg-[#1c1712] text-white hover:bg-black",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    secondary: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  };
  const className = `inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`;
  const content = loading ? (loadingLabel ?? "Working…") : label;

  if (external) {
    return (
      <a href={external.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={loading || disabled} className={className}>
      {content}
    </button>
  );
}
