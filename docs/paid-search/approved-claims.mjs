// Sourced-fact registry for Google Ads copy.
//
// WHY THIS EXISTS
// ---------------
// The original contract banned EVERY number from RSA copy: config-validator failed any
// headline containing a digit unless the exact string sat on a 3-entry allowlist. The intent
// was right (no unsourced claims — the same zero-hallucination policy that governs the site),
// but the implementation banned the wrong thing. It banned *numbers*, not *unsourced numbers*.
// The result was months of ads that could not state a price, a turnaround, or a quantity —
// stripping out the only assets True Color has over VistaPrint and Minuteman, and putting the
// ad contract in direct conflict with .claude/rules/brand-voice.md, which MANDATES a price in
// the first line and "Same-day rush +$40 flat".
//
// This registry replaces the exact-string allowlist with token resolution: every numeric token
// in a claim must resolve to a fact that has a named source. Copy passes if — and only if —
// every number in it is a known, sourced fact. Invent a price and validation fails.
//
// ADDING A FACT
// -------------
// 1. Verify the value against data/PRICING_QUICK_REFERENCE.md (or the CSV it cites).
// 2. Add the token with an honest `source` string. No source, no entry.
// 3. Bump VERIFIED_ON to today.
// Never add a token to make a headline pass. Change the headline instead.

/**
 * Last date every fact below was checked against the pricing source of truth.
 * The validator compares this to the `**Updated:**` header in data/PRICING_QUICK_REFERENCE.md
 * and FAILS if pricing is newer. Rationale: the moment ads carry real prices, a CSV repricing
 * silently makes every live ad false. That is a trust problem, not a style problem.
 */
export const VERIFIED_ON = "2026-05-20";

export const PRICING_SOURCE_FILE = "data/PRICING_QUICK_REFERENCE.md";

/**
 * kind:
 *   "price"     — a dollar amount a customer actually pays
 *   "condition" — a qualifier that makes a turnaround claim honest (cutoff, day range)
 *   "quantity"  — a lot size tied to a lot price
 *   "spec"      — a material/stock fact
 *   "proof"     — verifiable third-party proof
 *   "place"     — physical location
 *
 * Only "price" and "condition" tokens can unlock a turnaround-shaped claim. See
 * FORBIDDEN_CLAIM_PATTERNS handling in config-validator.mjs.
 */
export const SOURCED_FACTS = {
  // ── prices ────────────────────────────────────────────────────────────────
  "$8.25/sqft": { kind: "price", meaning: "vinyl banner T1 sqft rate", source: "pricing_rules.v1.csv — banner T1" },
  "$8/sqft": { kind: "price", meaning: "coroplast T1 sqft rate", source: "pricing_rules.v1.csv — coroplast 0-12 sqft" },
  "$219": { kind: "price", meaning: "retractable banner, economy stand + print", source: "PRICING_QUICK_REFERENCE.md — lot-priced table" },
  "$110": { kind: "price", meaning: "1000 business cards, 2-sided", source: ".claude/rules/truecolor-pricing-comms.md" },
  "+$40": { kind: "price", meaning: "same-day rush fee, flat, PST-exempt", source: ".claude/rules/truecolor-domain.md — rush +$40 flat" },
  "$40": { kind: "price", meaning: "same-day rush fee, flat", source: ".claude/rules/truecolor-domain.md — rush +$40 flat" },
  "$66": { kind: "price", meaning: "vinyl banner 2x4ft", source: "PRICING_QUICK_REFERENCE.md — banners from $66" },
  "$65": { kind: "price", meaning: "500 business cards, 2-sided", source: ".claude/rules/truecolor-pricing-comms.md" },
  "$45": { kind: "price", meaning: "250 business cards 2S / 100 flyers 2S", source: "PRICING_QUICK_REFERENCE.md — lot-priced table" },
  "$39": { kind: "price", meaning: "ACP aluminum sign, 18x24", source: "PRICING_QUICK_REFERENCE.md — ACP from $39" },
  "$35": { kind: "price", meaning: "in-house design fee, flat, same-day proof", source: ".claude/rules/truecolor-domain.md — design $35 flat" },
  "$25": { kind: "price", meaning: "order-total minimum at checkout; coroplast/sticker/sign from-price", source: "PRICING_QUICK_REFERENCE.md — $25 order-total minimum" },

  // ── conditions (make a turnaround claim honest) ───────────────────────────
  "10 AM": { kind: "condition", meaning: "rush order cutoff", source: ".claude/rules/truecolor-domain.md — order before 10 AM" },
  "1-3": { kind: "condition", meaning: "standard turnaround, business days, after artwork approval", source: ".claude/rules/truecolor-domain.md" },

  // ── quantities tied to lot prices ─────────────────────────────────────────
  "1000": { kind: "quantity", meaning: "business card lot size", source: ".claude/rules/truecolor-pricing-comms.md" },
  "500": { kind: "quantity", meaning: "business card lot size", source: ".claude/rules/truecolor-pricing-comms.md" },
  "250": { kind: "quantity", meaning: "business card lot size (standard)", source: "PRICING_QUICK_REFERENCE.md" },
  "100": { kind: "quantity", meaning: "flyer lot size (standard)", source: "PRICING_QUICK_REFERENCE.md" },
  "25": { kind: "quantity", meaning: "sticker lot size, 2x2in", source: "PRICING_QUICK_REFERENCE.md — stickers from $25" },

  // ── material / stock specs ────────────────────────────────────────────────
  "2x4ft": { kind: "spec", meaning: "smallest stocked vinyl banner size", source: "PRICING_QUICK_REFERENCE.md — 2x4 ft = $66" },
  "4x8ft": { kind: "spec", meaning: "max large-format panel size", source: ".claude/rules/truecolor-domain.md — SIGN-CORO4-4X8FT" },
  "13oz": { kind: "spec", meaning: "scrim vinyl banner material weight", source: ".claude/rules/content-formats.md — 13oz scrim vinyl" },
  "14pt": { kind: "spec", meaning: "business card stock", source: "PRICING_QUICK_REFERENCE.md — 250 qty 2-sided 14pt gloss" },
  "80lb": { kind: "spec", meaning: "flyer gloss text stock", source: "PRICING_QUICK_REFERENCE.md — 100 qty full-letter 2-sided 80lb" },
  "4mm": { kind: "spec", meaning: "coroplast corrugated thickness", source: ".claude/rules/truecolor-domain.md — 4mm coroplast" },

  // ── proof ─────────────────────────────────────────────────────────────────
  "4.9": { kind: "proof", meaning: "Google review rating", source: "Known Google review proof: 4.9 from 43 reviews" },
  "43": { kind: "proof", meaning: "Google review count", source: "Known Google review proof: 4.9 from 43 reviews" },

  // ── place ─────────────────────────────────────────────────────────────────
  "216 33rd St W": { kind: "place", meaning: "shop street address", source: ".claude/rules/truecolor-domain.md — 216 33rd St W, Saskatoon" },
};

