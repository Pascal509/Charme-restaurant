import { prisma } from "@/lib/db";

export async function listPickupSlots(params: {
  restaurantId: string;
  date: Date;
}) {
  return prisma.pickupSlot.findMany({
    where: {
      restaurantId: params.restaurantId,
      date: params.date
    },
    orderBy: { startTime: "asc" }
  });
}

export async function generatePickupSlots(params: {
  restaurantId: string;
  date: Date;
  slotIntervalMins: number;
  preparationBufferMins: number;
  maxOrdersPerSlot: number;
  startTime: string;
  endTime: string;
}) {
  const slots = [] as Array<{ startTime: string; endTime: string }>;
  let cursor = params.startTime;

  while (cursor < params.endTime) {
    const end = addMinutes(cursor, params.slotIntervalMins);
    if (end > params.endTime) break;
    slots.push({ startTime: cursor, endTime: end });
    cursor = end;
  }

  return slots;
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const nextHour = Math.floor(total / 60);
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}
