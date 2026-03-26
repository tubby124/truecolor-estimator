import type { QuoteRequest, ItemMeta } from "@/app/staff/quotes/page";

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildReplyBody(quote: QuoteRequest): string {
  const itemLines = quote.items
    .map((item: ItemMeta, i: number) => {
      const lines: string[] = [`Item ${i + 1}: ${item.product || "Unspecified"}`];
      if (item.qty) lines.push(`  Qty: ${item.qty}`);
      if (item.material) lines.push(`  Material/Stock: ${item.material}`);
      if (item.dimensions) lines.push(`  Size: ${item.dimensions}`);
      if (item.sides)
        lines.push(`  Sides: ${item.sides === "2" ? "Double-sided" : "Single-sided"}`);
      if (item.notes) lines.push(`  Notes: ${item.notes}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return (
    `Hi ${quote.name},\n\nThanks for reaching out! Here's what we have on file for your request:\n\n${itemLines}\n\n` +
    `---\n[YOUR REPLY / PRICING HERE]\n---\n\n` +
    `Feel free to call us at (306) 954-8688 if it's easier.\n\n` +
    `— True Color Display Printing\n216 33rd St W, Saskatoon | truecolorprinting.ca`
  );
}

export function buildEstimateLink(quote: QuoteRequest): string {
  const params = new URLSearchParams({ email: quote.email });
  if (quote.name) params.set("customer", quote.name);
  const product = quote.items[0]?.product;
  if (product) params.set("product", product);
  return `/staff?${params.toString()}`;
}
