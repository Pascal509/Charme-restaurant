import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function createAddress(params: {
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (params.isDefault) {
      await tx.address.updateMany({
        where: { userId: params.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return tx.address.create({
      data: {
        userId: params.userId,
        label: params.label,
        fullName: params.fullName,
        phone: params.phone,
        addressLine1: params.addressLine1,
        addressLine2: params.addressLine2 ?? undefined,
        city: params.city,
        state: params.state,
        country: params.country,
        postalCode: params.postalCode ?? undefined,
        latitude: new Prisma.Decimal(params.latitude),
        longitude: new Prisma.Decimal(params.longitude),
        isDefault: params.isDefault ?? false
      }
    });
  });
}

export async function updateAddress(params: {
  id: string;
  userId: string;
  label?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string | null;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.address.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== params.userId) {
      throw new Error("Address not found");
    }

    if (params.isDefault) {
      await tx.address.updateMany({
        where: { userId: params.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return tx.address.update({
      where: { id: params.id },
      data: {
        label: params.label,
        fullName: params.fullName,
        phone: params.phone,
        addressLine1: params.addressLine1,
        addressLine2: params.addressLine2 ?? undefined,
        city: params.city,
        state: params.state,
        country: params.country,
        postalCode: params.postalCode ?? undefined,
        latitude: params.latitude !== undefined ? new Prisma.Decimal(params.latitude) : undefined,
        longitude: params.longitude !== undefined ? new Prisma.Decimal(params.longitude) : undefined,
        isDefault: params.isDefault
      }
    });
  });
}

export async function deleteAddress(params: { id: string; userId: string }) {
  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== params.userId) {
    throw new Error("Address not found");
  }

  return prisma.address.delete({ where: { id: params.id } });
}

export async function listUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  });
}

export async function setDefaultAddress(params: { id: string; userId: string }) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const address = await tx.address.findUnique({ where: { id: params.id } });
    if (!address || address.userId !== params.userId) {
      throw new Error("Address not found");
    }

    await tx.address.updateMany({
      where: { userId: params.userId, isDefault: true },
      data: { isDefault: false }
    });

    return tx.address.update({
      where: { id: params.id },
      data: { isDefault: true }
    });
  });
}

export async function getUserAddressById(params: { id: string; userId: string }) {
  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== params.userId) {
    throw new Error("Address not found");
  }
  return address;
}
