import { Money } from "@/lib/money";
import { findDeliveryZone, calculateDeliveryFee } from "@/features/restaurant/services/deliveryService";
import { prisma } from "@/lib/db";

export async function validateAddressWithinDeliveryZone(params: {
  restaurantId: string;
  addressId: string;
  userId: string;
}) {
  const address = await prisma.address.findUnique({ where: { id: params.addressId } });
  if (!address || address.userId !== params.userId) {
    throw new Error("Address not found");
  }

  const zone = await findDeliveryZone({
    restaurantId: params.restaurantId,
    location: {
      latitude: Number(address.latitude),
      longitude: Number(address.longitude)
    }
  });

  if (!zone) {
    throw new Error("Delivery address not supported");
  }

  return { address, zone };
}

export async function calculateDeliveryDistance(params: {
  restaurantId: string;
  addressId: string;
  userId: string;
}) {
  const address = await prisma.address.findUnique({ where: { id: params.addressId } });
  if (!address || address.userId !== params.userId) {
    throw new Error("Address not found");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
    select: { latitude: true, longitude: true }
  });

  if (!restaurant) throw new Error("Restaurant not configured");

  return distanceKm(
    Number(restaurant.latitude),
    Number(restaurant.longitude),
    Number(address.latitude),
    Number(address.longitude)
  );
}

export async function calculateDeliveryFeeForAddress(params: {
  restaurantId: string;
  addressId: string;
  userId: string;
  displayCurrency: string;
}) {
  const result = await validateAddressWithinDeliveryZone(params);

  const fee = await calculateDeliveryFee({
    zone: {
      deliveryFeeAmountMinor: result.zone.deliveryFeeAmountMinor,
      currency: result.zone.currency
    },
    displayCurrency: params.displayCurrency
  });

  return { fee, zone: result.zone, address: result.address } as {
    fee: Money;
    zone: { id: string; minimumOrderAmountMinor: number; currency: string };
    address: { id: string };
  };
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
