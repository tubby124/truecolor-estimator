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

import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { homedir } from "os";

// --- Wrong-pattern definitions (mirrors post-edit-price-check.mjs) ---
const WRONG_PATTERNS = [
  [/from \$45.{0,25}banner|banner.{0,25}from \$45/i, "Banner 'from' should be $66, not $45"],
  [/from \$60.{0,25}acp|acp.{0,25}from \$60|from \$60.{0,25}aluminum/i, "ACP no longer has a $60 per-product minimum; use $39 or $13/sqft"],
  [/from \$30.{0,25}coroplast|coroplast.{0,25}from \$30|yard signs? from \$30/i, "Coroplast no longer has a $30 per-product minimum; use $25 or $8/sqft"],
  [/from \$45.{0,25}magnet|magnet.{0,25}from \$45/i, "Magnets no longer have a $45 per-product minimum; use $25 or $24/sqft"],
  [/from \$40.{0,25}lettering|lettering.{0,25}from \$40/i, "Vinyl lettering no longer has a $40 per-product minimum; use $25 or $8.50/sqft"],
  [/minimum\s+\$(30|40|45|60|75)|\$(30|40|45|60|75)\s+minimum/i, "Do not publish old per-product minimums; use the $25 order-total minimum where relevant"],
  [/from \$8\/sqft.*decal|decal.*from \$8\/sqft/i, "Window Decals are $11/sqft, not $8/sqft"],
  [/(\d+)\+\s*sqft.*(discount|off|save)/i, "Volume discounts must be QTY-based (5+ signs), not sqft-based"],
  [/\$2\.00.*grommet|grommet.*\$2\.00|\$3\.00.*grommet/i, "Grommets are $2.50/each"],
  [/\$30.*rush|\$50.*rush|rush.*\$30|rush.*\$50/i, "Rush is +$40 flat"],
  [/PST\s*6%/i, "Saskatchewan has no PST on printing — GST 5% only"],
  [/vercel\.app/i, "Use truecolorprinting.ca, not vercel.app"],
];

