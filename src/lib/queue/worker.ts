import { Worker } from "bullmq";
import { getRedisClient, warnRedisUnavailable } from "@/lib/queue/redis";
import { processDomainEvent } from "@/lib/queue/eventWorker";
import { log } from "@/lib/logger";

export function startEventWorker() {
  const redis = getRedisClient();
  if (!redis) {
    warnRedisUnavailable("Domain event worker startup");
    return null;
  }

  const worker = new Worker(
    "domain-events",
    async (job) => {
      const start = Date.now();
      await processDomainEvent(job.data.eventId);
      const durationMs = Date.now() - start;
      log("info", "Processed domain event", { eventId: job.data.eventId, durationMs });
    },
    {
      connection: redis,
      concurrency: 10
    }
  );

  worker.on("failed", (job, error) => {
    log("error", "Domain event worker failed", {
      eventId: job?.data?.eventId,
      error: error.message
    });
  });

  return worker;
}
