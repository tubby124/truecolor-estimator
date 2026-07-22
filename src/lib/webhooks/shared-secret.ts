import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compares secrets without branching on their byte length. Hashing both inputs
 * first gives timingSafeEqual two fixed-size buffers for every comparison.
 */
export function constantTimeSecretEqual(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;

  const providedDigest = createHash("sha256").update(provided, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}
