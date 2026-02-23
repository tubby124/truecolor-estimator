// ─── Single source of truth for app-wide constants ────────────────────────────
// Update LOGO_PATH here if the logo file ever changes — it propagates everywhere
// (email template, app header, customer overlay, future PDF)

export const LOGO_FILENAME = "truecolorlogo.webp";
export const LOGO_PATH = `/${LOGO_FILENAME}`;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app";

// Full absolute URL used in emails (clients can't access relative paths)
export function logoAbsoluteUrl(siteUrl?: string): string {
  return `${siteUrl ?? SITE_URL}${LOGO_PATH}`;
}
