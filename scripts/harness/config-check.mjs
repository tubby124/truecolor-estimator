#!/usr/bin/env node
/**
 * scripts/harness/config-check.mjs
 *
 * Validates Railway prod env var shapes by calling /api/health on the live site.
 * No secrets are returned — just presence + format validation.
 *
 * Usage:
 *   node scripts/harness/config-check.mjs                    # prod (truecolorprinting.ca)
 *   node scripts/harness/config-check.mjs --base http://localhost:3000  # local dev
 *
 * Exit 0 = config clean. Exit 1 = issues found.
 */

const BASE = (() => {
  const idx = process.argv.indexOf("--base");
  return idx !== -1 ? process.argv[idx + 1] : "https://truecolorprinting.ca";
})();

const url = `${BASE}/api/health`;
console.log(`\n🔧 Config check → ${url}\n`);

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    console.error(`❌ /api/health returned HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const checks = data.checks ?? [];
  const issues = data.issues ?? [];

  if (checks.length === 0) {
    console.log("⚠️  /api/health returned no checks — endpoint may be the old minimal version.");
    console.log("   Push the updated health route first, then re-run.\n");
    process.exit(1);
  }

  for (const c of checks) {
    const icon = c.ok ? "✅" : "❌";
    const note = c.note ? `  ← ${c.note}` : "";
    console.log(`  ${icon}  ${c.name}${note}`);
  }

  console.log("");
  if (issues.length === 0) {
    console.log("✅  All config checks passed — Railway prod env is clean.\n");
    process.exit(0);
  } else {
    console.log(`❌  ${issues.length} config issue${issues.length > 1 ? "s" : ""}. Fix in Railway dashboard → Variables.\n`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ Config check failed: ${err.message}`);
  process.exit(1);
}
