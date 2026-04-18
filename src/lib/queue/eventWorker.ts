import { prisma } from "@/lib/db";
import { deadLetterQueue } from "@/lib/queue/eventQueue";
import { log } from "@/lib/logger";
import { trackMetric } from "@/lib/monitoring";
import { domainEventHandlers } from "@/lib/queue/handlers";
import { publishDomainEvent } from "@/realtime/orderEventsPublisher";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 5 * 60 * 1000;

export async function processDomainEvent(eventId: string) {
  const event = await prisma.domainEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    log("warn", "Domain event not found", { eventId });
    return;
  }

  if (event.processedAt || event.status === "COMPLETED" || event.status === "DEAD") {
    log("info", "Domain event already processed", { eventId });
    return;
  }

  const handler = domainEventHandlers[event.type];
  if (!handler) {
    await markDead(eventId, `No handler for event type: ${event.type}`);
    return;
  }

  const start = Date.now();

  try {
    await handler(JSON.parse(event.payload), event);
    await publishDomainEvent(event.id);

    await prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null
      }
    });

    trackMetric({ name: "domain_event_processed", value: 1, tags: { type: event.type } });
    trackMetric({ name: "domain_event_duration_ms", value: Date.now() - start, tags: { type: event.type } });
  } catch (error) {
    const attempts = event.attempts + 1;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (attempts - 1), MAX_DELAY_MS);
    const nextRunAt = new Date(Date.now() + delay);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (attempts >= MAX_ATTEMPTS) {
      await markDead(eventId, errorMessage);
      await deadLetterQueue.add("dead-letter", { eventId, error: errorMessage });
      return;
    }

    await prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        status: "FAILED",
        attempts,
        nextRunAt,
        lockedAt: null,
        lockedBy: null,
        lastError: errorMessage
      }
    });

    trackMetric({ name: "domain_event_retry", value: 1, tags: { type: event.type } });
    log("warn", "Domain event failed, retry scheduled", { eventId, attempts, delay });
  }
}

async function markDead(eventId: string, errorMessage: string) {
  await prisma.domainEvent.update({
    where: { id: eventId },
    data: {
      status: "DEAD",
      processedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: errorMessage
    }
  });
}
