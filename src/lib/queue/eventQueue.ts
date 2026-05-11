import { Queue } from "bullmq";
import { getRedisClient, warnRedisUnavailable } from "@/lib/queue/redis";

let eventQueueInstance: Queue | null | undefined;
let deadLetterQueueInstance: Queue | null | undefined;

function getEventQueue() {
  if (eventQueueInstance !== undefined) return eventQueueInstance;

  const redis = getRedisClient();
  if (!redis) {
    eventQueueInstance = null;
    return eventQueueInstance;
  }

  eventQueueInstance = new Queue("domain-events", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 1000
    }
  });

  return eventQueueInstance;
}

function getDeadLetterQueue() {
  if (deadLetterQueueInstance !== undefined) return deadLetterQueueInstance;

  const redis = getRedisClient();
  if (!redis) {
    deadLetterQueueInstance = null;
    return deadLetterQueueInstance;
  }

  deadLetterQueueInstance = new Queue("domain-events-dlq", {
    connection: redis
  });

  return deadLetterQueueInstance;
}

export const eventQueue = {
  async add(...args: Parameters<Queue["add"]>) {
    const queue = getEventQueue();
    if (!queue) {
      warnRedisUnavailable("Domain event queue");
      return null;
    }

    try {
      return await queue.add(...args);
    } catch (error) {
      warnRedisUnavailable("Domain event queue enqueue", error);
      return null;
    }
  }
};

export const deadLetterQueue = {
  async add(...args: Parameters<Queue["add"]>) {
    const queue = getDeadLetterQueue();
    if (!queue) {
      warnRedisUnavailable("Dead-letter queue");
      return null;
    }

    try {
      return await queue.add(...args);
    } catch (error) {
      warnRedisUnavailable("Dead-letter queue enqueue", error);
      return null;
    }
  }
};
