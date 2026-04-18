import { prisma } from "@/lib/db";
import type { Prisma, OrderStatus, OrderType } from "@prisma/client";
import { emitDomainEvent } from "@/lib/events/eventService";
import type { PaymentEventType } from "@/features/payment/types";

const statusEvents: Partial<Record<OrderStatus, PaymentEventType>> = {
  ACCEPTED: "OrderAccepted",
  PREPARING: "OrderPreparing",
  READY: "OrderReady",
  OUT_FOR_DELIVERY: "OrderOutForDelivery",
  DELIVERED: "OrderDelivered",
  CANCELLED: "OrderCancelled"
};

export async function transitionOrderStatus(params: {
  orderId: string;
  nextStatus: OrderStatus;
  tx?: Prisma.TransactionClient;
  extraData?: Prisma.OrderUpdateInput;
}) {
  if (params.tx) {
    return transitionWithClient(params.tx, params);
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) =>
    transitionWithClient(tx, params)
  );
}

async function transitionWithClient(
  tx: Prisma.TransactionClient,
  params: {
    orderId: string;
    nextStatus: OrderStatus;
    extraData?: Prisma.OrderUpdateInput;
  }
) {
  const order = await tx.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("Order not found");

  assertTransition({
    currentStatus: order.status,
    nextStatus: params.nextStatus,
    orderType: order.orderType
  });

  const now = new Date();
  const timestampData = buildTimestampData(params.nextStatus, now);

  const updated = await tx.order.update({
    where: { id: order.id },
    data: {
      status: params.nextStatus,
      ...timestampData,
      ...(params.extraData ?? {})
    }
  });

  const eventType = statusEvents[params.nextStatus];
  if (eventType) {
    await emitDomainEvent({
      type: eventType,
      payload: {
        orderId: updated.id,
        previousStatus: order.status,
        nextStatus: updated.status,
        orderType: updated.orderType
      },
      tx
    });
  }

  return updated;
}

function buildTimestampData(status: OrderStatus, now: Date) {
  switch (status) {
    case "ACCEPTED":
      return { acceptedAt: now };
    case "PREPARING":
      return { preparingAt: now };
    case "READY":
      return { readyAt: now };
    case "OUT_FOR_DELIVERY":
      return { outForDeliveryAt: now };
    case "DELIVERED":
      return { deliveredAt: now };
    case "CANCELLED":
      return { cancelledAt: now };
    default:
      return {};
  }
}

function assertTransition(params: {
  currentStatus: OrderStatus;
  nextStatus: OrderStatus;
  orderType: OrderType;
}) {
  if (params.currentStatus === params.nextStatus) {
    throw new Error("Order already in target status");
  }

  if (params.nextStatus === "CANCELLED") {
    if (["DELIVERED", "CANCELLED", "FAILED"].includes(params.currentStatus)) {
      throw new Error("Order cannot be cancelled in current status");
    }
    return;
  }

  const allowed = allowedTransitions(params.orderType)[params.currentStatus] ?? [];
  if (!allowed.includes(params.nextStatus)) {
    throw new Error("Invalid order transition");
  }
}

function allowedTransitions(orderType: OrderType): Record<OrderStatus, OrderStatus[]> {
  return {
    PENDING: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY:
      orderType === "DELIVERY"
        ? ["OUT_FOR_DELIVERY", "CANCELLED"]
        : ["DELIVERED", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
    FAILED: []
  };
}
