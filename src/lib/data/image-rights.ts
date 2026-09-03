export type ImageChannel = "site" | "merchant" | "gbp" | "social" | "email" | "ads";

export interface ImageRightsRecord {
  assetId: string;
  sha256: string;
  channels: readonly ImageChannel[];
  status: "approved" | "hold";
  exactOfferId?: string;
  expiresAt?: string;
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
