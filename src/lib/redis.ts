import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Upstash Redis, or null when it isn't configured. Every caller must handle
 * null so the app runs without Redis (counters just don't accumulate, caches
 * always miss). See big-01 Week 4.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const redisEnabled = redis !== null;

const VIEW_KEY = (id: string) => `views:${id}`;
const DIRTY_SET = "views:dirty";

/** Bump an article's pending view count. Fire-and-forget from the view ping. */
export async function incrementView(articleId: string): Promise<void> {
  if (!redis) return;
  await Promise.all([
    redis.incr(VIEW_KEY(articleId)),
    redis.sadd(DIRTY_SET, articleId),
  ]);
}

/** Drain pending view counts: returns [{ id, delta }] and clears the counters. */
export async function drainViews(): Promise<{ id: string; delta: number }[]> {
  if (!redis) return [];
  const ids = await redis.smembers(DIRTY_SET);
  if (ids.length === 0) return [];

  const out: { id: string; delta: number }[] = [];
  for (const id of ids) {
    // GETDEL is atomic — no views lost between read and reset.
    const delta = await redis.getdel<number>(VIEW_KEY(id));
    await redis.srem(DIRTY_SET, id);
    if (delta && delta > 0) out.push({ id, delta: Number(delta) });
  }
  return out;
}

/** Read-through cache for a JSON-serialisable value. No-ops (calls `fn`) without Redis. */
export async function cachedJSON<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!redis) return fn();
  const hit = await redis.get<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await fn();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
