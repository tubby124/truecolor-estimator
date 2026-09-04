/** Payment links contain an opaque-but-sensitive bearer token and must never be measured. */
export function isSensitiveAnalyticsPath(pathname: string | null | undefined): boolean {
  return typeof pathname === "string" && /^\/pay(?:\/|$)/.test(pathname);
}
