import { prisma } from "@/lib/db";
import { notificationQueue } from "@/lib/queue/notificationQueue";
import { log } from "@/lib/logger";
import type { NotificationChannel, NotificationJob, NotificationType } from "@/features/notifications/types";
import { orderConfirmedTemplate } from "@/features/notifications/templates/orderConfirmed";
import { orderPreparingTemplate } from "@/features/notifications/templates/orderPreparing";
import { orderReadyTemplate } from "@/features/notifications/templates/orderReady";
import { orderOutForDeliveryTemplate } from "@/features/notifications/templates/orderOutForDelivery";
import { orderDeliveredTemplate } from "@/features/notifications/templates/orderDelivered";
import { paymentFailedTemplate } from "@/features/notifications/templates/paymentFailed";

const channels: NotificationChannel[] = ["EMAIL", "SMS", "PUSH"];

const eventToNotificationType: Record<string, NotificationType> = {
  PaymentConfirmed: "ORDER_CONFIRMED",
  OrderAccepted: "ORDER_CONFIRMED",
  OrderPreparing: "ORDER_PREPARING",
  OrderReady: "ORDER_READY",
  OrderOutForDelivery: "ORDER_OUT_FOR_DELIVERY",
  OrderDelivered: "ORDER_DELIVERED",
  PaymentFailed: "PAYMENT_FAILED"
};

export async function enqueueNotificationsFromEvent(params: {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const notificationType = eventToNotificationType[params.eventType];
  if (!notificationType) return;

  const orderId = String(params.payload.orderId ?? "");
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: { id: true, email: true }
      }
    }
  });

  if (!order || !order.userId || !order.user) {
    log("warn", "Notification skipped: missing order user", { orderId });
    return;
  }

  const userId = order.userId;
  const userEmail = order.user.email ?? null;

  const template = resolveTemplate(notificationType, order.id);
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: order.userId, type: notificationType }
  });

  const preferenceMap = new Map<NotificationChannel, boolean>();
  for (const pref of preferences) {
    preferenceMap.set(pref.channel as NotificationChannel, pref.enabled);
  }

  await Promise.all(
    channels.map(async (channel) => {
      const enabled = preferenceMap.has(channel)
        ? preferenceMap.get(channel) ?? true
        : true;
      let skipReason = enabled ? null : "Preference disabled";
      const recipient = resolveRecipient(channel, userEmail);
      if (!recipient && channel === "EMAIL") {
        skipReason = skipReason ?? "Missing email";
      }

      const job: NotificationJob = {
        eventId: params.eventId,
        userId,
        orderId: order.id,
        type: notificationType,
        channel,
        payload: template,
        recipient,
        skipReason
      };

      const jobId = `${params.eventId}:${userId}:${notificationType}:${channel}`;
      await notificationQueue.add("send-notification", job, { jobId });
    })
  );
}

function resolveTemplate(type: NotificationType, orderId: string) {
  switch (type) {
    case "ORDER_CONFIRMED":
      return orderConfirmedTemplate({ orderId });
    case "ORDER_PREPARING":
      return orderPreparingTemplate({ orderId });
    case "ORDER_READY":
      return orderReadyTemplate({ orderId });
    case "ORDER_OUT_FOR_DELIVERY":
      return orderOutForDeliveryTemplate({ orderId });
    case "ORDER_DELIVERED":
      return orderDeliveredTemplate({ orderId });
    case "PAYMENT_FAILED":
      return paymentFailedTemplate({ orderId });
    default:
      throw new Error("Notification template missing");
  }
}

function resolveRecipient(channel: NotificationChannel, email: string | null) {
  if (channel === "EMAIL") return email ?? null;
  return null;
}
