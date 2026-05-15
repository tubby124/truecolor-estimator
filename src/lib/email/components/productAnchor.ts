/**
 * Human-readable product anchor extracted from an items array.
 *
 * Used in subject lines and preheaders so customers recognise the email by
 * what they ordered instead of by a TC-XXXXX number they don't remember.
 *
 * Examples:
 *   [{name:"Business Cards", qty:50}]                       → "50 business cards"
 *   [{name:"Coroplast Signs", qty:5}, {name:"Banners", qty:2}] → "5 coroplast signs + 1 more"
 *   [] / null                                               → "your order"
 *
 * Always lowercase — feels conversational, matches existing voice.
 */

interface AnchorItem {
  product_name?: string | null;
  qty?: number | null;
}

export function productAnchor(items: AnchorItem[] | null | undefined): string {
  if (!items || items.length === 0) return "your order";

  const first = items[0];
  const rawName = (first.product_name ?? "").trim();
  const qty = first.qty ?? 0;
  if (!rawName) return "your order";

  // Subject-safe: legacy orders (pre-2026-05-15) stored bloated product_name
  // like "45x Sticker (Stickers / Vinyl Decals) — 3mil Vinyl, 10cm x 15cm, ...".
  // Strip the "{qty}x " prefix and cut at the first " — " or " (" so subjects
  // stay short. New orders already write a clean label.
  const stripped = rawName.replace(/^\d+x\s+/, "");
  const name = stripped.split(/\s+—\s+|\s+\(/)[0].trim() || stripped;

  const namePart = name.toLowerCase();
  const lead = qty > 0 ? `${qty} ${namePart}` : namePart;
  const extra = items.length - 1;
  return extra > 0 ? `${lead} + ${extra} more` : lead;
}
