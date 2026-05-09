#!/usr/bin/env node
/**
 * One-time OAuth flow to get a refresh token for the GSC API.
 *
 * Reads GSC_OAUTH_CLIENT_ID / GSC_OAUTH_CLIENT_SECRET from environment.
 * Spins up a local server on http://localhost:9876 to catch the callback.
 *
 * Usage (from truecolor-estimator/):
 *   node scripts/gsc-oauth-init.mjs
 *
 * After consent, prints the refresh token. Paste it into Railway as
 * GSC_OAUTH_REFRESH_TOKEN.
 *
 * IMPORTANT: log in with the Google account that OWNS the GSC property,
 * not the one that owns the GCP project.
 */

import { google } from "googleapis";
import http from "node:http";
import { URL } from "node:url";

const CLIENT_ID = process.env.GSC_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:9876/oauth/callback";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GSC_OAUTH_CLIENT_ID or GSC_OAUTH_CLIENT_SECRET in env.");
  console.error("Run: source ~/.secrets && node scripts/gsc-oauth-init.mjs");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // forces a refresh_token even on re-auth
  scope: SCOPES,
});

console.log("\nOpen this URL in your browser (signed in as the GSC OWNER account):\n");
console.log(authUrl);
console.log("\nWaiting for callback on http://localhost:9876 ...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  const u = new URL(req.url, "http://localhost:9876");
  if (u.pathname !== "/oauth/callback") {
    res.writeHead(404).end("not found");
    return;
  }
  const code = u.searchParams.get("code");
  const error = u.searchParams.get("error");
  if (error) {
    res.writeHead(400).end(`OAuth error: ${error}`);
    console.error(`OAuth error: ${error}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(400).end("no code in callback");
    return;
  }
  try {
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Authorized. You can close this tab.");
    console.log("\n✓ Tokens received\n");
    if (!tokens.refresh_token) {
      console.error(
        "WARNING: no refresh_token returned. This usually means you've already authorized this client. Revoke it at https://myaccount.google.com/permissions and re-run.",
      );
    } else {
      console.log("REFRESH TOKEN (paste into Railway as GSC_OAUTH_REFRESH_TOKEN):\n");
      console.log(tokens.refresh_token);
      console.log("\n");
    }
    server.close();
  } catch (err) {
    res.writeHead(500).end("token exchange failed");
    console.error("Token exchange failed:", err);
    server.close();
    process.exit(1);
  }
});

server.listen(9876);
