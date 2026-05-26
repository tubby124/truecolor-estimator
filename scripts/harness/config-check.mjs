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

  if (checks.length === 0) {
    console.log("⚠️  /api/health returned no checks — endpoint may be the old minimal version.");
    console.log("   Push the updated health route first, then re-run.\n");
    process.exit(1);
  }

  for (const c of checks) {
    const icon = c.ok ? "✅" : c.severity === "warn" ? "⚠️ " : "❌";
    const note = c.note ? `  ← ${c.note}` : "";
    console.log(`  ${icon}  ${c.name}${note}`);
  }

  const fails = checks.filter((c) => !c.ok && c.severity === "fail");
  const warns = checks.filter((c) => !c.ok && c.severity === "warn");

  console.log("");
  if (fails.length === 0 && warns.length === 0) {
    console.log("✅  All config checks passed — Railway prod env is clean.\n");
    process.exit(0);
  }
  if (warns.length > 0) {
    console.log(`⚠️  ${warns.length} warning${warns.length > 1 ? "s" : ""} (works, but worth addressing when safe).`);
  }
  if (fails.length > 0) {
    console.log(`❌  ${fails.length} FAILURE${fails.length > 1 ? "S" : ""} — fix in Railway dashboard → Variables. These break flows.\n`);
    process.exit(1);
  }
  // warnings only → exit 0 (don't fail CI on hygiene items)
  console.log("");
  process.exit(0);
} catch (err) {
  console.error(`❌ Config check failed: ${err.message}`);
  process.exit(1);
}
