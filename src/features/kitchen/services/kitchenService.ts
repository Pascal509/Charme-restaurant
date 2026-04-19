import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const statusPriority: Record<string, number> = {
  PREPARING: 1,
  ACCEPTED: 2,
  READY: 3
};

type KitchenOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { menuItem: true; productVariant: true } } };
}>;

export async function listKitchenOrders(restaurantId: string): Promise<KitchenOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: ["ACCEPTED", "PREPARING", "READY"] }
    },
    include: {
      items: {
        include: { menuItem: true, productVariant: true }
      }
    }
  });

  return orders.sort((a, b) => comparePriority(a, b));
}

export function groupKitchenOrdersByStatus(orders: KitchenOrder[]) {
  return orders.reduce(
    (acc: { ACCEPTED: KitchenOrder[]; PREPARING: KitchenOrder[]; READY: KitchenOrder[] }, order) => {
      if (order.status === "ACCEPTED") acc.ACCEPTED.push(order);
      if (order.status === "PREPARING") acc.PREPARING.push(order);
      if (order.status === "READY") acc.READY.push(order);
      return acc;
    },
    { ACCEPTED: [], PREPARING: [], READY: [] }
  );
}

function comparePriority(a: KitchenOrder, b: KitchenOrder) {
  const priorityA = statusPriority[a.status] ?? 99;
  const priorityB = statusPriority[b.status] ?? 99;

  if (priorityA !== priorityB) return priorityA - priorityB;

  const timeA = a.preparingAt ?? a.acceptedAt ?? a.createdAt;
  const timeB = b.preparingAt ?? b.acceptedAt ?? b.createdAt;

  return timeA.getTime() - timeB.getTime();
}
