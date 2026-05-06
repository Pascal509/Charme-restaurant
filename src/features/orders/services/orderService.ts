import { prisma } from "@/lib/db";
import type { Prisma, OrderStatus } from "@prisma/client";
import { releaseReservation } from "@/features/products/services/inventoryService";
import { transitionOrderStatus } from "@/features/orders/services/orderWorkflowService";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return transitionOrderStatus({ orderId, nextStatus: status });
}

export async function cancelOrder(orderId: string, tx?: Prisma.TransactionClient) {
  if (tx) {
    const order = await transitionOrderStatus({
      orderId,
      nextStatus: "CANCELLED",
      tx,
      extraData: { paymentStatus: "FAILED" }
    });

    await releaseReservation({ orderId, tx });
    return order;
  }

  return prisma.$transaction(async (client: Prisma.TransactionClient) => {
    const order = await transitionOrderStatus({
      orderId,
      nextStatus: "CANCELLED",
      tx: client,
      extraData: { paymentStatus: "FAILED" }
    });

    await releaseReservation({ orderId, tx: client });
    return order;
  });
}

export async function failOrder(orderId: string, tx?: Prisma.TransactionClient) {
  const update = async (client: Prisma.TransactionClient) => {
    const order = await client.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "FAILED") {
      return order;
    }

    const updated = await client.order.update({
      where: { id: orderId },
      data: { status: "FAILED", paymentStatus: "FAILED" }
    });

    await releaseReservation({ orderId, tx: client });
    return updated;
  };

  if (tx) {
    return update(tx);
  }

  return prisma.$transaction((client) => update(client));
}
