#!/usr/bin/env node
/**
 * PostToolUse SEO Cooldown + Staleness Check
 *
 *   1. STALENESS GUARD (Phase 9b)
 *      Parses "Last refreshed: YYYY-MM-DD" from .claude/rules/seo-protected-pages.md
 *      If >35 days old → BLOCK the edit. Stale doc → invalid wave decisions.
 *      35 days = one cycle past the 28-day refresh cadence.
 *
 *   2. COOLDOWN WARNING (non-blocking)
 *      If the slug being edited is in the protected list and the last commit on
 *      it was <5 days ago, emit a warning surface to Claude so it can decide if
 *      the hotfix is intentional.
 *
 *   3. AUTO-LOG
 *      Append a single-line HTML comment to memory/seo-sprints.md tracking the
 *      edit. Deduped: skip if the same slug was already logged in the last 5
 *      tail lines (typical session tightness).
 *
 * Triggers on Edit/Write/MultiEdit to the same paths as seo-wave-guard.mjs.
 *
 * Output:
 *   - JSON decision block with { decision: { block: true, reason } } when stale
 *   - JSON hookSpecificOutput { additionalContext } for cooldown warning
 *   - Empty (no JSON) when nothing to surface
 */

import { readFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { homedir } from "os";

let input;
try {
  input = JSON.parse(readFileSync("/dev/stdin", "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path ?? input?.tool_input?.path ?? "";
const cwd = input?.cwd ?? process.cwd();

const slugMatch = filePath.match(/src\/app\/([a-z0-9-]+)\/page\.tsx$/);
const isSitemap = /src\/app\/sitemap\.ts$/.test(filePath);
const isIndustryPage = /src\/components\/site\/IndustryPage\.tsx$/.test(filePath);
if (!slugMatch && !isSitemap && !isIndustryPage) process.exit(0);

const editingSlug = slugMatch ? slugMatch[1] : null;

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

function getStalenessDays() {
  const p = join(cwd, ".claude/rules/seo-protected-pages.md");
  if (!existsSync(p)) return null;
  const content = readFileSync(p, "utf8");
  const m = content.match(/Last refreshed:\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  const refDate = new Date(`${m[1]}T00:00:00Z`);
  return Math.floor((Date.now() - refDate.getTime()) / 86_400_000);
}

const stale = getStalenessDays();
if (stale !== null && stale > 35) {
  const reason = `SEO PROTECTED-PAGES DOC IS STALE

.claude/rules/seo-protected-pages.md was last refreshed ${stale} days ago.
Threshold: 35 days. Edits to SEO-affecting files are blocked when the doc is
older than this, because wave decisions made on stale rankings are unreliable.

Why this rule exists: the March → May 2026 ranking decay went unnoticed for
60+ days while the protected-pages doc said positions that no longer existed.

Action:
  1. Run /tc-seo-opportunities (or query seo_gsc_snapshots directly)
  2. Update the doc's "Last refreshed: ${new Date().toISOString().slice(0, 10)}" header
  3. Update the protected-pages table positions
  4. Re-run this edit`;
  const output = { decision: { block: true, reason } };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

const warnings = [];

if (editingSlug) {
  const protectedSlugs = getProtectedSlugs();
  if (protectedSlugs.has(editingSlug)) {
    const r = spawnSync(
      "git",
      ["log", "-1", "--format=%cI", "--", `src/app/${editingSlug}/page.tsx`],
      { cwd, encoding: "utf8", timeout: 10_000 },
    );
    const lastCommitISO = (r.stdout || "").trim();
    if (lastCommitISO) {
      const lastTs = new Date(lastCommitISO).getTime();
      const days = Math.floor((Date.now() - lastTs) / 86_400_000);
      if (days < 5) {
        const until = new Date(lastTs + 5 * 86_400_000)
          .toISOString()
          .slice(0, 10);
        warnings.push(
          `SEO COOLDOWN WARNING: src/app/${editingSlug}/page.tsx was last committed ${days} day(s) ago.\n` +
            `Wave rule suggests 5–7 day GSC observation between edits on a protected page.\n` +
            `Cooldown suggestion until ${until}. If this is an intentional hotfix, proceed and\n` +
            `note the reason in the commit message preamble.`,
        );
      }
    }
  }
}

if (editingSlug) {
  const logPath = join(
    homedir(),
    ".claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md",
  );
  if (existsSync(logPath)) {
    try {
      const existing = readFileSync(logPath, "utf8");
      const tail = existing.split("\n").slice(-5).join("\n");
      const dupRegex = new RegExp(
        `auto: Edited src/app/${editingSlug}/page\\.tsx`,
      );
      if (!dupRegex.test(tail)) {
        const ts = new Date().toISOString();
        const cooldownUntil = new Date(Date.now() + 5 * 86_400_000)
          .toISOString()
          .slice(0, 10);
        appendFileSync(
          logPath,
          `\n<!-- auto: Edited src/app/${editingSlug}/page.tsx at ${ts}; cooldown suggestion ${cooldownUntil} -->\n`,
        );
      }
    } catch (err) {
      process.stderr.write(
        `[seo-cooldown-check] log append failed: ${err.message}\n`,
      );
    }
  }
}

if (warnings.length > 0) {
  const output = {
    hookSpecificOutput: { additionalContext: warnings.join("\n") },
  };
  process.stdout.write(JSON.stringify(output));
}

process.exit(0);
