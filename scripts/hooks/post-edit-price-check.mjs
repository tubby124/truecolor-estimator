#!/usr/bin/env node
/**
 * PostToolUse Pricing Pattern Checker Hook
 * Blocks the edit if known wrong pricing patterns are found in customer-facing files.
 *
 * Triggers on: page.tsx | products-content.ts
 */

import { readFileSync } from "fs";
import { join, basename } from "path";

// [regex, errorMessage]
const WRONG_PATTERNS = [
  [
    /from \$45.{0,25}banner|banner.{0,25}from \$45/i,
    "Banner 'from' should be $66, not $45",
  ],
  [
    /from \$39.{0,25}acp|acp.{0,25}from \$39|from \$39.{0,25}aluminum/i,
    "ACP 'from' should be $60, not $39",
  ],
  [
    /from \$24.{0,25}coroplast|coroplast.{0,25}from \$24|yard signs? from \$24/i,
    "Coroplast 'from' should be $30, not $24",
  ],
  [
    /from \$24\/sqft.{0,25}magnet|magnet.{0,25}from \$24/i,
    "Magnet marketing 'from' should be $45, not $24/sqft",
  ],
  [
    /from \$8\/sqft.*decal|decal.*from \$8\/sqft/i,
    "Window Decals are $11/sqft, not $8/sqft",
  ],
  [
    /(\d+)\+\s*sqft.*(discount|off|save)/i,
    "Volume discounts must be QTY-based (5+ signs), not sqft-based",
  ],
  [
    /\$2\.00.*grommet|grommet.*\$2\.00|\$3\.00.*grommet/i,
    "Grommets are $2.50/each",
  ],
  [
    /\$30.*rush|\$50.*rush|rush.*\$30|rush.*\$50/i,
    "Rush is +$40 flat",
  ],
  [
    /PST\s*6%/i,
    "Saskatchewan has no PST on printing — GST 5% only",
  ],
  [
    /vercel\.app/i,
    "Use truecolorprinting.ca, not vercel.app",
  ],
];

// If a line matches any of these, skip wrong-pattern checks on that line.
// Covers: product reference card sqft rates (fromPrice prop) and FAQ explanations.
const EXCEPTION_PATTERNS = [
  /fromPrice\s*[=:]/i,                  // product card sqft rate prop (rule 9)
  /above\s+the\s+\$\d+\s+minimum/i,     // FAQ: "X/sqft for orders above the $Y minimum"
  /for\s+orders\s+above/i,              // FAQ explanation
  /\/sqft\s+for\s+orders/i,             // FAQ explanation
  /minimum\s+is\s+\$\d+/i,             // FAQ explanation
  /\/sqft.*minimum|minimum.*\/sqft/i,   // any sqft + minimum pairing
];

// --- Read stdin ---
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
// Match any .ts/.tsx file (not just page.tsx) so pricing checks run on
// components, email templates, and test files at any absolute path.
const TRIGGER_PATTERN = /\.tsx?$/;
if (!TRIGGER_PATTERN.test(filePath)) {
  process.exit(0);
}

// --- Resolve absolute path ---
const cwd = input?.cwd ?? process.cwd();
const absPath = filePath.startsWith("/") ? filePath : join(cwd, filePath);

let content;
try {
  content = readFileSync(absPath, "utf8");
} catch {
  // File unreadable (e.g., during test with non-existent path) — skip
  process.exit(0);
}

// --- Line-by-line scan ---
const lines = content.split("\n");
const errors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip blank lines and code comments
  if (!line.trim() || /^\s*(\/\/|\/\*|\*|<!--)/.test(line)) continue;

  // Skip lines in an exception context
  if (EXCEPTION_PATTERNS.some((p) => p.test(line))) continue;

  // Check each wrong pattern — report first match per line
  for (const [pattern, message] of WRONG_PATTERNS) {
    if (pattern.test(line)) {
      errors.push(`Line ${i + 1}: ${message}\n  → ${line.trim()}`);
      break;
    }
  }
}

if (errors.length === 0) {
  process.exit(0);
}

// --- Block the edit ---
const filename = basename(filePath);
const output = {
  decision: {
    block: true,
    reason: `PRICING ERRORS in ${filename}:\n• ${errors.join("\n• ")}\n\nFix these before proceeding. Reference: data/PRICING_QUICK_REFERENCE.md`,
  },
};

process.stdout.write(JSON.stringify(output));
process.exit(0);
