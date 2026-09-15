import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CLOVER_LINE_ITEM_NAME_MAX,
  normalizeCloverLineItemName,
} from "@/lib/payment/clover";

export interface CloverDescriptionItem {
  product_name?: unknown;
  qty?: unknown;
  width_in?: unknown;
  height_in?: unknown;
  sides?: unknown;
  addons?: unknown;
}

const ADDON_LABELS: Record<string, string> = {
  GROMMET: "grommet",
  GROMMETS: "grommets",
  H_STAKE: "H-stake",
  H_STAKES: "H-stakes",
  INSTALLATION: "installation",
  LAMINATE: "laminate",
  MOUNTING: "mounting",
  STAKE: "stake",
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return clean || null;
}

function positiveNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function positiveInteger(value: unknown): number | null {
  const number = positiveNumber(value);
  return number !== null && Number.isSafeInteger(number) ? number : null;
}

function compactNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function addonLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((entry) => {
    const key = cleanText(entry)?.toUpperCase();
    if (!key) return [];
    return [ADDON_LABELS[key] ?? key.toLowerCase().replace(/_/g, " ")];
  }))];
}

interface ItemSummary {
  base: string;
  detailed: string;
}

function summarizeItem(item: CloverDescriptionItem): ItemSummary | null {
  const name = cleanText(item.product_name);
  const qty = positiveInteger(item.qty);
  if (!name || qty === null) return null;

  const details: string[] = [];
  const width = positiveNumber(item.width_in);
  const height = positiveNumber(item.height_in);
  if (width !== null && height !== null) {
    details.push(`${compactNumber(width)}x${compactNumber(height)} in`);
  }
  if (Number(item.sides) === 2) details.push("double-sided");
  details.push(...addonLabels(item.addons));

  const base = `${qty}x ${name}`;
  return {
    base,
    detailed: `${base}${details.length > 0 ? ` (${details.join(", ")})` : ""}`,
  };
}

function truncateSegment(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, Math.max(0, maxLength));
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function buildCloverOrderDescription(input: {
  orderNumber: unknown;
  items: unknown;
  isPartialBalance?: boolean;
}): string {
  const orderNumber = cleanText(input.orderNumber);
  const orderLabel = orderNumber ? `Order ${orderNumber}` : "True Color order";
  const prefix = input.isPartialBalance
    ? `Balance for ${orderNumber ?? "True Color order"}: `
    : `${orderLabel}: `;
  const items = Array.isArray(input.items)
    ? input.items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const summary = summarizeItem(item as CloverDescriptionItem);
        return summary ? [summary] : [];
      })
    : [];

  if (items.length === 0) return normalizeCloverLineItemName(orderLabel);

  const rendered = items.map((item) => item.base);
  for (const [index, item] of items.entries()) {
    const withDetail = [...rendered];
    withDetail[index] = item.detailed;
    if (`${prefix}${withDetail.join("; ")}`.length <= CLOVER_LINE_ITEM_NAME_MAX) {
      rendered[index] = item.detailed;
    }
  }

  const full = `${prefix}${rendered.join("; ")}`;
  if (full.length <= CLOVER_LINE_ITEM_NAME_MAX) return full;

  // Prefer complete item summaries. If all items cannot fit, keep the order
  // identity and state how many persisted items remain on the order.
  for (let included = items.length - 1; included >= 1; included -= 1) {
    const remainder = items.length - included;
    const candidate = `${prefix}${items.slice(0, included).map((item) => item.base).join("; ")}; +${remainder} more`;
    if (candidate.length <= CLOVER_LINE_ITEM_NAME_MAX) return candidate;
  }

  if (items.length > 1) {
    const suffix = `; +${items.length - 1} more`;
    const available = CLOVER_LINE_ITEM_NAME_MAX - prefix.length - suffix.length;
    if (available > 0) return `${prefix}${truncateSegment(items[0].base, available)}${suffix}`;
  }

  return normalizeCloverLineItemName(full);
}

export async function loadCloverOrderDescription(
  supabase: SupabaseClient,
  orderId: string,
  isPartialBalance: boolean,
): Promise<string> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      order_number,
      order_items ( product_name, qty, width_in, height_in, sides, addons )
    `)
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) throw new Error("Stored Clover checkout items could not be loaded");

  return buildCloverOrderDescription({
    orderNumber: data.order_number,
    items: data.order_items,
    isPartialBalance,
  });
}
