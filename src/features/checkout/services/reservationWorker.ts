import { prisma } from "@/lib/db";
import { releaseExpiredReservations } from "@/features/products/services/inventoryService";
import { cancelOrder } from "@/features/orders/services/orderService";

const STALE_ORDER_MINUTES = 20;

export async function runReservationCleanupJob() {
  await prisma.$transaction(async (tx) => {
    await releaseExpiredReservations(tx);

    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - STALE_ORDER_MINUTES);

    const staleOrders = await tx.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: { lt: cutoff }
      }
    });

    for (const order of staleOrders) {
      await cancelOrder(order.id, tx);
    }
  });
}
