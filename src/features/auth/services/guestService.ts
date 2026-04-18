import { prisma } from "@/lib/db";

export async function createGuestUser() {
  return prisma.user.create({
    data: {
      isGuest: true
    }
  });
}
