import { prisma } from "@/lib/db";

const statusPriority: Record<string, number> = {
  PREPARING: 1,
  ACCEPTED: 2,
  READY: 3
};

export async function listKitchenOrders(restaurantId: string) {
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

  type KitchenOrder = Awaited<ReturnType<typeof listKitchenOrders>>[number];
  return orders.sort((a: KitchenOrder, b: KitchenOrder) => comparePriority(a, b));
}

export function groupKitchenOrdersByStatus(orders: Awaited<ReturnType<typeof listKitchenOrders>>) {
  type KitchenOrder = Awaited<ReturnType<typeof listKitchenOrders>>[number];
  return orders.reduce(
    (acc: { ACCEPTED: KitchenOrder[]; PREPARING: KitchenOrder[]; READY: KitchenOrder[] }, order: KitchenOrder) => {
      if (order.status === "ACCEPTED") acc.ACCEPTED.push(order);
      if (order.status === "PREPARING") acc.PREPARING.push(order);
      if (order.status === "READY") acc.READY.push(order);
      return acc;
    },
    { ACCEPTED: [], PREPARING: [], READY: [] }
  );
}

function comparePriority(
  a: Awaited<ReturnType<typeof listKitchenOrders>>[number],
  b: Awaited<ReturnType<typeof listKitchenOrders>>[number]
) {
  const priorityA = statusPriority[a.status] ?? 99;
  const priorityB = statusPriority[b.status] ?? 99;

  if (priorityA !== priorityB) return priorityA - priorityB;

  const timeA = a.preparingAt ?? a.acceptedAt ?? a.createdAt;
  const timeB = b.preparingAt ?? b.acceptedAt ?? b.createdAt;

  return timeA.getTime() - timeB.getTime();
}
