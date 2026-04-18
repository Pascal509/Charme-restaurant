import { NextResponse } from "next/server";
import { listKitchenOrders, groupKitchenOrdersByStatus } from "@/features/kitchen/services/kitchenService";
import { getPrimaryRestaurant } from "@/features/restaurant/services/restaurantService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const restaurantId = url.searchParams.get("restaurantId");

  const restaurant = restaurantId
    ? { id: restaurantId }
    : await getPrimaryRestaurant();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not configured" }, { status: 400 });
  }

  const orders = await listKitchenOrders(restaurant.id);
  const grouped = groupKitchenOrdersByStatus(orders);

  return NextResponse.json({ orders, grouped });
}
