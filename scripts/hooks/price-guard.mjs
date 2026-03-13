#!/usr/bin/env node
/**
 * PreToolUse Pricing Guard Hook
 * Injects pricing communication rules into Claude's context when editing
 * customer-facing pages or product content files.
 *
 * Triggers on: page.tsx | products-content.ts | gbp-products.json
 */

import { readFileSync } from "fs";
import { join } from "path";

const KEY_REMINDERS = `KEY REMINDERS:
- Coroplast marketing from = $30 (NOT $8/sqft, NOT $24)
- Banner marketing from = $66 (NOT $45)
- ACP marketing from = $60 (NOT $39)
- Magnets marketing from = $45 (NOT $24/sqft)
- Vinyl Lettering from = $40
- Window Decals from $11/sqft (NOT $8/sqft)
- Volume discounts are QTY-based (5+ signs), NEVER sqft-based
- Rush = +$40 flat, Design = $35, always separate
- All prices pre-tax`;

// --- Read hook input ---
let input;
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath =
  input?.tool_input?.file_path ?? input?.tool_input?.path ?? "";

// --- File filter ---
const TRIGGER_PATTERN = /(?:page\.tsx|products-content\.ts|gbp-products\.json)$/;
if (!TRIGGER_PATTERN.test(filePath)) {
  process.exit(0);
}

// --- Resolve pricing reference file ---
const cwd = input?.cwd ?? process.cwd();
const pricingFile = join(cwd, "data", "PRICING_QUICK_REFERENCE.md");

let commRulesText = "";
try {
  const raw = readFileSync(pricingFile, "utf8");

  // Extract everything between "## Communication Rules" and "## Wide Format"
  const start = raw.indexOf("## Communication Rules");
  const end = raw.indexOf("## Wide Format");

  if (start !== -1 && end !== -1 && end > start) {
    commRulesText = raw.slice(start, end).trim();
  } else if (start !== -1) {
    // Fallback: take 2000 chars from start marker
    commRulesText = raw.slice(start, start + 2000).trim();
  }
} catch {
  // Can't read file — still emit reminders with a warning
  commRulesText =
    "WARNING: Could not read data/PRICING_QUICK_REFERENCE.md — verify prices manually before saving.";
}

// --- Build output ---
const additionalContext = [
  "PRICING GUARD ACTIVE — You are editing a customer-facing page.",
  "",
  commRulesText,
  "",
  KEY_REMINDERS,
].join("\n");

const output = {
  hookSpecificOutput: {
    additionalContext,
  },
};

process.stdout.write(JSON.stringify(output));
process.exit(0);
