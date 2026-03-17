/**
 * Convert a local/public image path to a full public URL.
 * E.g. "public/images/seasonal/mothers-day/hero.webp" -> "https://truecolorprinting.ca/images/seasonal/mothers-day/hero.webp"
 */
export function toPublicUrl(imagePath: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truecolorprinting.ca";
  const cleaned = imagePath.replace(/^public\//, "");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `${siteUrl}/${cleaned}`;
}
