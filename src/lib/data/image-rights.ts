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

// New distribution defaults to deny. Populate only with an evidence-backed
// exact file hash, documented permission/privacy scope, and channel clearance.
export const IMAGE_RIGHTS_REGISTER: readonly ImageRightsRecord[] = [];

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
