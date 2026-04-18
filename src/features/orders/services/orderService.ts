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
