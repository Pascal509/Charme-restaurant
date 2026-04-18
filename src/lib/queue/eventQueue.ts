import { Queue } from "bullmq";
import { redis } from "@/lib/queue/redis";

export const eventQueue = new Queue("domain-events", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000
  }
});

export const deadLetterQueue = new Queue("domain-events-dlq", {
  connection: redis
});
