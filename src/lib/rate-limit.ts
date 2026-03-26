const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const requestBuckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function applyRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const threshold = now - RATE_LIMIT_WINDOW_MS;
  const existing = requestBuckets.get(key) ?? [];
  const activeWindow = existing.filter((timestamp) => timestamp > threshold);

  if (activeWindow.length >= RATE_LIMIT_MAX_REQUESTS) {
    const resetAt = activeWindow[0] + RATE_LIMIT_WINDOW_MS;

    requestBuckets.set(key, activeWindow);

    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      resetAt,
    };
  }

  activeWindow.push(now);
  requestBuckets.set(key, activeWindow);

  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - activeWindow.length),
    resetAt: now + RATE_LIMIT_WINDOW_MS,
  };
}
