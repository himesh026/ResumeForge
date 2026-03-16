/**
 * Simple in-memory rate limiter using sliding window.
 * For production, replace the store with Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store — resets on server restart
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number
  /** Window duration in seconds */
  windowSecs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSecs * 1000
  const key = identifier

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

// Preset configs
export const RATE_LIMITS = {
  // AI generation — expensive, limit tightly
  generation: { limit: 10, windowSecs: 60 * 60 },      // 10/hour
  // Auth — prevent brute force
  auth: { limit: 5, windowSecs: 60 * 15 },              // 5/15min
  // General API
  api: { limit: 60, windowSecs: 60 },                   // 60/min
} satisfies Record<string, RateLimitConfig>
