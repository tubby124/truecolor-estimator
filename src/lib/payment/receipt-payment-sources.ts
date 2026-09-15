import type { SupabaseClient } from "@supabase/supabase-js";

export type ReceiptPaymentSource =
  | "clover"
  | "etransfer"
  | "cash"
  | "wave"
  | "other"
  | "recorded";

interface ReceiptPaymentLedgerRow {
  amount?: number | string | null;
  method?: string | null;
  status?: string | null;
}

const SOURCE_LABELS: Record<ReceiptPaymentSource, string> = {
  clover: "Credit / debit card (Clover)",
  etransfer: "Interac e-Transfer",
  cash: "Cash",
  wave: "Wave Payments",
  other: "Other recorded payment",
  recorded: "Recorded payment",
};

function normalizeSource(method: string | null | undefined): ReceiptPaymentSource {
  if (method === "clover" || method === "clover_card") return "clover";
  if (method === "etransfer" || method === "cash" || method === "wave" || method === "other") {
    return method;
  }
  return "recorded";
}

export function receiptPaymentSourcesFromLedger(
  rows: ReceiptPaymentLedgerRow[] | null | undefined,
): ReceiptPaymentSource[] {
  if (!Array.isArray(rows)) return ["recorded"];

  const sources: ReceiptPaymentSource[] = [];
  for (const row of rows) {
    const amount = Number(row.amount);
    if ((row.status ?? "recorded") !== "recorded" || !Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    const source = normalizeSource(row.method);
    if (!sources.includes(source)) sources.push(source);
  }

  return sources.length > 0 ? sources : ["recorded"];
}

export function receiptPaymentSourceLabel(sources: ReceiptPaymentSource[]): string {
  const normalized: ReceiptPaymentSource[] = sources.length > 0 ? sources : ["recorded"];
  return normalized.map((source) => SOURCE_LABELS[source] ?? SOURCE_LABELS.recorded).join(" + ");
}

export async function loadReceiptPaymentSources(
  supabase: Pick<SupabaseClient, "from">,
  orderId: string,
): Promise<ReceiptPaymentSource[]> {
  try {
    const { data, error } = await supabase
      .from("order_payments")
      .select("amount, method, status, recorded_at")
      .eq("order_id", orderId)
      .order("recorded_at", { ascending: true });

    if (error || !Array.isArray(data)) return ["recorded"];
    return receiptPaymentSourcesFromLedger(data);
  } catch {
    return ["recorded"];
  }
}
