import { prisma } from "@/lib/db";
import { getSocketServer } from "@/realtime/socketServer";

const eventMap: Record<string, { event: string; status: string }> = {
  OrderAccepted: { event: "order.accepted", status: "ACCEPTED" },
  OrderPreparing: { event: "order.preparing", status: "PREPARING" },
  OrderReady: { event: "order.ready", status: "READY" },
  OrderOutForDelivery: { event: "order.out_for_delivery", status: "OUT_FOR_DELIVERY" },
  OrderDelivered: { event: "order.delivered", status: "DELIVERED" },
  OrderCancelled: { event: "order.cancelled", status: "CANCELLED" },
  PaymentConfirmed: { event: "payment.confirmed", status: "PAID" },
  PaymentFailed: { event: "payment.failed", status: "FAILED" }
};

export async function publishDomainEvent(eventId: string) {
  const event = await prisma.domainEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const mapping = eventMap[event.type];
  if (!mapping) return;

  const payload = JSON.parse(event.payload ?? "{}") as { orderId?: string };
  if (!payload.orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    select: {
      id: true,
      status: true,
      acceptedAt: true,
      preparingAt: true,
      readyAt: true,
      outForDeliveryAt: true,
      deliveredAt: true,
      cancelledAt: true,
      paymentStatus: true
    }
  });

  if (!order) return;

  const io = getSocketServer();
  if (!io) return;
  const room = `order:${order.id}`;

  io.to(room).emit(mapping.event, {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    timestamps: {
      acceptedAt: order.acceptedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      outForDeliveryAt: order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt
    }
  });

  if (["ACCEPTED", "PREPARING", "READY"].includes(order.status)) {
    io.to("kitchen:orders").emit(mapping.event, {
      orderId: order.id,
      status: order.status,
      timestamps: {
        acceptedAt: order.acceptedAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt
      }
    });
  }

  if (["READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
    io.to("delivery:orders").emit(mapping.event, {
      orderId: order.id,
      status: order.status,
      timestamps: {
        readyAt: order.readyAt,
        outForDeliveryAt: order.outForDeliveryAt,
        deliveredAt: order.deliveredAt
      }
    });
  }
}
