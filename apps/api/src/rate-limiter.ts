import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "./router.js";
import { ErrorCode, log, getRequestId } from "./logger.js";

// ─── Sliding window rate limiter (in-memory, zero deps) ────────

interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();

// Defaults — tunable per deployment
const DEFAULT_WINDOW_MS = 60_000;       // 1 minute
const DEFAULT_MAX_REQUESTS = 60;        // 60 req/min for anonymous
const AUTHENTICATED_MAX_REQUESTS = 120; // 120 req/min for keyed users

// Cleanup stale entries every 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      if (now >= entry.resetAt) windows.delete(key);
    }
  }, 5 * 60_000);
  // Don't keep process alive for cleanup
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * Check rate limit for a request. Returns true if allowed, false if blocked.
 * When blocked, sends 429 response automatically.
 */
export function checkRateLimit(
  req: IncomingMessage,
  res: ServerResponse,
  opts?: { authenticated?: boolean },
): boolean {
  startCleanup();

  const ip = getClientIp(req);
  const maxRequests = opts?.authenticated ? AUTHENTICATED_MAX_REQUESTS : DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  let entry = windows.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + DEFAULT_WINDOW_MS };
    windows.set(ip, entry);
  }

  entry.count++;

  // Set rate limit headers (draft RFC 7231 / RateLimit fields)
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
  res.setHeader("RateLimit-Limit", String(maxRequests));
  res.setHeader("RateLimit-Remaining", String(remaining));
  res.setHeader("RateLimit-Reset", String(resetSeconds));

  if (entry.count > maxRequests) {
    log("warn", "rate_limited", {
      request_id: getRequestId(res),
      ip,
      count: entry.count,
      limit: maxRequests,
    });
    res.setHeader("Retry-After", String(resetSeconds));
    sendError(res, 429, ErrorCode.RATE_LIMITED, "Too many requests", {
      retry_after: resetSeconds,
    });
    return false;
  }

  return true;
}

/** Reset all rate limit state (for testing) */
export function resetRateLimits(): void {
  windows.clear();
}

/** Visible for testing */
export const LIMITS = {
  WINDOW_MS: DEFAULT_WINDOW_MS,
  DEFAULT_MAX: DEFAULT_MAX_REQUESTS,
  AUTHENTICATED_MAX: AUTHENTICATED_MAX_REQUESTS,
} as const;
