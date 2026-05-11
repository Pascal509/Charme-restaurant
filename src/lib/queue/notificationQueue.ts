import { Queue } from "bullmq";
import { getRedisClient, warnRedisUnavailable } from "@/lib/queue/redis";

let notificationQueueInstance: Queue | null | undefined;

function getNotificationQueue() {
  if (notificationQueueInstance !== undefined) return notificationQueueInstance;

  const redis = getRedisClient();
  if (!redis) {
    notificationQueueInstance = null;
    return notificationQueueInstance;
  }

  notificationQueueInstance = new Queue("notifications", {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 1000
    }
  });

  return notificationQueueInstance;
}

export const notificationQueue = {
  async add(...args: Parameters<Queue["add"]>) {
    const queue = getNotificationQueue();
    if (!queue) {
      warnRedisUnavailable("Notification queue");
      return null;
    }

    try {
      return await queue.add(...args);
    } catch (error) {
      warnRedisUnavailable("Notification queue enqueue", error);
      return null;
    }
  }
};
