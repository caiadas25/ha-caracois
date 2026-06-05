import "server-only";

import { NextResponse } from "next/server";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitState>();

function now() {
  return Date.now();
}

function pruneExpiredBuckets(current = now()) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= current) buckets.delete(key);
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const current = now();
  pruneExpiredBuckets(current);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= current) {
    buckets.set(key, { count: 1, resetAt: current + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count <= limit) return { limited: false, retryAfter: 0 };

  return {
    limited: true,
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - current) / 1000)),
  };
}

export function rateLimitByIp(
  request: Request,
  prefix: string,
  limit: number,
  windowMs: number,
) {
  const ip = getClientIp(request);
  const result = checkRateLimit({ key: `${prefix}:${ip}`, limit, windowMs });
  if (!result.limited) return null;

  return NextResponse.json(
    { error: "Demasiados pedidos. Tenta novamente mais tarde." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    },
  );
}

export function isSameOriginRequest(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") return false;
  if (
    !request.headers.get("origin") &&
    (secFetchSite === "same-origin" || secFetchSite === "same-site")
  ) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host") ?? requestUrl.host;
    const proto =
      request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");

    return originUrl.host === host && originUrl.protocol === `${proto}:`;
  } catch {
    return false;
  }
}

export function rejectCrossOriginRequest(request: Request) {
  if (isSameOriginRequest(request)) return null;
  return NextResponse.json({ error: "Pedido não autorizado." }, { status: 403 });
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
