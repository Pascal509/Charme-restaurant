import { Worker, Job } from "bullmq";
import { redis } from "@/lib/queue/redis";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import type { NotificationJob, NotificationChannel } from "@/features/notifications/types";
import { sendEmail } from "@/features/notifications/providers/emailProvider";
import { sendSms } from "@/features/notifications/providers/smsProvider";
import { sendPush } from "@/features/notifications/providers/pushProvider";

const RATE_LIMITS: Record<NotificationChannel, number> = {
  EMAIL: 20,
  SMS: 10,
  PUSH: 60
};

export function startNotificationWorker() {
  const worker = new Worker(
    "notifications",
    async (job: Job<NotificationJob>) => {
      await processNotificationJob(job.data);
    },
    {
      connection: redis,
      concurrency: 10
    }
  );

  worker.on("failed", (job, error) => {
    log("error", "Notification job failed", {
      jobId: job?.id,
      error: error.message
    });
  });

  return worker;
}

async function processNotificationJob(job: NotificationJob) {
  const logRecord = await prisma.notificationLog.upsert({
    where: {
      eventId_userId_type_channel: {
        eventId: job.eventId,
        userId: job.userId,
        type: job.type,
        channel: job.channel
      }
    },
    update: {},
    create: {
      eventId: job.eventId,
      userId: job.userId,
      orderId: job.orderId ?? null,
      type: job.type,
      channel: job.channel,
      status: "PENDING",
      payload: job.payload
    }
  });

  if (logRecord.status === "SENT" || logRecord.status === "SKIPPED") {
    return;
  }

  if (job.skipReason) {
    await prisma.notificationLog.update({
      where: { id: logRecord.id },
      data: { status: "SKIPPED", errorMessage: job.skipReason }
    });
    return;
  }

  const allowed = await checkRateLimit(job.userId, job.channel);
  if (!allowed) {
    await prisma.notificationLog.update({
      where: { id: logRecord.id },
      data: { status: "SKIPPED", errorMessage: "Rate limit exceeded" }
    });
    return;
  }

  if (!job.recipient) {
    await prisma.notificationLog.update({
      where: { id: logRecord.id },
      data: { status: "SKIPPED", errorMessage: "Missing recipient" }
    });
    return;
  }

  try {
    const providerId = await dispatch(job);
    await prisma.notificationLog.update({
      where: { id: logRecord.id },
      data: {
        status: "SENT",
        provider: providerId,
        sentAt: new Date(),
        errorMessage: null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.notificationLog.update({
      where: { id: logRecord.id },
      data: { status: "FAILED", errorMessage: message }
    });
    throw error;
  }
}

async function dispatch(job: NotificationJob) {
  if (job.channel === "EMAIL") {
    const result = await sendEmail({
      to: job.recipient ?? "",
      subject: job.payload.title,
      html: job.payload.emailHtml
    });
    return result.providerId;
  }

  if (job.channel === "SMS") {
    const result = await sendSms({
      to: job.recipient ?? "",
      message: job.payload.smsText
    });
    return result.providerId;
  }

  const result = await sendPush({
    to: job.recipient ?? "",
    title: job.payload.title,
    message: job.payload.message
  });
  return result.providerId;
}

async function checkRateLimit(userId: string, channel: NotificationChannel) {
  const now = new Date();
  const hourKey = `${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}${now.getUTCHours()}`;
  const key = `notif:rate:${userId}:${channel}:${hourKey}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60 * 60);
  }

  return count <= RATE_LIMITS[channel];
}
