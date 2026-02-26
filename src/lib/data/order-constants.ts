/**
 * Shared order status & design label constants.
 * Used by both staff OrdersTable and customer AccountClientPage.
 */

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  payment_received: "Payment received",
  in_production: "In production",
  ready_for_pickup: "Ready for pickup",
  complete: "Complete",
};

export const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  payment_received: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-green-100 text-green-800",
  complete: "bg-gray-100 text-gray-600",
};

export const VALID_STATUSES = [
  "pending_payment",
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
] as const;

export const STATUS_STEPS = [
  { key: "pending_payment", label: "Ordered" },
  { key: "payment_received", label: "Paid" },
  { key: "in_production", label: "Printing" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "complete", label: "Done" },
] as const;

export const NEXT_STATUS: Record<string, string> = {
  pending_payment: "payment_received",
  payment_received: "in_production",
  in_production: "ready_for_pickup",
  ready_for_pickup: "complete",
};

export const NEXT_LABEL: Record<string, string> = {
  pending_payment: "Mark paid",
  payment_received: "Start production",
  in_production: "Mark ready",
  ready_for_pickup: "Mark complete",
};

export const DESIGN_LABELS: Record<string, string> = {
  PRINT_READY: "Print-ready",
  MINOR_EDIT: "Minor edit",
  FULL_DESIGN: "Full design",
  LOGO_RECREATION: "Logo recreation",
  NEED_DESIGN: "Design needed",
  NEED_TOUCHUP: "Touch-up",
  NEED_REVISION: "Revision",
};
