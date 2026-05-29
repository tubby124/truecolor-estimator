#!/usr/bin/env node
/**
 * Historical SEO Wave-Rule Violation Audit (Phase 9c)
 *
 * Reads the last 90 days of git commits and flags any commit that touched
 * >= 2 page.tsx files in src/app/<slug>/page.tsx. Cross-references against
 * the current protected-pages list and surfaces the worst offenders.
 *
 * Why this matters: the recovery plan caught the 2026-05-25 commit 7ab5e48
 * because we already knew about 5 decayed pages from the May 5 protected-pages
 * snapshot. But silent decay could have happened on OTHER batched commits we
 * never investigated. This script gives us "did we break anything else"?
 *
 * Usage:
 *   node scripts/seo-wave-audit.mjs                # default: last 90 days
 *   node scripts/seo-wave-audit.mjs --since 180    # last 180 days
 *   node scripts/seo-wave-audit.mjs --json         # machine-readable
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
function parseSince(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--since" && args[i + 1]) return Number(args[i + 1]);
    if (args[i].startsWith("--since=")) return Number(args[i].split("=")[1]);
  }
  return 90;
}
const days = parseSince(args);
const jsonOutput = args.includes("--json");

const cwd = process.cwd();

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

const logResult = spawnSync(
  "git",
  [
    "log",
    `--since=${days} days ago`,
    "--name-only",
    "--pretty=format:COMMIT %H %ad %s",
    "--date=short",
  ],
  { cwd, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
);

if (logResult.status !== 0) {
  console.error("git log failed:", logResult.stderr);
  process.exit(1);
}

const commits = [];
let current = null;
for (const rawLine of logResult.stdout.split("\n")) {
  const line = rawLine.trimEnd();
  if (line.startsWith("COMMIT ")) {
    if (current) commits.push(current);
    const m = line.match(/^COMMIT (\S+) (\S+) (.*)$/);
    if (m) current = { hash: m[1], date: m[2], subject: m[3], files: [] };
    continue;
  }
  if (!line) continue;
  if (current) current.files.push(line);
}
if (current) commits.push(current);

const violations = [];
const allOffenders = [];
for (const c of commits) {
  const pageFiles = c.files.filter((f) =>
    /^src\/app\/[a-z0-9-]+\/page\.tsx$/.test(f),
  );
  if (pageFiles.length === 0) continue;
  const slugs = pageFiles.map(
    (f) => f.match(/^src\/app\/([a-z0-9-]+)\/page\.tsx$/)[1],
  );
  const protectedHit = slugs.filter((s) => protectedSlugs.has(s));
  const record = {
    hash: c.hash,
    date: c.date,
    subject: c.subject,
    pageCount: pageFiles.length,
    slugs,
    protectedHit,
    severity:
      protectedHit.length >= 2
        ? "CRITICAL"
        : pageFiles.length >= 3
          ? "HIGH"
          : pageFiles.length >= 2
            ? "MEDIUM"
            : "LOW",
  };
  allOffenders.push(record);
  if (pageFiles.length >= 2 || protectedHit.length >= 1) {
    violations.push(record);
  }
}

violations.sort((a, b) => {
  const sevRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return (
    sevRank[a.severity] - sevRank[b.severity] ||
    b.pageCount - a.pageCount ||
    b.date.localeCompare(a.date)
  );
});

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        windowDays: days,
        commitsScanned: commits.length,
        protectedSlugsCount: protectedSlugs.size,
        protectedSlugs: [...protectedSlugs],
        offendingCommits: violations.length,
        violations,
      },
      null,
      2,
    ),
  );
} else {
  console.log(`\n=== SEO Wave-Rule Audit — last ${days} days ===\n`);
  console.log(`Commits scanned: ${commits.length}`);
  console.log(`Protected slugs (current): ${protectedSlugs.size}`);
  console.log(`Commits touching >= 1 page.tsx: ${allOffenders.length}`);
  console.log(`Commits flagged (>=2 pages OR >=1 protected): ${violations.length}`);
  console.log("");

  const critical = violations.filter((v) => v.severity === "CRITICAL");
  const high = violations.filter((v) => v.severity === "HIGH");
  const medium = violations.filter((v) => v.severity === "MEDIUM");
  console.log(
    `Breakdown: ${critical.length} CRITICAL · ${high.length} HIGH · ${medium.length} MEDIUM`,
  );
  console.log("");

  for (const v of violations) {
    console.log(
      `[${v.severity}] ${v.date}  ${v.hash.slice(0, 8)}  pages=${v.pageCount}  protected=${v.protectedHit.length}`,
    );
    console.log(`   ${v.subject}`);
    if (v.protectedHit.length > 0) {
      console.log(`   PROTECTED hit: ${v.protectedHit.join(", ")}`);
    }
    if (v.pageCount <= 10) {
      console.log(`   All slugs: ${v.slugs.join(", ")}`);
    } else {
      console.log(
        `   First 8 slugs: ${v.slugs.slice(0, 8).join(", ")} … (+${v.slugs.length - 8} more)`,
      );
    }
    console.log("");
  }

  if (critical.length > 0) {
    console.log(
      `\n*** ${critical.length} CRITICAL commit(s) touched >=2 currently-protected pages.\n` +
        `*** These are the wave-rule violations that the recovery plan was built to prevent.\n` +
        `*** Cross-reference each protected slug against seo_gsc_snapshots for hidden decay.\n`,
    );
  }
}