const EXCEPTION_PATTERNS = [
  /fromPrice\s*[=:]/i,
  /\$25\s+order-total\s+minimum/i,
  /\$25\s+cart\s+floor/i,
  /for\s+orders\s+above/i,
  /\/sqft\s+for\s+orders/i,
  /minimum\s+quantity|minimum\s+qty/i,
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

// ========== CATEGORY F: Protected SEO page sprint-log gate ==========
// If any staged page.tsx change targets a slug listed in seo-protected-pages.md,
// require memory/seo-sprints.md to have been modified TODAY before allowing
// session end. Forces the mandatory sprint log update from AGENTS.md.
function getProtectedSlugs() {
  const p = join(cwd, ".claude/rules/seo-protected-pages.md");
  if (!existsSync(p)) return new Set();
  const content = readFileSync(p, "utf8");
  const lines = content.split("\n");
  let inSection = false;
  let dataStarted = false;
  const slugs = new Set();
  for (const line of lines) {
    if (/^##\s+Protected pages/i.test(line)) {
      inSection = true;
      dataStarted = false;
      continue;
    }
    if (inSection && /^##\s+/.test(line)) break;
    if (!inSection) continue;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) {
      dataStarted = true;
      continue;
    }
    if (!dataStarted) continue;
    const cells = line.split("|").map((s) => s.trim());
    const slug = cells[1];
    if (slug && /^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(slug)) slugs.add(slug);
  }
  return slugs;
}

const protectedSlugs = getProtectedSlugs();
const protectedPagesTouched = pages.filter((f) => {
  const m = f.match(/src\/app\/([a-z0-9-]+)\/page\.tsx$/);
  return m && protectedSlugs.has(m[1]);
});

if (protectedPagesTouched.length > 0) {
  const sprintLogPath = join(
    homedir(),
    ".claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md",
  );
  let touchedToday = false;
  if (existsSync(sprintLogPath)) {
    const mtime = statSync(sprintLogPath).mtime;
    const now = new Date();
    touchedToday =
      mtime.getUTCFullYear() === now.getUTCFullYear() &&
      mtime.getUTCMonth() === now.getUTCMonth() &&
      mtime.getUTCDate() === now.getUTCDate();
  }
  if (!touchedToday) {
    // Distinguish auto-comment touches from real phase entries by reading the file
    let hasRealEntryToday = false;
    if (existsSync(sprintLogPath)) {
      try {
        const content = readFileSync(sprintLogPath, "utf8");
        const todayISO = new Date().toISOString().slice(0, 10);
        const phaseRegex = new RegExp(
          `^##\\s+SEO Phase[^\\n]*${todayISO}\\)`,
          "m",
        );
        hasRealEntryToday = phaseRegex.test(content);
      } catch {}
    }
    if (!hasRealEntryToday) {
      blockers.push(
        `[PROTECTED SEO PAGE TOUCHED BUT SPRINT LOG NOT UPDATED]\n` +
          `Staged changes to protected page(s): ${protectedPagesTouched.join(", ")}\n` +
          `\n` +
          `memory/seo-sprints.md has no "## SEO Phase ... (${new Date()
            .toISOString()
            .slice(0, 10)})" entry today.\n` +
          `Per AGENTS.md "SEO Sprint Log — NON-NEGOTIABLE RULE": append a phase entry\n` +
          `before ending the session.\n` +
          `\n` +
          `Path: ${sprintLogPath}\n` +
          `Format:\n` +
          `  ## SEO Phase [N] — [Short Title] (${new Date()
            .toISOString()
            .slice(0, 10)})\n` +
          `  - Files changed: ...\n` +
          `  - What shipped: ...\n` +
          `  - What was deferred/flagged: ...\n` +
          `  - Next steps / trigger date: ...`,
      );
    }
  }
}

// --- Category G: aggregateRating presence in layout.tsx ---
//
// Born from 2026-05-29 audit: commit 7ab5e48 silently removed aggregateRating
// from layout.tsx on May 25 along with crashing 5 ranking pages. Nobody noticed
// for 4 days because schema is invisible. This check fails session end if the
// aggregateRating block is missing from layout.tsx so a future commit cannot
// silently strip it again.
try {
  const layoutPath = "src/app/layout.tsx";
  if (existsSync(layoutPath)) {
    const layoutContent = readFileSync(layoutPath, "utf8");
    const hasAggregateRating = /aggregateRating\s*:\s*{/.test(layoutContent);
    const hasReviewCountImport = /REVIEW_COUNT/.test(layoutContent);
    if (!hasAggregateRating) {
      blockers.push(
        `[REQUIRED SCHEMA MISSING — aggregateRating block stripped from src/app/layout.tsx]\n` +
          `The aggregateRating schema must exist in localBusinessSchema. Commit 7ab5e48 silently\n` +
          `removed it on 2026-05-25 (the same disaster commit that crashed 5 ranking pages).\n` +
          `Restoration shipped 2026-05-29. This hook now blocks session end if it disappears again.\n` +
          `\n` +
          `Restore by adding to localBusinessSchema (between currenciesAccepted and knowsAbout):\n` +
          `  aggregateRating: {\n` +
          `    "@type": "AggregateRating",\n` +
          `    ratingValue: RATING_VALUE,\n` +
          `    reviewCount: REVIEW_COUNT,\n` +
          `    bestRating: "5",\n` +
          `    worstRating: "1",\n` +
          `  },\n` +
          `\n` +
          `Also confirm: import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";`,
      );
    } else if (!hasReviewCountImport) {
      blockers.push(
        `[REQUIRED IMPORT MISSING — REVIEW_COUNT not imported in src/app/layout.tsx]\n` +
          `aggregateRating block uses REVIEW_COUNT but the import is missing. Add:\n` +
          `  import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";`,
      );
    }
  }
} catch {
  // Don't break the hook itself on filesystem errors.
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
