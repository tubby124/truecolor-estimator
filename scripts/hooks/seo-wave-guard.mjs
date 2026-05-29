#!/usr/bin/env node
/**
 * PreToolUse SEO Wave Guard
 *
 * Enforces three rules from .claude/rules/truecolor-seo-safety.md + the
 * 2026-05-29 recovery plan that the wave-rule violation in 7ab5e48 inspired:
 *
 *   1. ONE-PAGE-PER-COMMIT for protected pages
 *      Editing a protected page is BLOCKED if any other protected page has
 *      uncommitted (staged or unstaged) changes. The wave rule says one
 *      protected page per commit with 5–7 day GSC observation between.
 *
 *   2. HARD CAP of 2 page.tsx files per commit (Phase 9e)
 *      Regardless of protected status, a third page.tsx edit per commit is
 *      blocked. Commit 7ab5e48 touched 80+ pages — this would have caught it.
 *
 *   3. NO TITLE-META-SCHEMA MIX in the same staged commit on a protected page
 *      Title/description/H1 + Service/FAQPage/BreadcrumbList/jsonLd changes
 *      must split into separate commits 7 days apart.
 *
 * Triggers on Edit/Write/MultiEdit to:
 *   - src/app/<slug>/page.tsx       (slug-scoped check)
 *   - src/app/sitemap.ts            (page-wide impact)
 *   - src/components/site/IndustryPage.tsx (renders all SEO pages)
 *
 * Exits:
 *   0 — pass
 *   2 — block (Claude Code reads stderr as the block reason)
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

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

if (!slugMatch && !isSitemap && !isIndustryPage) {
  process.exit(0);
}

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

function getStagedAndModifiedPages() {
  const r = spawnSync("git", ["status", "--porcelain"], {
    cwd,
    encoding: "utf8",
    timeout: 10_000,
  });
  if (r.status !== 0) return [];
  const lines = (r.stdout || "").split("\n");
  const hits = new Set();
  for (const line of lines) {
    const m = line.match(/^.{2}\s+(?:".*"\s+->\s+)?(src\/app\/([a-z0-9-]+)\/page\.tsx)"?$/);
    if (m) hits.add(m[2]);
  }
  return [...hits];
}

const protectedSlugs = getProtectedSlugs();
const dirtyPageSlugs = getStagedAndModifiedPages();

if (editingSlug && protectedSlugs.has(editingSlug)) {
  const otherProtectedDirty = dirtyPageSlugs.filter(
    (s) => s !== editingSlug && protectedSlugs.has(s),
  );
  if (otherProtectedDirty.length > 0) {
    const msg = `SEO WAVE RULE VIOLATION — one protected page per commit

Attempting to edit:  src/app/${editingSlug}/page.tsx (protected)
Already uncommitted: ${otherProtectedDirty.map((s) => `src/app/${s}/page.tsx`).join(", ")}

Per .claude/rules/truecolor-seo-safety.md Wave System: only ONE protected ranking page
may be modified per commit, with 5–7 day GSC observation between waves.

This rule existed before commit 7ab5e48 (2026-05-25) which touched 5 protected pages
in a single shot and crashed business-cards, banner, flyer, sign-company, and
coroplast from positions #1–#5 to #11–#33 within 3 weeks.

Action:
  1. git stash or git commit the change to the other protected page first
  2. Wait 5–7 days for GSC observation
  3. Then edit ${editingSlug}`;
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
}

if (editingSlug) {
  const projected = new Set([...dirtyPageSlugs, editingSlug]);
  if (projected.size > 2) {
    const msg = `SEO WAVE HARD CAP — 2 page.tsx files per commit

This edit would bring the total page.tsx files in the working tree to ${projected.size}.
Hard cap: 2 per commit, regardless of protected status.

Currently dirty (staged or modified):
${dirtyPageSlugs.map((s) => `  - src/app/${s}/page.tsx`).join("\n") || "  (none)"}

Adding now: src/app/${editingSlug}/page.tsx

Per recovery-plan Phase 9e: commit 7ab5e48 (80+ page.tsx files in one shot) would
have been blocked by this cap. Commit the current batch, then continue.`;
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
}

if (editingSlug && protectedSlugs.has(editingSlug)) {
  const r = spawnSync(
    "git",
    ["diff", "--cached", "--", `src/app/${editingSlug}/page.tsx`],
    { cwd, encoding: "utf8", timeout: 10_000 },
  );
  const stagedDiff = r.stdout || "";
  const addedLines = stagedDiff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  const addedJoined = addedLines.join("\n");

  const hasMeta = /(?:^|\s)(title:|description:|<h1\b)/m.test(addedJoined);
  const hasSchema = /(?:@type|FAQPage|BreadcrumbList|"jsonLd"|application\/ld\+json|"@context")/m.test(
    addedJoined,
  );

  if (hasMeta && hasSchema) {
    const msg = `SEO COMMIT-CONTENT MIX RULE VIOLATION on protected page

src/app/${editingSlug}/page.tsx has STAGED additions touching BOTH:
  - title / description / H1
  - schema (Service, FAQPage, BreadcrumbList, or inline jsonLd)

Per truecolor-seo-safety.md: "Never add schema + change content + change title in
the same deploy" on a ranking page.

Action:
  1. git restore --staged <metadata-or-schema-portion>
  2. Commit one set
  3. Wait 7 days for GSC to settle
  4. Then commit the other`;
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
}

process.exit(0);
