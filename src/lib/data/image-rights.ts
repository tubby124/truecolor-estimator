export type ImageChannel = "site" | "merchant" | "gbp" | "social" | "email" | "ads";

export interface ImageRightsRecord {
  assetId: string;
  sha256: string;
  channels: readonly ImageChannel[];
  status: "approved" | "hold";
  exactOfferId?: string;
  expiresAt?: string;
  /** Absolute public URL, required before the asset can enter the image sitemap. */
  publicUrl?: string;
  /** Explicitly separate from ordinary on-site display permission. */
  imageSitemap?: boolean;
}

// New distribution defaults to deny. The one approved entry below is the
// owner-created Economy pilot visual confirmed on 2026-09-02. It deliberately
// does not authorize GBP, social, Ads, email, or image-sitemap distribution.
export const IMAGE_RIGHTS_REGISTER: readonly ImageRightsRecord[] = [
  {
    assetId: "retractable-economy-owner-created-2026-09-02",
    sha256: "c1c12c72fca9ae4bd7ab408a2062375af76ffa22c18571e0f458368e7b22eda3",
    publicUrl: "https://truecolorprinting.ca/images/products/product/retractable-stand-600x900.webp",
    exactOfferId: "tc-retractable-banners--33-5x80--1s--q1--mat-rbs33507875s",
    channels: ["site", "merchant"],
    status: "approved",
  },
];

export function findChannelClearedImage(
  sha256: string,
  channel: ImageChannel,
  exactOfferId?: string,
): ImageRightsRecord | undefined {
  return IMAGE_RIGHTS_REGISTER.find((record) =>
    record.status === "approved"
    && record.sha256 === sha256
    && record.channels.includes(channel)
    && (!exactOfferId || record.exactOfferId === exactOfferId),
  );
}

/**
 * An image sitemap is a Google distribution surface. A site-visible image is
 * therefore not automatically cleared for it: the evidence record must name
 * the exact public URL and opt into this channel.
 */
export function isImageSitemapCleared(publicUrl: string): boolean {
  return IMAGE_RIGHTS_REGISTER.some((record) =>
    record.status === "approved"
    && record.channels.includes("site")
    && record.imageSitemap === true
    && record.publicUrl === publicUrl,
  );
}
