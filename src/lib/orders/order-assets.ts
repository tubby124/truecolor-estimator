type OrderAssetRecord = {
  file_storage_paths?: string[] | null;
  proof_storage_paths?: string[] | null;
  proof_storage_path?: string | null;
  order_items?: Array<{ file_storage_path?: string | null }> | null;
};

/**
 * Returns durable storage paths for a job without duplicates.
 * New orders keep arrays on the order; old orders may have only a path on an
 * item or a single proof field, so both forms must remain readable forever.
 */
export function collectOrderAssetPaths(
  order: OrderAssetRecord,
  kind: "artwork" | "proof" = "artwork",
): string[] {
  const candidates = kind === "proof"
    ? [...(order.proof_storage_paths ?? []), order.proof_storage_path]
    : [
        ...(order.file_storage_paths ?? []),
        ...(order.order_items ?? []).map((item) => item.file_storage_path),
      ];

  return [...new Set(candidates.filter((path): path is string => Boolean(path?.trim())))];
}