/**
 * Claims that can NEVER be unlocked by registering a token. These are Google Ads policy and
 * consumer-protection risk, not style preferences. No source makes them safe.
 */
export const NEVER_ALLOWED_PATTERNS = [
  /\bguarante(?:e|ed|es)\b/i,
  /\bno risk\b/i,
  /\b(?:lowest|cheapest|best)\s+price(?:s)?\s+(?:in|guaranteed)\b/i,
];

/**
 * Turnaround-shaped claims. Allowed ONLY when the same claim also carries a resolved
 * price or condition token — i.e. "Same-Day Rush +$40 Flat" passes, bare "Ready Today" does not.
 */
export const CONDITIONAL_CLAIM_PATTERNS = [
  /\b(?:ready today|cut[ -]?off)\b/i,
  /\b(?:same[ -]?day|next[ -]?day|24[ -]?hour|48[ -]?hour|overnight)\b/i,
  /\b(?:rush|turnaround)\b/i,
];

// Longest-first so "1000" is consumed before "100", and "10 AM" before "1000".
const TOKENS_LONGEST_FIRST = Object.keys(SOURCED_FACTS)
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

const escapeRegExp = (value) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Strip every registered token from `text`, then report any digits that survive.
 * Surviving digits are, by definition, claims with no source.
 *
 * @returns {{ resolved: string[], unresolved: string[], kinds: Set<string> }}
 */
export function resolveClaim(text) {
  let remaining = String(text ?? "");
  const resolved = [];
  const kinds = new Set();

  for (const token of TOKENS_LONGEST_FIRST) {
    const pattern = new RegExp(escapeRegExp(token), "gi");
    if (!pattern.test(remaining)) continue;
    resolved.push(token);
    kinds.add(SOURCED_FACTS[token].kind);
    remaining = remaining.replaceAll(new RegExp(escapeRegExp(token), "gi"), " ");
  }

  // Anything numeric still standing is an unsourced claim. Report the actual runs of digits
  // so the failure message tells the author exactly which number to source or delete.
  const unresolved = remaining.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return { resolved, unresolved, kinds };
}

/**
 * Full gate for a single headline / description / callout / sitelink line.
 *
 * `requireConditionQualifier` is TRUE for all new copy. It is FALSE only for the legacy
 * variant-A RSAs, which were written under the old number-ban, are live and policy-APPROVED,
 * and must stay byte-identical while they serve as the control arm. Their vague rush wording
 * ("Rush Options Available") is exactly what this registry exists to stop shipping — the
 * exemption disappears when variant A is retired. Do NOT widen it to new copy.
 *
 * @returns {string | null} failure reason, or null if the claim is clean.
 */
export function claimFailureReason(text, { requireConditionQualifier = true } = {}) {
  const claim = String(text ?? "");

  for (const pattern of NEVER_ALLOWED_PATTERNS) {
    if (pattern.test(claim)) return `contains a permanently banned claim (guarantee / superlative): "${claim}"`;
  }

  const { unresolved, kinds } = resolveClaim(claim);
  if (unresolved.length) {
    return `contains unsourced number(s) ${unresolved.map((n) => `"${n}"`).join(", ")} in "${claim}" — add the fact to SOURCED_FACTS with a real source, or remove the claim`;
  }

  if (requireConditionQualifier && CONDITIONAL_CLAIM_PATTERNS.some((pattern) => pattern.test(claim))) {
    const qualified = kinds.has("price") || kinds.has("condition");
    if (!qualified) {
      return `makes a turnaround claim with no price or condition attached: "${claim}" — say what it costs (+$40) or when it applies (before 10 AM)`;
    }
  }

  return null;
}

/** True when the claim carries at least one sourced dollar amount. */
export const hasPriceClaim = (text) => resolveClaim(text).kinds.has("price");

/**
 * Back-compat shape for campaign-config's `approvedClaims` block. Derived, never hand-edited,
 * so the config can never drift from the registry.
 */
export const approvedClaims = Object.entries(SOURCED_FACTS)
  .map(([text, fact]) => ({ text, source: fact.source }));

export default SOURCED_FACTS;
