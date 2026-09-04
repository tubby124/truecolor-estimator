#!/usr/bin/env node
/**
 * scripts/harness/config-check.mjs
 *
 * Checks public readiness only. Detailed production configuration is deliberately
 * not exposed by /api/health; validate key shapes from local/operator env instead.
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
  if (data?.ok !== true) {
    console.error("❌ /api/health returned an invalid readiness response");
    process.exit(1);
  }
  console.log("✅  Public readiness passed. Detailed production configuration is intentionally not exposed.\n");
  process.exit(0);
} catch (err) {
  console.error(`❌ Config check failed: ${err.message}`);
  process.exit(1);
}
