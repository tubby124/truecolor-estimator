#!/usr/bin/env node
/**
 * Stop Hook — Pricing Validation
 * Runs pricing validation before Claude finishes any task that touched
 * pricing-related files. Blocks if npm validate:pricing or pattern checks fail.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

// Mirrors WRONG_PATTERNS in post-edit-price-check.mjs
const WRONG_PATTERNS = [
  [/from \$45.*banner|banner.*from \$45/i,           "Banner 'from' should be $66, not $45"],
  [/from \$39.*acp|acp.*from \$39|from \$39.*aluminum/i, "ACP 'from' should be $60, not $39"],
  [/from \$24.*coroplast|coroplast.*from \$24|yard signs? from \$24/i, "Coroplast 'from' should be $30, not $24"],
  [/from \$24\/sqft.*magnet|magnet.*from \$24/i,     "Magnet marketing 'from' should be $45, not $24/sqft"],
  [/from \$8\/sqft.*decal|decal.*from \$8\/sqft/i,   "Window Decals are $11/sqft, not $8/sqft"],
  [/(\d+)\+\s*sqft.*(discount|off|save)/i,           "Volume discounts must be QTY-based (5+ signs), not sqft-based"],
  [/\$2\.00.*grommet|grommet.*\$2\.00|\$3\.00.*grommet/i, "Grommets are $2.50/each"],
  [/\$30.*rush|\$50.*rush|rush.*\$30|rush.*\$50/i,   "Rush is +$40 flat"],
  [/PST\s*6%/i,                                      "Saskatchewan has no PST on printing — GST 5% only"],
  [/vercel\.app/i,                                   "Use truecolorprinting.ca, not vercel.app"],
];

const EXCEPTION_PATTERNS = [
  /fromPrice\s*[=:]/i,
  /above\s+the\s+\$\d+\s+minimum/i,
  /for\s+orders\s+above/i,
  /\/sqft\s+for\s+orders/i,
  /minimum\s+is\s+\$\d+/i,
  /\/sqft.*minimum|minimum.*\/sqft/i,
];

const PRICING_FILE_PATTERN =
  /page\.tsx$|products-content\.ts$|pricing_rules|products\.v1|PRICING_QUICK_REFERENCE|gbp-products/;

const PAGE_TSX_PATTERN = /page\.tsx$/;

// --- Read stdin ---
let input;
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const cwd = input?.cwd ?? process.cwd();

// --- Step 1: Get files changed since last commit (staged + unstaged) ---
let changedFiles = [];
try {
  // git diff HEAD covers unstaged; git diff --cached HEAD covers staged
  const unstaged = spawnSync("git", ["diff", "--name-only", "HEAD"], {
    cwd, encoding: "utf8", timeout: 10_000,
  });
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "HEAD"], {
    cwd, encoding: "utf8", timeout: 10_000,
  });

  if (unstaged.error) throw unstaged.error;
  if (staged.error)   throw staged.error;

  const raw = `${unstaged.stdout ?? ""}\n${staged.stdout ?? ""}`;
  changedFiles = [...new Set(raw.trim().split("\n").filter(Boolean))];
} catch (err) {
  process.stderr.write(`[stop-price-validation] git diff failed: ${err.message}\n`);
  process.exit(0);
}

// --- Step 2: Skip if no pricing files touched ---
const pricingFilesTouched = changedFiles.some((f) => PRICING_FILE_PATTERN.test(f));
if (!pricingFilesTouched) {
  process.exit(0);
}

const issues = [];

// --- Step 3: npm run validate:pricing ---
try {
  const result = spawnSync("npm", ["run", "validate:pricing"], {
    cwd,
    encoding: "utf8",
    shell: true,
    timeout: 30_000,
  });

  if (result.status !== 0) {
    const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    // Keep only the meaningful lines, skip npm boilerplate
    const relevant = combined
      .split("\n")
      .filter((l) =>
        /FAIL|ERROR|✗|×|check \d+|Warning|failed/i.test(l) && !/^npm (warn|notice|info)/i.test(l)
      )
      .join("\n")
      .trim();
    issues.push(`[VALIDATE:PRICING]\n${relevant || combined.slice(0, 1200).trim()}`);
  }
} catch (err) {
  process.stderr.write(`[stop-price-validation] npm validate:pricing error: ${err.message}\n`);
  // Runner failure — don't block, just warn
}

// --- Step 4: Wrong-pattern scan across changed page.tsx files ---
const pageFiles = changedFiles.filter((f) => PAGE_TSX_PATTERN.test(f));
const patternErrors = [];

for (const relPath of pageFiles) {
  const absPath = relPath.startsWith("/") ? relPath : join(cwd, relPath);
  let content;
  try {
    content = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*(\/\/|\/\*|\*|<!--)/.test(line)) continue;
    if (EXCEPTION_PATTERNS.some((p) => p.test(line))) continue;

    for (const [pattern, message] of WRONG_PATTERNS) {
      if (pattern.test(line)) {
        patternErrors.push(`  ${relPath}:${i + 1} — ${message}`);
        break;
      }
    }
  }
}

if (patternErrors.length > 0) {
  issues.push(`[PATTERN CHECK]\n${patternErrors.join("\n")}`);
}

// --- Step 5: Pass or block ---
if (issues.length === 0) {
  process.exit(0);
}

const output = {
  decision: {
    block: true,
    reason: `Pricing validation found issues before task completion:\n\n${issues.join("\n\n")}\n\nPlease fix before finishing.`,
  },
};

process.stdout.write(JSON.stringify(output));
process.exit(0);
