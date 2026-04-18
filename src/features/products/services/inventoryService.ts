import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const RESERVATION_TTL_MINUTES = 15;

export async function reserveProductStock(params: {
  productVariantId: string;
  quantity: number;
  orderId: string;
  tx?: Prisma.TransactionClient;
}) {
  const { productVariantId, quantity, orderId, tx } = params;
  const client = tx ?? prisma;

  const variant = await assertStockAvailable({
    productVariantId,
    quantity,
    tx: client
  });

  const updated = await client.productVariant.updateMany({
    where: { id: productVariantId, version: variant.version },
    data: {
      stockReserved: variant.stockReserved + quantity,
      version: variant.version + 1
    }
  });

  if (updated.count === 0) {
    throw new Error("Stock update conflict");
  }

  const reservedUntil = new Date();
  reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_TTL_MINUTES);

  await client.stockReservation.create({
    data: {
      orderId,
      productVariantId,
      quantity,
      reservedUntil
    }
  });

  return { reservedUntil };
}

export async function assertStockAvailable(params: {
  productVariantId: string;
  quantity: number;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const variant = await client.productVariant.findUnique({
    where: { id: params.productVariantId }
  });

  if (!variant || !variant.isActive) {
    throw new Error("Product unavailable");
  }

  const available = variant.stockOnHand - variant.stockReserved;
  if (available < params.quantity) {
    throw new Error("Insufficient stock");
  }

  return variant;
}

export async function releaseReservation(params: {
  orderId: string;
  tx?: Prisma.TransactionClient;
}) {
  const { orderId, tx } = params;
  const client = tx ?? prisma;
  const reservations = await client.stockReservation.findMany({
    where: { orderId, releasedAt: null }
  });

  for (const reservation of reservations) {
    const variant = await client.productVariant.findUnique({
      where: { id: reservation.productVariantId }
    });
    if (!variant) continue;

    await client.productVariant.updateMany({
      where: { id: variant.id, version: variant.version },
      data: {
        stockReserved: Math.max(0, variant.stockReserved - reservation.quantity),
        version: variant.version + 1
      }
    });

    await client.stockReservation.update({
      where: { id: reservation.id },
      data: { releasedAt: new Date() }
    });
  }
}

export async function releaseExpiredReservations(tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  const now = new Date();
  const expired = await client.stockReservation.findMany({
    where: { reservedUntil: { lt: now }, releasedAt: null }
  });

  for (const reservation of expired) {
    await releaseReservation({ orderId: reservation.orderId, tx: client });
  }
}
