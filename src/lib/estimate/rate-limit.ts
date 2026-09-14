import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

const SCOPE = "public-estimate";
const MAX_REQUESTS = 60;
const WINDOW_SECONDS = 60;

/**
 * The application cannot prove its immediate network peer in a Next route, so
 * no caller-supplied forwarding header is trusted here. All app-origin traffic
 * shares one conservative bucket. This prevents an origin caller from minting
 * arbitrary identities; an ingress-proven per-client limit can be added later
 * only when the platform supplies an authenticated identity contract.
 */
export function publicEstimateRateLimitSubject(_req: { headers: { get(name: string): string | null } }): string {
  return "unattributed";
}

/**
 * Multi-instance limiter for the public estimate endpoint.
 *
 * Production uses the service-role-only Supabase RPC, which atomically claims a
 * server-secret-derived fixed public-subject hash. If the service secret or database is temporarily
 * unavailable, estimates remain available and fall back to the existing
 * process-local limiter. That fallback is intentionally less effective across
 * instances, so it is a continuity guard rather than a replacement for the
 * migration/RPC.
 */
export async function claimPublicEstimateRateLimit(req: { headers: { get(name: string): string | null } }): Promise<boolean> {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const subject = publicEstimateRateLimitSubject(req);

  if (!secret) {
    return rateLimit(`${SCOPE}:${subject}`, MAX_REQUESTS, WINDOW_SECONDS * 1_000);
  }

  const keyHash = createHash("sha256").update(`${SCOPE}:${secret}:${subject}`).digest("hex");
  try {
    const { data, error } = await createServiceClient().rpc("claim_api_rate_limit", {
      p_scope: SCOPE,
      p_key_hash: keyHash,
      p_limit: MAX_REQUESTS,
      p_window_seconds: WINDOW_SECONDS,
    });
    if (error || typeof data !== "boolean") throw error ?? new Error("Invalid rate-limit response");
    return data;
  } catch {
    return rateLimit(`${SCOPE}:${keyHash}`, MAX_REQUESTS, WINDOW_SECONDS * 1_000);
  }
}
