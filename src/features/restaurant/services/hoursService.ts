import type { Restaurant, OperatingHours, HolidayHours } from "@prisma/client";

export function isRestaurantOpen(params: {
  restaurant: Restaurant;
  operatingHours: OperatingHours[];
  holidayHours: HolidayHours[];
  at?: Date;
}) {
  const now = params.at ?? new Date();
  const dateKey = now.toISOString().substring(0, 10);
  const time = now.toISOString().substring(11, 16);

  const holiday = params.holidayHours.find((entry) =>
    entry.date.toISOString().startsWith(dateKey)
  );

  if (holiday) {
    if (holiday.isClosed) return false;
    if (holiday.openTime && holiday.closeTime) {
      return time >= holiday.openTime && time <= holiday.closeTime;
    }
  }

  const dayOfWeek = now.getDay();
  const hours = params.operatingHours.find((entry) => entry.dayOfWeek === dayOfWeek);
  if (!hours || hours.isClosed) return false;

  return time >= hours.openTime && time <= hours.closeTime;
}

export function assertRestaurantOpen(params: {
  restaurant: Restaurant;
  operatingHours: OperatingHours[];
  holidayHours: HolidayHours[];
  at?: Date;
}) {
  if (!isRestaurantOpen(params)) {
    throw new Error("Restaurant is currently closed");
  }
}
