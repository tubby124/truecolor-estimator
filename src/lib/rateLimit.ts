/**
 * In-memory rate limiter — per-IP, sliding window.
 * Works per process (fine for a single-server Railway Hobby deployment).
 * No external dependencies required.
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Clean up expired entries every 10 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 10 * 60 * 1000).unref(); // .unref() so this timer doesn't keep the process alive

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      - Unique bucket key e.g. `orders:1.2.3.4`
 * @param max      - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}

/** Extract client IP from Next.js request headers (Cloudflare / Railway). */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
