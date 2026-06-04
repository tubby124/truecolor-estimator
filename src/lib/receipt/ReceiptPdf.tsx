/**
 * src/lib/receipt/ReceiptPdf.tsx
 *
 * react-pdf/renderer template for True Color receipt PDF.
 * Used by /api/receipt/[oid]/pdf to generate a downloadable file.
 *
 * Mirrors the design of /account/receipt/[id] (dark header, cyan accents, tabular totals).
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptPdfItem {
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  category: string;
  line_total: number;
}

export interface ReceiptPdfPaymentLedgerEntry {
  amount: number;
  method: string;           // "clover" | "etransfer" | "cash" | "wave" | "other"
  payer: string | null;     // display label (company > name > email)
  recordedAt: string | null;
}

export interface ReceiptPdfData {
  orderNumber: string;
  orderDate: string;       // formatted: "April 8, 2026"
  status: string;          // e.g. "payment_received"
  customerName: string;
  customerEmail: string;
  customerCompany: string | null;
  paymentMethod: string;   // e.g. "clover_card"
  items: ReceiptPdfItem[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  isRush: boolean;
  rushFee: number;
  discountCode: string | null;
  discountAmount: number | null;
  // Ledger-derived payment state. When the document is generated pre-payment
  // (invoice mode) the route handler sets `amountPaid=0` and surfaces e-transfer
  // instructions + a Clover Pay Now link. Post-payment it shows the paid badge
  // and the ledger entries. Both share the same artifact so customers always
  // get a consistent True Color document — see /api/receipt/[oid]/pdf.
  amountPaid: number;
  balanceDue: number;
  paymentLedger: ReceiptPdfPaymentLedgerEntry[];
  payUrl: string | null;             // Clover Pay Now link, null after paid
  etransferEmail: string | null;     // e.g. info@true-color.ca when unpaid
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const BRAND_DARK = "#1c1712";
const BRAND_CYAN = "#16C2F3";
const GRAY_MED = "#6b7280";
const GRAY_LIGHT = "#f9fafb";
const GRAY_BORDER = "#e5e7eb";

const PAID_STATUSES = ["payment_received", "in_production", "ready_for_pickup", "complete"];

function paymentMethodLabel(method: string): string {
  if (method === "clover") return "Card";
  if (method === "etransfer") return "e-Transfer";
  if (method === "cash") return "Cash";
  if (method === "wave") return "Wave";
  return "Other";
}

const GST_NUMBER = process.env.NEXT_PUBLIC_GST_NUMBER ?? "731454914RT0001";

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BRAND_DARK,
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },

  // Header
  header: {
    backgroundColor: BRAND_DARK,
    paddingHorizontal: 40,
    paddingVertical: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flexDirection: "column" },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  brandName: {
    color: BRAND_CYAN,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  brandSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    marginLeft: 6,
    marginTop: 2,
  },
  headerAddress: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    lineHeight: 1.5,
  },
  paidBadge: {
    backgroundColor: BRAND_CYAN,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 1,
  },
  partialBadge: {
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 1,
  },
  unpaidBadge: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 1,
  },

  // Amount-due banner (unpaid / partial invoice)
  dueBanner: {
    marginHorizontal: 40,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  dueAmount: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
  },

  // Pay options + ledger blocks
  payBox: {
    marginHorizontal: 40,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    backgroundColor: GRAY_LIGHT,
  },
  payHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY_MED,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  payLine: {
    fontSize: 9,
    color: BRAND_DARK,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  payUrlLine: {
    fontSize: 8.5,
    color: BRAND_CYAN,
    marginTop: 2,
  },

  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  ledgerLeft: {
    fontSize: 9,
    color: BRAND_DARK,
  },
  ledgerAmount: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
  },

  // Title row
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 40,
    paddingTop: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  receiptTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: BRAND_DARK,
    letterSpacing: -0.5,
  },
  receiptDate: {
    fontSize: 9,
    color: GRAY_MED,
    marginTop: 3,
  },
  orderLabel: {
    fontSize: 7,
    color: GRAY_MED,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textAlign: "right",
    textTransform: "uppercase",
  },
  orderNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: BRAND_DARK,
    textAlign: "right",
    marginTop: 2,
  },

  // Meta row
  metaRow: {
    backgroundColor: GRAY_LIGHT,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  metaLine: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#374151",
    width: 90,
  },
  metaValue: {
    fontSize: 9,
    color: GRAY_MED,
    flex: 1,
  },

  // Items section
  itemsSection: {
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY_MED,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableHeaderDesc: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY_MED,
  },
  tableHeaderAmt: {
    width: 70,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY_MED,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: BRAND_DARK,
  },
  itemMeta: {
    fontSize: 8,
    color: GRAY_MED,
    marginTop: 2,
  },
  itemAmount: {
    width: 70,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: BRAND_DARK,
    textAlign: "right",
  },

  // Totals
  totalsSection: {
    paddingHorizontal: 40,
    paddingTop: 14,
  },
  totalsBox: {
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  totalsLabel: {
    fontSize: 9,
    color: GRAY_MED,
  },
  totalsValue: {
    fontSize: 9,
    color: GRAY_MED,
  },
  rushRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff7ed",
  },
  rushLabel: { fontSize: 9, color: "#c2410c" },
  rushValue: { fontSize: 9, color: "#c2410c", fontFamily: "Helvetica-Bold" },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#f0fdf4",
  },
  discountLabel: { fontSize: 9, color: "#15803d" },
  discountValue: { fontSize: 9, color: "#15803d", fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: BRAND_DARK,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // Footer
  footer: {
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.6,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paymentLabel(method: string): string {
  if (method === "clover_card") return "Credit / debit card";
  if (method === "wave") return "Wave Invoice";
  return "Interac e-Transfer";
}

function itemDescription(item: ReceiptPdfItem): string {
  const size = item.width_in && item.height_in ? ` — ${item.width_in}×${item.height_in}"` : "";
  const sides = item.category !== "BOOKLET" && item.sides === 2 ? " · 2-sided" : "";
  return `Qty ${item.qty}${size}${sides}`;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function ReceiptPdf({ data }: { data: ReceiptPdfData }) {
  // Document state: derived from ledger first, falls back to order.status for
  // legacy orders that haven't been migrated to the ledger yet.
  const ledgerPaid = data.amountPaid >= data.total - 0.01;
  const isPaid = ledgerPaid || (data.amountPaid <= 0.01 && PAID_STATUSES.includes(data.status));
  const isPartial = !isPaid && data.amountPaid > 0.01;
  const docKind = isPaid ? "Payment Receipt" : isPartial ? "Invoice — Partially Paid" : "Invoice";
  const docFileLabel = isPaid ? "Receipt" : "Invoice";

  const billedTo = data.customerCompany
    ? `${data.customerName} (${data.customerCompany})`
    : data.customerName;

  return (
    <Document
      title={`${docFileLabel} — True Color Order ${data.orderNumber}`}
      author="True Color Display Printing Ltd."
    >
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerBrand}>
              <Text style={s.brandName}>TRUE COLOR</Text>
              <Text style={s.brandSub}>Display Printing</Text>
            </View>
            <Text style={s.headerAddress}>
              216 33rd St W, Saskatoon SK  ·  info@true-color.ca  ·  (306) 954-8688
            </Text>
          </View>
          {isPaid ? (
            <Text style={s.paidBadge}>PAID</Text>
          ) : isPartial ? (
            <Text style={s.partialBadge}>PARTIAL</Text>
          ) : (
            <Text style={s.unpaidBadge}>UNPAID</Text>
          )}
        </View>

        {/* ── Title row ── */}
        <View style={s.titleRow}>
          <View>
            <Text style={s.receiptTitle}>{docKind}</Text>
            <Text style={s.receiptDate}>{data.orderDate}</Text>
          </View>
          <View>
            <Text style={s.orderLabel}>Order</Text>
            <Text style={s.orderNumber}>{data.orderNumber}</Text>
          </View>
        </View>

        {/* ── Meta ── */}
        <View style={s.metaRow}>
          <View style={s.metaLine}>
            <Text style={s.metaLabel}>Billed to:</Text>
            <Text style={s.metaValue}>{billedTo}</Text>
          </View>
          <View style={s.metaLine}>
            <Text style={s.metaLabel}>Email:</Text>
            <Text style={s.metaValue}>{data.customerEmail}</Text>
          </View>
          <View style={s.metaLine}>
            <Text style={s.metaLabel}>Payment:</Text>
            <Text style={s.metaValue}>{paymentLabel(data.paymentMethod)}</Text>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={s.itemsSection}>
          <Text style={s.sectionLabel}>Items</Text>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderDesc}>Description</Text>
            <Text style={s.tableHeaderAmt}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.product_name}</Text>
                <Text style={s.itemMeta}>{itemDescription(item)}</Text>
              </View>
              <Text style={s.itemAmount}>${Number(item.line_total).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsSection} wrap={false}>
          <View style={s.totalsBox}>
            {data.isRush && data.rushFee > 0 && (
              <View style={s.rushRow}>
                <Text style={s.rushLabel}>Rush fee (same-day priority)</Text>
                <Text style={s.rushValue}>+${data.rushFee.toFixed(2)}</Text>
              </View>
            )}
            {data.discountAmount && data.discountAmount > 0 ? (
              <View style={s.discountRow}>
                <Text style={s.discountLabel}>
                  Discount{data.discountCode ? ` (${data.discountCode})` : ""}
                </Text>
                <Text style={s.discountValue}>−${Number(data.discountAmount).toFixed(2)}</Text>
              </View>
            ) : null}
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>${Number(data.subtotal).toFixed(2)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>GST (5%)</Text>
              <Text style={s.totalsValue}>${Number(data.gst).toFixed(2)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>PST (6%)</Text>
              <Text style={s.totalsValue}>${Number(data.pst).toFixed(2)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total (CAD)</Text>
              <Text style={s.totalValue}>${Number(data.total).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ── Amount due banner (only when unpaid / partial) ── */}
        {!isPaid && (
          <View style={s.dueBanner} wrap={false}>
            <Text style={s.dueLabel}>Amount Due</Text>
            <Text style={s.dueAmount}>${data.balanceDue.toFixed(2)}</Text>
          </View>
        )}

        {/* ── Pay options (unpaid / partial) ── */}
        {!isPaid && (
          <View style={s.payBox} wrap={false}>
            <Text style={s.payHeading}>Ways to pay</Text>
            {data.payUrl && (
              <View>
                <Text style={s.payLine}>• Card (Clover) — pay securely online via the link below.</Text>
                <Text style={s.payUrlLine}>{data.payUrl}</Text>
              </View>
            )}
            {data.etransferEmail && (
              <Text style={s.payLine}>
                • Interac e-Transfer — send ${data.balanceDue.toFixed(2)} to {data.etransferEmail}. Reference order {data.orderNumber}.
              </Text>
            )}
          </View>
        )}

        {/* ── Payments recorded (partial / paid with multiple entries) ── */}
        {data.paymentLedger.length > 0 && (
          <View style={s.payBox} wrap={false}>
            <Text style={s.payHeading}>Payments recorded</Text>
            {data.paymentLedger.map((entry, i) => (
              <View key={i} style={s.ledgerRow}>
                <Text style={s.ledgerLeft}>
                  {entry.recordedAt ? `${entry.recordedAt}  ·  ` : ""}
                  {paymentMethodLabel(entry.method)}
                  {entry.payer ? `  ·  ${entry.payer}` : ""}
                </Text>
                <Text style={s.ledgerAmount}>${entry.amount.toFixed(2)}</Text>
              </View>
            ))}
            <View style={[s.ledgerRow, { paddingTop: 6, borderBottomWidth: 0 }]}>
              <Text style={[s.ledgerLeft, { fontFamily: "Helvetica-Bold" }]}>Total paid</Text>
              <Text style={s.ledgerAmount}>${data.amountPaid.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            True Color Display Printing Ltd.  ·  {GST_NUMBER}  ·  All amounts in CAD{"\n"}
            216 33rd St W, Saskatoon SK  ·  info@true-color.ca  ·  (306) 954-8688{"\n"}
            truecolorprinting.ca
          </Text>
        </View>

      </Page>
    </Document>
  );
}
