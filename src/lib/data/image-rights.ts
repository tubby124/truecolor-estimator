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

function approvedMerchantImage(
  assetId: string,
  sha256: string,
  imagePath: string,
  exactOfferId: string,
): ImageRightsRecord {
  return {
    assetId,
    sha256,
    publicUrl: `https://truecolorprinting.ca${imagePath}`,
    exactOfferId,
    channels: ["site", "merchant"],
    status: "approved",
  };
}

// New distribution defaults to deny. These exact store-catalog assets were
// owner-directed for Merchant distribution on 2026-09-04. They deliberately do
// not authorize GBP, social, Ads, email, or image-sitemap distribution.
export const IMAGE_RIGHTS_REGISTER: readonly ImageRightsRecord[] = [
  approvedMerchantImage("merchant-coroplast-signs-2026-09-04", "bbac41598e7ca5e9f1f3dd93a459c1d088d0955277cc3faeb28b5e072d48477b", "/images/products/product/coroplast-yard-sign-800x600.webp", "tc-coroplast-signs-0ace18fa203c"),
  approvedMerchantImage("merchant-vinyl-banners-2026-09-04", "b0f5c0fd11f1f8de975d589f11e0329701b22739c163161dd6e011c0a2457bcd", "/images/products/product/banner-vinyl-colorful-800x600.webp", "tc-vinyl-banners-c29b4b917fc2"),
  approvedMerchantImage("merchant-acp-signs-2026-09-04", "cad875a3ce7147c15b64d549f6e58e7cbc4b6004a14c4d028405c66b7d1a78b0", "/images/products/product/acp-aluminum-sign-800x600.webp", "tc-acp-signs-024a9a718044"),
  approvedMerchantImage("merchant-vehicle-magnets-2026-09-04", "95237719d23a5ea795eda612afbac7a3348feb0827a8fa9b9b7f2eabb781e2ec", "/images/products/product/vehicle-magnets-800x600.webp", "tc-vehicle-magnets-43f394dc3e9b"),
  approvedMerchantImage("merchant-foamboard-displays-2026-09-04", "6b7ea1bba7c1cfab624f5c609d11d8b81f734729f6915f3543a69902d18bc8ef", "/images/products/product/foamboard-display-800x600.webp", "tc-foamboard-displays-710e8674a769"),
  approvedMerchantImage("retractable-economy-owner-created-2026-09-02", "c1c12c72fca9ae4bd7ab408a2062375af76ffa22c18571e0f458368e7b22eda3", "/images/products/product/retractable-stand-600x900.webp", "tc-retractable-banners-85e2542c9a34"),
  approvedMerchantImage("merchant-window-decals-2026-09-04", "8dcaed29179d5d4b718495b69b4a3c1f9b9bf60acc02f6945e4d99f1eefa610b", "/images/products/product/window-decal-before-after-800x600.webp", "tc-window-decals-dba69897d9ac"),
  approvedMerchantImage("merchant-window-perf-2026-09-04", "d11a345cbf500845dd44fc3b859974b34a2514567e05f3584c3a5928f53920f7", "/images/products/product/perf-vinyl-interior-seethrough-800x600.webp", "tc-window-perf-aff47a44a104"),
  approvedMerchantImage("merchant-vinyl-lettering-2026-09-04", "c565ffa373249b7276ae9074eed9e51faf6d4a86fb8ff55885a2da377beff510", "/images/products/product/vinyl-lettering-800x600.webp", "tc-vinyl-lettering-5cd13b4f0b78"),
  approvedMerchantImage("merchant-stickers-2026-09-04", "bba7e97e4838909a096412aca9fbd0df20835ac1ae91030a879dd017d8fbeee2", "/images/products/product/stickers-800x600.webp", "tc-stickers-15745184915d"),
  approvedMerchantImage("merchant-postcards-2026-09-04", "5260515024468e08356da4947d3d559f783a55714e5fd634e50506347f9d3ebd", "/images/products/product/postcards-800x600.webp", "tc-postcards-5f8ac3be2a8e"),
  approvedMerchantImage("merchant-brochures-2026-09-04", "bf7b180ed030dbdac4105b5ae15033dbcc2ca48f4b66d81d289ebe416ec01e2a", "/images/products/product/brochures-800x600.webp", "tc-brochures-862c2c49791a"),
  approvedMerchantImage("merchant-flyers-2026-09-04", "ca8e5d15607119b6edd7b738bf3303dc56abf271225a3ee02e4ea652fd71e25c", "/images/products/product/flyers-stack-800x600.webp", "tc-flyers-fa86eee9dd8e"),
  approvedMerchantImage("merchant-business-cards-2026-09-04", "4b8f4f202af54342a4191d3ce57d1dd3bc34e16fe528a4a926e5e5831b133a41", "/images/products/product/business-cards-800x600.webp", "tc-business-cards-d6d62ed498b9"),
  approvedMerchantImage("merchant-photo-posters-2026-09-04", "1da3b4c300c1a13fa51f87b250908a3a3427e1bf33368cfed75176175fdb4bd2", "/images/products/product/photo-posters-800x600.webp", "tc-photo-posters-88ae36e8b918"),
  approvedMerchantImage("merchant-magnet-calendars-2026-09-04", "3bd353fc20994e5b0f61d743312b0f716280b7301c9f87d31518999e14634046", "/images/products/product/magnet-calendars-800x600.webp", "tc-magnet-calendars-8c8ad60e10a6"),
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

export function findChannelClearedImageForOffer(
  publicUrl: string,
  channel: ImageChannel,
  exactOfferId: string,
  actualSha256: string,
): ImageRightsRecord | undefined {
  return IMAGE_RIGHTS_REGISTER.find((record) =>
    record.status === "approved"
    && record.publicUrl === publicUrl
    && record.sha256 === actualSha256
    && record.channels.includes(channel)
    && record.exactOfferId === exactOfferId,
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
