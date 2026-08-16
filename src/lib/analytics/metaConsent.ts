export const META_MARKETING_CONSENT_COOKIE = "tc_marketing_consent";
export const META_MARKETING_CONSENT_CHANGED_EVENT = "tc-marketing-consent-changed";

export type MarketingConsent = "granted" | "denied" | null;

export function getMarketingConsent(): MarketingConsent {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${META_MARKETING_CONSENT_COOKIE}=`))
    ?.slice(META_MARKETING_CONSENT_COOKIE.length + 1);

  return value === "granted" || value === "denied" ? value : null;
}

export function hasMarketingConsent(): boolean {
  return getMarketingConsent() === "granted";
}

export function saveMarketingConsent(consent: Exclude<MarketingConsent, null>) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${META_MARKETING_CONSENT_COOKIE}=${consent}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(META_MARKETING_CONSENT_CHANGED_EVENT));
}

export function clearMarketingConsent() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${META_MARKETING_CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(META_MARKETING_CONSENT_CHANGED_EVENT));
}
