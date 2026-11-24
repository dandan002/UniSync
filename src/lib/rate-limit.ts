import "server-only";

// A small in-memory, per-instance budget of requests per key per window.
// Enough to slow down a script hammering a public route; not a quota.
export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allowed(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
