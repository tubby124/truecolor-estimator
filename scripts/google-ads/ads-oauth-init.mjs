#!/usr/bin/env node
/**
 * Rotate the Google Ads OAuth refresh token. Built 2026-08-14 after the ZaraBot incident:
 * the live refresh token had copies outside Railway (VPS /root/.tc-ads-env.json + Hermes
 * state.db backups), and Google Ads has no read-only token — any holder can mutate.
 * Rotation = mint a NEW refresh token here, move Railway onto it, then revoke the OLD one
 * so every stray copy dies. Minting alone revokes nothing; the revoke step is the point.
 *
 * Modeled on scripts/gsc-oauth-init.mjs (same localhost callback pattern).
 *
 * Usage (from truecolor-estimator/):
 *   railway run node scripts/google-ads/ads-oauth-init.mjs
 *
 * Sign in as hasansharifestates@gmail.com — the account that owns Ads customer 1072816342.
 * The script walks all three steps in order and will not revoke until you confirm Railway
 * carries the new token (revoking first would break the 15-minute hard-stop monitor's auth).
 */

import { google } from "googleapis";
import http from "node:http";
import readline from "node:readline";
import { URL } from "node:url";

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const OLD_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const REDIRECT_URI = "http://localhost:9876/oauth/callback";
const SCOPES = ["https://www.googleapis.com/auth/adwords"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET — run through `railway run`.");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = oauth2.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });

console.log("\nSTEP 1 — open this URL, signed in as hasansharifestates@gmail.com:\n");
console.log(authUrl);
console.log("\nWaiting for the callback on http://localhost:9876 ...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  const u = new URL(req.url, "http://localhost:9876");
  if (u.pathname !== "/oauth/callback") { res.writeHead(404).end("not found"); return; }
  const code = u.searchParams.get("code");
  const error = u.searchParams.get("error");
  if (error) { res.writeHead(400).end(`OAuth error: ${error}`); console.error(`OAuth error: ${error}`); process.exit(1); }
  if (!code) { res.writeHead(400).end("no code in callback"); return; }
  try {
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/plain" }).end("Authorized. Back to the terminal.");
    server.close();
    if (!tokens.refresh_token) {
      console.error("No refresh_token returned — unexpected with prompt=consent. Re-run.");
      process.exit(1);
    }
    console.log("\nSTEP 2 — put the NEW token into Railway (run in another terminal):\n");
    console.log(`  railway variables --set "GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}"\n`);
    if (!OLD_REFRESH_TOKEN) {
      console.log("No OLD token in env — nothing to revoke. Done.");
      process.exit(0);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("STEP 3 — press Enter ONLY AFTER Railway is updated, to revoke the old token (Ctrl+C to skip): ", async () => {
      rl.close();
      const rev = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: OLD_REFRESH_TOKEN }),
      });
      if (rev.ok) {
        console.log("\n✓ OLD token revoked. Every copy of it (VPS env file, Hermes state.db backups) is now dead.");
        console.log("Verify: railway run node scripts/google-ads/sync-plan.mjs should still work on the new token.");
      } else {
        console.error(`Revoke failed: HTTP ${rev.status} ${(await rev.text()).slice(0, 200)} — old token may already be invalid.`);
      }
      process.exit(0);
    });
  } catch (err) {
    res.writeHead(500).end("token exchange failed");
    console.error("Token exchange failed:", err);
    process.exit(1);
  }
});

server.listen(9876);
