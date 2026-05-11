import Redis from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import { env } from "@/lib/env";

let redisClient: RedisClient | null = null;
const warned = new Set<string>();

function warnDevOnce(key: string, message: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  if (warned.has(key)) return;
  warned.add(key);
  if (error instanceof Error) {
    console.warn(`[redis] ${message}: ${error.message}`);
    return;
  }
  console.warn(`[redis] ${message}`);
}

export function isRedisEnabled() {
  return env.REDIS_ENABLED;
}

export function getRedisClient() {
  if (!env.REDIS_ENABLED) {
    warnDevOnce("disabled", "Redis is disabled. Realtime and queue workers will use soft-fallback behavior.");
    return null;
  }

  if (!env.REDIS_URL) {
    warnDevOnce("missing-url", "REDIS_ENABLED=1 but REDIS_URL is missing. Realtime and queue workers are disabled.");
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });

  redisClient.on("error", (error) => {
    warnDevOnce("client-error", "Redis client error. Features depending on Redis may degrade", error);
  });

  return redisClient;
}

export function warnRedisUnavailable(feature: string, error?: unknown) {
  warnDevOnce(`feature:${feature}`, `${feature} is running without Redis`, error);
}
