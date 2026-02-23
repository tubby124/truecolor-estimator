/**
 * Clover Hosted Checkout — diagnostic test script
 *
 * Usage:
 *   node scripts/test-clover.mjs
 *
 * Reads CLOVER_* env vars from .env.local and makes a real $1.00 test checkout
 * call to the Clover API. Prints the full raw response so you can see exactly
 * what Clover returns — useful for diagnosing 401/403/422 errors without
 * going through the full Next.js stack.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { createHmac } from "crypto";

// ── 1. Load .env.local ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");
let envVars = {};
try {
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    envVars[key] = val;
  }
  console.log("✅  Loaded .env.local");
} catch {
  console.log("⚠️  Could not read .env.local — falling back to process.env");
  envVars = process.env;
}

// Merge into process.env so the helpers below can use it
for (const [k, v] of Object.entries(envVars)) {
  process.env[k] = v;
}

// ── 2. Print the keys being used ─────────────────────────────────────────────
const merchantId   = process.env.CLOVER_MERCHANT_ID;
const privateKey   = process.env.CLOVER_ECOMM_PRIVATE_KEY;
const environment  = process.env.CLOVER_ENVIRONMENT ?? "production";
const tokenSecret  = process.env.PAYMENT_TOKEN_SECRET;

console.log("\n── Clover config ────────────────────────────────────────────");
console.log("  CLOVER_ENVIRONMENT      :", environment);
console.log("  CLOVER_MERCHANT_ID      :", merchantId ?? "(MISSING)");
console.log("  CLOVER_ECOMM_PRIVATE_KEY:", privateKey
  ? `${privateKey.slice(0, 8)}…${privateKey.slice(-4)}  (${privateKey.length} chars)`
  : "(MISSING)");
console.log("  PAYMENT_TOKEN_SECRET    :", tokenSecret
  ? `${tokenSecret.slice(0, 8)}…  (${tokenSecret.length} chars)`
  : "(MISSING)");
console.log("────────────────────────────────────────────────────────────\n");

if (!merchantId || !privateKey) {
  console.error("❌  Missing required env vars — cannot continue.");
  process.exit(1);
}

// ── 3. Build a test token ────────────────────────────────────────────────────
if (tokenSecret) {
  const payload = {
    v: 1,
    a: 100,           // $1.00 in cents
    d: "Diagnostic test — 1 x Coroplast Sign",
    e: Date.now() + 30 * 24 * 60 * 60 * 1000,
    em: "test@true-color.ca",
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", tokenSecret).update(encoded).digest("base64url");
  const token = `${encoded}.${sig}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log("🔗  Test Pay URL:");
  console.log(`    ${siteUrl}/pay/${token}\n`);
}

// ── 4. Call Clover Hosted Checkout API ───────────────────────────────────────
const BASE_URL = environment === "sandbox"
  ? "https://apisandbox.dev.clover.com/invoicingcheckoutservice"
  : "https://www.clover.com/invoicingcheckoutservice";

const endpoint = `${BASE_URL}/v1/checkouts`;
const reqBody = {
  shoppingCart: {
    lineItems: [
      {
        name: "Diagnostic test — 1 x Coroplast Sign",
        unitQty: 1,
        price: 100, // $1.00 — Clover requires > 0
      },
    ],
  },
  customer: { email: "test@true-color.ca" },
};

console.log(`── POST ${endpoint}`);
console.log("   Request body:", JSON.stringify(reqBody, null, 2));
console.log("   Headers: Authorization Bearer ***,", `X-Clover-Merchant-Id: ${merchantId}\n`);

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${privateKey}`,
    "X-Clover-Merchant-Id": merchantId,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify(reqBody),
});

const responseText = await res.text();
let responseJson = null;
try { responseJson = JSON.parse(responseText); } catch { /* not JSON */ }

console.log("── Response ─────────────────────────────────────────────────");
console.log("  HTTP status:", res.status, res.statusText);
console.log("  Content-Type:", res.headers.get("content-type"));
console.log("  Body:", responseJson
  ? JSON.stringify(responseJson, null, 2)
  : responseText.slice(0, 800));
console.log("─────────────────────────────────────────────────────────────\n");

if (res.ok && responseJson?.href) {
  console.log("✅  SUCCESS — checkout URL:");
  console.log("   ", responseJson.href);
  console.log("\n   ▶ Open this URL in a browser to confirm Clover checkout loads.");
} else if (res.status === 401) {
  console.error("❌  401 Unauthorized — the CLOVER_ECOMM_PRIVATE_KEY is wrong or revoked.");
  console.error("    → Go to Clover dashboard → Developers → API Access → copy the eCommerce private key.");
} else if (res.status === 403) {
  console.error("❌  403 Forbidden — the key may be correct but the merchant may not have eCommerce enabled.");
  console.error("    → Check Clover dashboard → Account & Setup → Online Ordering / eCommerce.");
} else if (res.status === 422) {
  console.error("❌  422 Unprocessable — the request body is malformed.");
  console.error("    See body above for Clover's validation error details.");
} else {
  console.error("❌  Unexpected error — see body above.");
}
