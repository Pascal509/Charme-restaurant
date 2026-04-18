import { enqueueNotificationsFromEvent } from "@/features/notifications/services/notificationService";
import { recordOrderAnalytics } from "@/features/analytics/services/analyticsService";
import { updateInventoryMetrics } from "@/features/supplychain/services/inventoryMetricsService";
import type { DomainEvent } from "@prisma/client";

type EventPayload = Record<string, unknown>;

export const domainEventHandlers: Record<
  string,
  (payload: EventPayload, event: DomainEvent) => Promise<void>
> = {
  PaymentConfirmed: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  PaymentFailed: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderAccepted: async (payload, event) => {
    await recordOrderAnalytics(payload);
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderPreparing: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderReady: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderOutForDelivery: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderDelivered: async (payload, event) => {
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  },
  OrderCancelled: async (payload, event) => {
    await updateInventoryMetrics(payload);
    await enqueueNotificationsFromEvent({
      eventId: event.id,
      eventType: event.type,
      payload
    });
  }
};
