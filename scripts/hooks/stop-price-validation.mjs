#!/usr/bin/env node
/**
 * Stop Hook — Mandatory Skill Gate Enforcer
 *
 * Categorizes changed files and:
 *   A) Page changes     → validate:pricing + wrong-pattern scan + remind /web-design-ux + /e2e-test
 *   B) CSV changes       → validate:pricing (BLOCK on fail) + remind PRICING_QUICK_REFERENCE + /audit-prices
 *   C) Engine changes    → npm test (BLOCK on fail) + remind /e2e-test
 *   D) Email changes     → BLOCK if vercel.app found + remind /ecommerce-ux
 *   E) UI components     → remind /web-design-ux
 *
 * Reminders are non-blocking (additionalContext). Only real failures block.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

// --- Wrong-pattern definitions (mirrors post-edit-price-check.mjs) ---
const WRONG_PATTERNS = [
  [/from \$45.{0,25}banner|banner.{0,25}from \$45/i, "Banner 'from' should be $66, not $45"],
  [/from \$39.{0,25}acp|acp.{0,25}from \$39|from \$39.{0,25}aluminum/i, "ACP 'from' should be $60, not $39"],
  [/from \$24.{0,25}coroplast|coroplast.{0,25}from \$24|yard signs? from \$24/i, "Coroplast 'from' should be $30, not $24"],
  [/from \$24\/sqft.{0,25}magnet|magnet.{0,25}from \$24/i, "Magnet marketing 'from' should be $45, not $24/sqft"],
  [/from \$8\/sqft.*decal|decal.*from \$8\/sqft/i, "Window Decals are $11/sqft, not $8/sqft"],
  [/(\d+)\+\s*sqft.*(discount|off|save)/i, "Volume discounts must be QTY-based (5+ signs), not sqft-based"],
  [/\$2\.00.*grommet|grommet.*\$2\.00|\$3\.00.*grommet/i, "Grommets are $2.50/each"],
  [/\$30.*rush|\$50.*rush|rush.*\$30|rush.*\$50/i, "Rush is +$40 flat"],
  [/PST\s*6%/i, "Saskatchewan has no PST on printing — GST 5% only"],
  [/vercel\.app/i, "Use truecolorprinting.ca, not vercel.app"],
];

const EXCEPTION_PATTERNS = [
  /fromPrice\s*[=:]/i,
  /above\s+the\s+\$\d+\s+minimum/i,
  /for\s+orders\s+above/i,
  /\/sqft\s+for\s+orders/i,
  /minimum\s+is\s+\$\d+/i,
  /\/sqft.*minimum|minimum.*\/sqft/i,
];

// --- Category matchers ---
const isPage = (f) => /src\/app\/.*page\.tsx$/.test(f);
const isCsv = (f) => /^data\/tables\/.*\.csv$/.test(f);
const isEngine = (f) => /^src\/lib\/engine\//.test(f) || /^src\/components\/estimator\//.test(f);
const isEmail = (f) => /^src\/lib\/email\//.test(f);
const isUiComponent = (f) => /^src\/components\//.test(f) && !isEngine(f);

// --- Read stdin ---
let input;
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const cwd = input?.cwd ?? process.cwd();

// --- Get changed files (staged + unstaged + untracked new files) ---
let changedFiles = [];
try {
  const diff = spawnSync("git", ["diff", "--name-only", "HEAD"], {
    cwd, encoding: "utf8", timeout: 10_000,
  });
  const staged = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd, encoding: "utf8", timeout: 10_000,
  });

  if (diff.error) throw diff.error;
  if (staged.error) throw staged.error;

  const raw = `${diff.stdout ?? ""}\n${staged.stdout ?? ""}`;
  changedFiles = [...new Set(raw.trim().split("\n").filter(Boolean))];
} catch (err) {
  process.stderr.write(`[stop-hook] git diff failed: ${err.message}\n`);
  process.exit(0);
}

// --- Categorize ---
const pages = changedFiles.filter(isPage);
const csvs = changedFiles.filter(isCsv);
const engine = changedFiles.filter(isEngine);
const emails = changedFiles.filter(isEmail);
const ui = changedFiles.filter(isUiComponent);

// Exit silently if nothing relevant changed
if (pages.length + csvs.length + engine.length + emails.length + ui.length === 0) {
  process.exit(0);
}

const blockers = [];
const reminders = [];

// ========== CATEGORY A: Page changes ==========
if (pages.length > 0) {
  // A1: Run validate:pricing
  try {
    const vp = spawnSync("npm", ["run", "validate:pricing"], {
      cwd, encoding: "utf8", shell: true, timeout: 30_000,
    });
    if (vp.status !== 0) {
      const out = `${vp.stdout ?? ""}${vp.stderr ?? ""}`;
      const relevant = out.split("\n")
        .filter((l) => /FAIL|ERROR|✗|×|check \d+|Warning|failed/i.test(l) && !/^npm (warn|notice|info)/i.test(l))
        .join("\n").trim();
      blockers.push(`[VALIDATE:PRICING FAILED]\n${relevant || out.slice(0, 1200).trim()}`);
    }
  } catch (err) {
    process.stderr.write(`[stop-hook] validate:pricing error: ${err.message}\n`);
  }

  // A2: Wrong-pattern scan across changed page files
  const patternErrors = [];
  for (const relPath of pages) {
    const absPath = relPath.startsWith("/") ? relPath : join(cwd, relPath);
    let content;
    try { content = readFileSync(absPath, "utf8"); } catch { continue; }

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
    blockers.push(`[PRICING PATTERN ERRORS]\n${patternErrors.join("\n")}`);
  }

  // A3: Reminder
  reminders.push(
    `PAGE CHANGES detected (${pages.length} file${pages.length > 1 ? "s" : ""}).`,
    `  Mandatory gates before deploy: /web-design-ux + /e2e-test`,
  );
}

// ========== CATEGORY B: CSV changes ==========
if (csvs.length > 0) {
  // B1: Run validate:pricing — BLOCK on fail
  if (pages.length === 0) {
    // Only run if not already run by Category A
    try {
      const vp = spawnSync("npm", ["run", "validate:pricing"], {
        cwd, encoding: "utf8", shell: true, timeout: 30_000,
      });
      if (vp.status !== 0) {
        const out = `${vp.stdout ?? ""}${vp.stderr ?? ""}`;
        const relevant = out.split("\n")
          .filter((l) => /FAIL|ERROR|✗|×|check \d+|Warning|failed/i.test(l) && !/^npm (warn|notice|info)/i.test(l))
          .join("\n").trim();
        blockers.push(`[VALIDATE:PRICING FAILED — CSV CHANGE]\n${relevant || out.slice(0, 1200).trim()}`);
      }
    } catch (err) {
      process.stderr.write(`[stop-hook] validate:pricing error: ${err.message}\n`);
    }
  }

  // B2: Reminder
  reminders.push(
    `CSV CHANGES detected: ${csvs.join(", ")}`,
    `  Mandatory: update PRICING_QUICK_REFERENCE.md if prices changed.`,
    `  Run /audit-prices to check for page drift.`,
  );
}

// ========== CATEGORY C: Engine / Configurator changes ==========
if (engine.length > 0) {
  // C1: Run npm test — BLOCK on fail
  try {
    const t = spawnSync("npm", ["test"], {
      cwd, encoding: "utf8", shell: true, timeout: 60_000,
    });
    if (t.status !== 0) {
      const out = `${t.stdout ?? ""}${t.stderr ?? ""}`;
      const relevant = out.split("\n")
        .filter((l) => /FAIL|fail|Error|✗|×|expected|received/i.test(l) && !/^npm (warn|notice|info)/i.test(l))
        .slice(0, 30)
        .join("\n").trim();
      blockers.push(`[NPM TEST FAILED — ENGINE CHANGE]\n${relevant || out.slice(0, 1500).trim()}`);
    }
  } catch (err) {
    process.stderr.write(`[stop-hook] npm test error: ${err.message}\n`);
  }

  // C2: Reminder
  reminders.push(
    `ENGINE/CONFIGURATOR CHANGES detected: ${engine.join(", ")}`,
    `  Mandatory gate: /e2e-test before Railway push.`,
  );
}

// ========== CATEGORY D: Email changes ==========
if (emails.length > 0) {
  // D1: Check for vercel.app URLs — BLOCK if found
  const vercelHits = [];
  for (const relPath of emails) {
    const absPath = relPath.startsWith("/") ? relPath : join(cwd, relPath);
    let content;
    try { content = readFileSync(absPath, "utf8"); } catch { continue; }

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (/vercel\.app/i.test(lines[i])) {
        vercelHits.push(`  ${relPath}:${i + 1} — contains vercel.app URL`);
      }
    }
  }
  if (vercelHits.length > 0) {
    blockers.push(`[VERCEL.APP URL IN EMAIL CODE]\n${vercelHits.join("\n")}\n  Must use truecolorprinting.ca`);
  }

  // D2: Reminder
  reminders.push(
    `EMAIL CHANGES detected: ${emails.join(", ")}`,
    `  Verify /ecommerce-ux email sequence (7 types).`,
  );
}

// ========== CATEGORY E: UI component changes ==========
if (ui.length > 0) {
  reminders.push(
    `UI COMPONENT CHANGES detected (${ui.length} file${ui.length > 1 ? "s" : ""}).`,
    `  Mandatory gate: /web-design-ux before shipping.`,
  );
}

// --- Output ---
if (blockers.length > 0) {
  const output = {
    decision: {
      block: true,
      reason: blockers.join("\n\n") + (reminders.length > 0 ? `\n\n--- Skill Gate Reminders ---\n${reminders.join("\n")}` : ""),
    },
  };
  process.stdout.write(JSON.stringify(output));
} else if (reminders.length > 0) {
  const output = {
    hookSpecificOutput: {
      additionalContext: `--- Skill Gate Reminders ---\n${reminders.join("\n")}`,
    },
  };
  process.stdout.write(JSON.stringify(output));
}

process.exit(0);
