// Brokerage portal config — one JSON file per brokerage at /portal/[slug].
//
// Pricing fields here are the staff-facing reference prices the agent sees in
// the portal. They are NOT pushed through the pricing engine; staff confirm
// the final invoice price after proof. (Phase 1 — keeps engine pure.)
//
// Assets: brokerages give us a Google Drive / Dropbox link containing per-agent
// PDFs. We never expose this link to agents — staff opens it server-side when
// preparing the proof. Stored here so it's one place to update.

export interface BrokerageProductOption {
  /** Stable id used in form payload — e.g. "for-sale-aluminum-24x30" */
  id: string;
  /** Display name shown to the agent */
  label: string;
  /** Short helper line below the label */
  blurb?: string;
  /** Indicative per-unit price shown to the agent (CAD, pre-tax) */
  unitPrice: number;
  /** Discounted per-unit price at a quantity tier */
  bulkTiers?: Array<{ minQty: number; unitPrice: number }>;
  /** Available qty options shown in the dropdown */
  qtyOptions: number[];
  /** Whether the agent can pick "Single-sided" / "Double-sided" */
  sidesPicker?: boolean;
  /** True Color SKU / category this maps to internally (for staff reference) */
  tcCategory: string;
  /** True/false: this product is a sign topper (renders text input for topper text) */
  isTopper?: boolean;
}

export interface BrokerageProductGroup {
  /** Section heading on the portal page */
  title: string;
  /** Optional intro paragraph */
  intro?: string;
  products: BrokerageProductOption[];
}

export interface Brokerage {
  /** URL slug — /portal/[slug] */
  slug: string;
  /** Full legal / brand name */
  name: string;
  /** Short tagline shown on the portal hero */
  tagline?: string;
  /** Primary brand color (hex, with #) — used for buttons + accents */
  brandColor: string;
  /** Optional logo URL (under /public/) */
  logoSrc?: string;
  /** Broker contact — shown in the portal header for trust */
  brokerName: string;
  brokerEmail: string;
  brokerPhone: string;
  /** Internal: where per-agent brand assets live. Never exposed to agents. */
  assetDriveUrl: string;
  /** Cities served — shown on portal for trust + restricts shipping zones */
  citiesServed: string[];
  /** Grouped product catalog rendered as the order form */
  productGroups: BrokerageProductGroup[];
}
