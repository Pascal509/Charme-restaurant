import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getMenuByLocation(params: {
  locationCode: string;
  countryCode: string;
}) {
  return prisma.menu.findFirst({
    where: {
      isActive: true,
      locations: {
        some: {
          code: params.locationCode,
          isActive: true
        }
      }
    },
    include: {
      categories: true,
      items: true,
      locations: true
    }
  });
}

export async function isMenuItemAvailable(params: {
  menuItemId: string;
  locationId?: string;
  at?: Date;
}) {
  const now = params.at ?? new Date();
  const dayOfWeek = now.getDay();
  const time = now.toISOString().substring(11, 16);

  const availability = await prisma.menuAvailability.findMany({
    where: {
      menuItemId: params.menuItemId,
      isActive: true,
      dayOfWeek,
      OR: [{ locationId: params.locationId }, { locationId: null }]
    }
  });

  if (availability.length === 0) {
    return true;
  }

  return availability.some((window) => {
    return time >= window.startTime && time <= window.endTime;
  });
}

export async function createMenu(params: {
  name: string;
  description?: string;
  locationCodes: string[];
}) {
  return prisma.menu.create({
    data: {
      name: params.name,
      description: params.description,
      locations: {
        create: params.locationCodes.map((code) => ({ code, name: code }))
      }
    }
  });
}
export async function updateMenu(
  menuId: string,
  data: Prisma.MenuUpdateInput
) {
  return prisma.menu.update({
    where: { id: menuId },
    data
  });
}
