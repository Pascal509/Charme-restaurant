import { prisma } from "@/lib/db";

export async function getPrimaryRestaurant() {
  return prisma.restaurant.findFirst({
    include: {
      settings: true,
      operatingHours: true,
      holidayHours: true
    }
  });
}

export async function getRestaurantById(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      settings: true,
      operatingHours: true,
      holidayHours: true
    }
  });
}
