const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseQuoteSubmissionKey(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

export function getQuoteTurnstileConfig(
  siteKey: string | undefined,
  secretKey: string | undefined,
) {
  const hasSiteKey = Boolean(siteKey?.trim());
  const hasSecretKey = Boolean(secretKey?.trim());

  return {
    configured: hasSiteKey && hasSecretKey,
    valid: hasSiteKey === hasSecretKey,
    issue:
      hasSiteKey === hasSecretKey
        ? null
        : "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY and CLOUDFLARE_TURNSTILE_SECRET_KEY must either both be set or both be absent",
  } as const;
}
