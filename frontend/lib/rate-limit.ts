import { redis } from "@/lib/redis";

// SECURITY: fixed-window rate limiter. Fails open if Redis is unreachable
// so an outage degrades to "no throttling" rather than locking everyone out.
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const k = `rl:${key}`;
    const n = await redis.incr(k);
    if (n === 1) {
      await redis.expire(k, windowSec);
    }
    return n <= limit;
  } catch (err) {
    console.error("[rate-limit] Redis error, failing open:", err);
    return true;
  }
}
