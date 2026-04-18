import Redis from "ioredis";
import { env } from "@/lib/env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});
