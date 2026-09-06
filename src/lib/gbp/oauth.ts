import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { OAuth2Client } from "google-auth-library";

export const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";
const STATE_COOKIE = "tc_gbp_oauth_state";

function getConfig() {
  const clientId = process.env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GBP_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GBP_REDIRECT_URI;
  const encryptionKey = process.env.GOOGLE_GBP_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) throw new Error("GBP integration is not configured");
  if (!/^[a-f0-9]{64}$/i.test(encryptionKey)) throw new Error("GBP token encryption key is invalid");
  return { clientId, clientSecret, redirectUri, encryptionKey };
}

export function gbpConfigured() {
  try { getConfig(); return true; } catch { return false; }
}

export function getGbpOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getConfig();
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

type StateContext = { businessId: string; userId: string };
export function createOAuthState(context: StateContext, now = Date.now()) {
  const { encryptionKey } = getConfig();
  const value = Buffer.from(JSON.stringify({ ...context, nonce: randomBytes(32).toString("hex"), expires: now + 600_000 })).toString("base64url");
  const signature = createHmac("sha256", encryptionKey).update(value).digest("hex");
  return { value, cookieValue: `${value}.${signature}` };
}

export function readOAuthState(state: string | null, cookieValue: string | undefined, now = Date.now()): StateContext | null {
  if (!state || !cookieValue) return null;
  const [value, signature, extra] = cookieValue.split(".");
  if (!value || !signature || extra || value !== state) return null;
  const { encryptionKey } = getConfig();
  const expected = createHmac("sha256", encryptionKey).update(value).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return typeof payload.businessId === "string" && typeof payload.userId === "string" && Number.isFinite(payload.expires) && payload.expires > now && payload.expires <= now + 600_000 ? { businessId: payload.businessId, userId: payload.userId } : null;
  } catch { return null; }
}

export function verifyOAuthState(state: string | null, cookieValue: string | undefined, context: StateContext, now = Date.now()) {
  const saved = readOAuthState(state, cookieValue, now);
  return !!saved && saved.businessId === context.businessId && saved.userId === context.userId;
}

export function oauthStateCookie() { return STATE_COOKIE; }

export function encryptRefreshToken(refreshToken: string, businessId: string) {
  const { encryptionKey } = getConfig();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(encryptionKey, "hex"), iv);
  cipher.setAAD(Buffer.from(businessId));
  const ciphertext = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function decryptRefreshToken(row: { business_id: string; token_key_version: number; refresh_token_ciphertext: string; refresh_token_iv: string; refresh_token_auth_tag: string }) {
  if (row.token_key_version !== 2) throw new Error("GBP connection requires reconnection to bind its credential to this business");
  const { encryptionKey } = getConfig();
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(encryptionKey, "hex"), Buffer.from(row.refresh_token_iv, "base64"));
  decipher.setAAD(Buffer.from(row.business_id));
  decipher.setAuthTag(Buffer.from(row.refresh_token_auth_tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(row.refresh_token_ciphertext, "base64")), decipher.final()]).toString("utf8");
}
