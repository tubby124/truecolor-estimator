import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { google } from "googleapis";

export const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";
const STATE_COOKIE = "tc_gbp_oauth_state";

function getConfig() {
  const clientId = process.env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GBP_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GBP_REDIRECT_URI;
  const encryptionKey = process.env.GOOGLE_GBP_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    throw new Error("GBP integration is not configured");
  }
  if (!/^[a-f0-9]{64}$/i.test(encryptionKey)) {
    throw new Error("GBP token encryption key is invalid");
  }
  return { clientId, clientSecret, redirectUri, encryptionKey };
}

export function getGbpOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function createOAuthState() {
  const { encryptionKey } = getConfig();
  const value = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", encryptionKey).update(value).digest("hex");
  return { value, cookieValue: `${value}.${signature}` };
}

export function verifyOAuthState(state: string | null, cookieValue: string | undefined) {
  if (!state || !cookieValue) return false;
  const [value, signature] = cookieValue.split(".");
  if (!value || !signature || value !== state) return false;
  const { encryptionKey } = getConfig();
  const expected = createHmac("sha256", encryptionKey).update(value).digest("hex");
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function oauthStateCookie(name = STATE_COOKIE) {
  return name;
}

export function encryptRefreshToken(refreshToken: string) {
  const { encryptionKey } = getConfig();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(encryptionKey, "hex"), iv);
  const ciphertext = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptRefreshToken(row: { refresh_token_ciphertext: string; refresh_token_iv: string; refresh_token_auth_tag: string }) {
  const { encryptionKey } = getConfig();
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(encryptionKey, "hex"), Buffer.from(row.refresh_token_iv, "base64"));
  decipher.setAuthTag(Buffer.from(row.refresh_token_auth_tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(row.refresh_token_ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function findTrueColorLocation(auth: ReturnType<typeof getGbpOAuthClient>) {
  const accountsClient = google.mybusinessaccountmanagement({ version: "v1", auth });
  const infoClient = google.mybusinessbusinessinformation({ version: "v1", auth });
  const accounts = (await accountsClient.accounts.list()).data.accounts ?? [];
  for (const account of accounts) {
    if (!account.name) continue;
    const locations = (await infoClient.accounts.locations.list({
      parent: account.name,
      readMask: "name,title",
      pageSize: 100,
    })).data.locations ?? [];
    const match = locations.find((location) => location.title?.trim().toLowerCase() === "true color display printing ltd.".toLowerCase());
    if (match?.name && match.title) {
      return { accountName: account.name, locationName: match.name, locationTitle: match.title };
    }
  }
  return null;
}
