import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

/** Build a limiter, or null if Redis isn't configured (then callers allow all). */
function make(tokens: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "rl",
  });
}

export const limiters = {
  comment: make(5, "10 m"),
  newsletter: make(3, "1 h"),
  register: make(5, "1 h"),
  upload: make(20, "10 m"),
};

/** Returns true if allowed. Fails open (allows) when Redis is absent. */
export async function allow(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(identifier);
  return success;
}

/** Best-effort client key for anonymous-ish endpoints. */
export function clientKey(req: Request, extra = ""): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : "local";
  return `${ip}:${extra}`;
}
