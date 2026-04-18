import { prisma } from "@/lib/db";
import { eventQueue } from "@/lib/queue/eventQueue";
import { log } from "@/lib/logger";

const LOCK_TTL_MS = 5 * 60 * 1000;

export async function pollAndEnqueueEvents(workerId: string, limit = 50) {
  const now = new Date();
  const lockExpiry = new Date(Date.now() - LOCK_TTL_MS);

  const events = await prisma.$transaction(async (tx) => {
    const candidates = await tx.domainEvent.findMany({
      where: {
        processedAt: null,
        nextRunAt: { lte: now },
        OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }]
      },
      orderBy: { createdAt: "asc" },
      take: limit
    });

    const locked: typeof candidates = [];

    for (const event of candidates) {
      const updated = await tx.domainEvent.updateMany({
        where: {
          id: event.id,
          processedAt: null,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }]
        },
        data: {
          lockedAt: now,
          lockedBy: workerId,
          status: "PROCESSING"
        }
      });

      if (updated.count > 0) {
        locked.push(event);
      }
    }

    return locked;
  });

  if (events.length === 0) {
    return 0;
  }

  for (const event of events) {
    await eventQueue.add("process-domain-event", { eventId: event.id }, { jobId: event.id });
  }

  log("info", "Enqueued domain events", { count: events.length });
  return events.length;
}
