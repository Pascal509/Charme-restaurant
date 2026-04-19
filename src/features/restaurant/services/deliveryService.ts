import { prisma } from "@/lib/db";
import { Money } from "@/lib/money";
import { convertFromBase, convertToBase } from "@/lib/fx/fxService";

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
};

export type DeliveryQueueGroup = {
  READY: Awaited<ReturnType<typeof listActiveDeliveryOrders>>;
  OUT_FOR_DELIVERY: Awaited<ReturnType<typeof listActiveDeliveryOrders>>;
};

export async function findDeliveryZone(params: {
  restaurantId: string;
  location: DeliveryLocation;
}) {
  type DeliveryZoneRecord = {
    id: string;
    radiusKm: number | string;
    deliveryFeeAmountMinor: number;
    minimumOrderAmountMinor: number;
    currency: string;
  };

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
    select: { latitude: true, longitude: true }
  });

  if (!restaurant) return null;

  const zones = (await prisma.deliveryZone.findMany({
    where: { restaurantId: params.restaurantId },
    select: {
      id: true,
      radiusKm: true,
      deliveryFeeAmountMinor: true,
      minimumOrderAmountMinor: true,
      currency: true
    }
  })).map((zone) => ({
    id: zone.id,
    radiusKm: Number(zone.radiusKm),
    deliveryFeeAmountMinor: zone.deliveryFeeAmountMinor,
    minimumOrderAmountMinor: zone.minimumOrderAmountMinor,
    currency: zone.currency
  })) satisfies DeliveryZoneRecord[];

  if (zones.length === 0) return null;

  const match = zones.find((zone) => {
    const distance = distanceKm(
      Number(restaurant.latitude),
      Number(restaurant.longitude),
      params.location.latitude,
      params.location.longitude
    );
    return distance <= Number(zone.radiusKm);
  });

  return match ?? null;
}

export async function calculateDeliveryFee(params: {
  zone: {
    deliveryFeeAmountMinor: number;
    currency: string;
  };
  displayCurrency: string;
}) {
  if (params.zone.currency === params.displayCurrency) {
    return new Money(params.zone.deliveryFeeAmountMinor, params.displayCurrency);
  }

  const zoneMoney = new Money(params.zone.deliveryFeeAmountMinor, params.zone.currency);
  const baseMoney = await convertToBase(zoneMoney);

  if (baseMoney.money.currency === params.displayCurrency) {
    return baseMoney.money;
  }

  const converted = await convertFromBase(baseMoney.money, params.displayCurrency);
  return converted.money;
}

export async function validateMinimumOrder(params: {
  zone: {
    minimumOrderAmountMinor: number;
    currency: string;
  };
  subtotal: Money;
}) {
  const zoneMinimum = await convertMoney(
    new Money(params.zone.minimumOrderAmountMinor, params.zone.currency),
    params.subtotal.currency
  );

  if (params.subtotal.amountMinor < zoneMinimum.amountMinor) {
    throw new Error("Minimum order not met");
  }
}

export async function listActiveDeliveryOrders(restaurantId: string) {
  return prisma.order.findMany({
    where: {
      restaurantId,
      orderType: "DELIVERY",
      status: { in: ["READY", "OUT_FOR_DELIVERY"] }
    },
    orderBy: [{ status: "asc" }, { readyAt: "asc" }, { createdAt: "asc" }],
    include: { items: true }
  });
}

export function groupDeliveryOrdersByStatus(orders: Awaited<ReturnType<typeof listActiveDeliveryOrders>>) {
  type DeliveryOrder = Awaited<ReturnType<typeof listActiveDeliveryOrders>>[number];

  return orders.reduce(
    (acc: { READY: DeliveryOrder[]; OUT_FOR_DELIVERY: DeliveryOrder[] }, order: DeliveryOrder) => {
      if (order.status === "READY") {
        acc.READY.push(order);
      } else if (order.status === "OUT_FOR_DELIVERY") {
        acc.OUT_FOR_DELIVERY.push(order);
      }
      return acc;
    },
    { READY: [], OUT_FOR_DELIVERY: [] }
  );
}

async function convertMoney(money: Money, targetCurrency: string) {
  if (money.currency === targetCurrency) return money;

  const baseMoney = await convertToBase(money);
  if (baseMoney.money.currency === targetCurrency) return baseMoney.money;

  const converted = await convertFromBase(baseMoney.money, targetCurrency);
  return converted.money;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radiusEarth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusEarth * c;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
